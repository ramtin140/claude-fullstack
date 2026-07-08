import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Zap, Banknote } from 'lucide-react';
import { api } from '../api/client.js';
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
};

const withdrawalStatusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const withdrawalStatusBadge = { pending: 'badge-waiting', paid: 'badge-live', rejected: 'badge-finished' };

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
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-soft)', fontSize: '0.85rem' }}>
              <span>
                {r.ticket_amount} تیکت ({r.cash_amount.toLocaleString('fa-IR')} تومان) — {formatDateTime(r.created_at)}
              </span>
              <span className={`badge ${withdrawalStatusBadge[r.status]}`}>{withdrawalStatusLabel[r.status]}</span>
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
