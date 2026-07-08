import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Zap, Banknote, Paperclip, Wallet as WalletIcon } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime } from '../utils/datetime.js';
import '../styles/pages.css';

const reasonLabel = {
  match_stake: 'شرط‌بندی مسابقه',
  match_refund: 'بازگشت شرط (تساوی)',
  match_reward: 'جایزه برد',
  admin_adjustment: 'تنظیم توسط ادمین',
  withdrawal_request: 'درخواست برداشت',
  withdrawal_refund: 'بازگشت درخواست برداشت رد‌شده',
  deposit_approved: 'شارژ کیف پول',
};

const withdrawalStatusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const withdrawalStatusBadge = { pending: 'badge-waiting', paid: 'badge-live', rejected: 'badge-finished' };

const depositStatusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const depositStatusBadge = { pending: 'badge-waiting', approved: 'badge-live', rejected: 'badge-finished' };
const methodTypeLabel = { card_to_card: 'کارت به کارت', bank_account: 'واریز به حساب' };

function DepositSection({ refreshWallet }) {
  const [methods, setMethods] = useState([]);
  const [rate, setRate] = useState(10000);
  const [requests, setRequests] = useState([]);
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get('/payment-methods').then(({ data }) => {
      setMethods(data.methods);
      if (data.methods.length && !methodId) setMethodId(String(data.methods[0].id));
    });
    api.get('/deposits/rate').then(({ data }) => setRate(data.rate));
    api.get('/deposits/mine').then(({ data }) => setRequests(data.requests));
  }

  useEffect(load, []);

  const selectedMethod = methods.find((m) => String(m.id) === methodId);
  const cashAmount = Number(amount || 0);
  const feeAmount = selectedMethod ? Math.round(selectedMethod.fee_fixed + (cashAmount * selectedMethod.fee_percent) / 100) : 0;
  const ticketPreview = selectedMethod && cashAmount > 0 ? Math.max(0, Math.floor((cashAmount - feeAmount) / rate)) : 0;

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!file) {
      setError('لطفاً تصویر رسید واریز را ضمیمه کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payment_method_id', methodId);
      formData.append('cash_amount', cashAmount);
      formData.append('reference_note', note);
      formData.append('receipt_file', file);
      const { data } = await api.post('/deposits', formData);
      setMessage(`درخواست شارژ ثبت شد. پس از تایید مدیر، ${data.request.ticket_amount} تیکت به کیف پول شما اضافه می‌شود.`);
      setAmount('');
      setNote('');
      setFile(null);
      load();
      refreshWallet();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت درخواست شارژ');
    } finally {
      setSubmitting(false);
    }
  }

  if (methods.length === 0) return null;

  return (
    <div className="card" style={{ padding: 20, marginBottom: 32 }}>
      <h3 style={{ marginTop: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <WalletIcon size={18} /> شارژ کیف پول
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>نرخ فعلی: هر تیکت = {rate.toLocaleString('fa-IR')} تومان</p>

      <form onSubmit={submit}>
        <div className="form-field">
          <label>روش پرداخت</label>
          <select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({methodTypeLabel[m.type]})
              </option>
            ))}
          </select>
        </div>

        {selectedMethod && (
          <div style={{ background: 'var(--bg-darker)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: '0.85rem' }}>
            {selectedMethod.type === 'card_to_card' ? (
              <>
                <div>شماره کارت: <span style={{ fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>{selectedMethod.card_number}</span></div>
                {selectedMethod.card_holder_name && <div>به نام: {selectedMethod.card_holder_name}</div>}
              </>
            ) : (
              <>
                <div>شماره شبا: <span style={{ fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>{selectedMethod.iban}</span></div>
                {selectedMethod.account_holder_name && <div>به نام: {selectedMethod.account_holder_name}</div>}
                {selectedMethod.bank_name && <div>بانک: {selectedMethod.bank_name}</div>}
              </>
            )}
            {selectedMethod.instructions && <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>{selectedMethod.instructions}</div>}
            <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
              حداقل {selectedMethod.min_amount.toLocaleString('fa-IR')} تومان
              {selectedMethod.max_amount ? ` — حداکثر ${selectedMethod.max_amount.toLocaleString('fa-IR')} تومان` : ''}
            </div>
          </div>
        )}

        <div className="form-field">
          <label>مبلغ واریزی (تومان)</label>
          <input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        {cashAmount > 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: -10 }}>
            کارمزد: {feeAmount.toLocaleString('fa-IR')} تومان — تیکت قابل شارژ: تقریباً {ticketPreview}
          </p>
        )}

        <div className="form-field">
          <label>تصویر رسید واریز (الزامی)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        <div className="form-field">
          <label>توضیح یا کد پیگیری (اختیاری)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'در حال ثبت...' : 'ثبت درخواست شارژ'}
        </button>
      </form>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {requests.length > 0 && (
        <div style={{ marginTop: 18 }}>
          {requests.map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>
                  {r.cash_amount.toLocaleString('fa-IR')} تومان ({methodTypeLabel[r.method_type]}) — {formatDateTime(r.created_at)}
                </span>
                <span className={`badge ${depositStatusBadge[r.status]}`}>{depositStatusLabel[r.status]}</span>
              </div>
              {r.status === 'approved' && <div style={{ color: '#4ade80', marginTop: 6 }}>{r.ticket_amount} تیکت اضافه شد</div>}
              {r.admin_notes && <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>یادداشت مدیر: {r.admin_notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WithdrawalSection({ ticketBalance, iban, refreshWallet }) {
  const [rate, setRate] = useState(10000);
  const [amount, setAmount] = useState(1);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/withdrawals/rate').then(({ data }) => setRate(data.rate));
    api.get('/withdrawals/mine').then(({ data }) => setRequests(data.requests));
  }

  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.post('/withdrawals', { ticket_amount: Number(amount) });
      setMessage(`درخواست برداشت به مبلغ ${data.request.cash_amount.toLocaleString('fa-IR')} تومان ثبت شد.`);
      load();
      refreshWallet();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت درخواست برداشت');
    }
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 32 }}>
      <h3 style={{ marginTop: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Banknote size={18} /> برداشت تیکت به نقد
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        نرخ فعلی: هر تیکت = {rate.toLocaleString('fa-IR')} تومان
      </p>

      {!iban ? (
        <p className="error-text">
          برای ثبت درخواست برداشت، ابتدا شماره شبا خود را در <Link to="/profile">پروفایل</Link> ثبت کنید.
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>تعداد تیکت</label>
            <input type="number" min={1} max={ticketBalance} required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ≈ {(Number(amount || 0) * rate).toLocaleString('fa-IR')} تومان
          </span>
          <button className="btn btn-primary" type="submit">
            ثبت درخواست برداشت
          </button>
        </form>
      )}
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {requests.length > 0 && (
        <div style={{ marginTop: 18 }}>
          {requests.map((r) => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-soft)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span>
                  {r.ticket_amount} تیکت ({r.cash_amount.toLocaleString('fa-IR')} تومان) — {formatDateTime(r.created_at)}
                </span>
                <span className={`badge ${withdrawalStatusBadge[r.status]}`}>{withdrawalStatusLabel[r.status]}</span>
              </div>
              {r.admin_notes && (
                <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                  یادداشت مدیر: {r.admin_notes}
                </div>
              )}
              {r.receipt_url && (
                <a
                  href={assetUrl(r.receipt_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="badge badge-waiting"
                  style={{ marginTop: 6, display: 'inline-flex', gap: 4 }}
                >
                  <Paperclip size={12} /> مشاهده فیش پرداخت
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);

  function loadWallet() {
    api.get('/wallet/me').then(({ data }) => setData(data));
  }

  useEffect(loadWallet, []);

  function refreshWallet() {
    loadWallet();
    refreshUser();
  }

  if (!data) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  const { wallet, transactions } = data;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>کیف پول من</h1>
        <p>موجودی تیکت، اکسپرینس و تاریخچه تراکنش‌ها</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="dashboard-grid">
          <div className="card dashboard-stat">
            <Coins color="var(--gold)" />
            <div className="value">{wallet.ticket_balance}</div>
            <div className="label">موجودی تیکت</div>
          </div>
          <div className="card dashboard-stat">
            <Zap color="var(--gold)" />
            <div className="value">{wallet.xp}</div>
            <div className="label">اکسپرینس (XP)</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value" style={{ color: 'var(--gold)' }}>{wallet.grade}</div>
            <div className="label">گرید فصلی ({wallet.season_points} امتیاز)</div>
          </div>
        </div>

        <DepositSection refreshWallet={refreshWallet} />
        <WithdrawalSection ticketBalance={wallet.ticket_balance} iban={user.iban} refreshWallet={refreshWallet} />

        <h3 style={{ color: 'var(--gold)' }}>تراکنش‌های اخیر</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">هنوز تراکنشی ثبت نشده است.</div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ارز</th>
                  <th>مقدار</th>
                  <th>دلیل</th>
                  <th>موجودی پس از تراکنش</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.currency === 'ticket' ? 'تیکت' : 'XP'}</td>
                    <td style={{ color: t.amount >= 0 ? '#4ade80' : '#ff6b81' }}>
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td>{reasonLabel[t.reason] || t.reason}</td>
                    <td>{t.balance_after}</td>
                    <td>{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
