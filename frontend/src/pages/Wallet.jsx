import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Zap, Banknote, Paperclip, Wallet as WalletIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime } from '../utils/datetime.js';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const reasonLabel = {
  match_stake: 'ورودی مسابقه',
  match_refund: 'بازگشت ورودی (تساوی)',
  match_reward: 'جایزه برد',
  admin_adjustment: 'تنظیم توسط ادمین',
  withdrawal_request: 'درخواست برداشت',
  withdrawal_refund: 'بازگشت درخواست برداشت رد‌شده',
  deposit_approved: 'شارژ کیف پول',
};

const withdrawalStatusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const withdrawalStatusBadge = { pending: 'waiting', paid: 'live', rejected: 'finished' };

const depositStatusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const depositStatusBadge = { pending: 'waiting', approved: 'live', rejected: 'finished' };
const methodTypeLabel = { card_to_card: 'کارت به کارت', bank_account: 'واریز به حساب' };

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

function FormField({ label, children }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label className="text-[13px] text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

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
    <Card className="mb-8 p-5">
      <h3 className="mb-1.5 flex items-center gap-2 text-base font-bold text-gold">
        <WalletIcon size={18} /> شارژ کیف پول
      </h3>
      <p className="mb-4 text-[13px] text-ink-muted">نرخ فعلی: هر تیکت = {rate.toLocaleString('fa-IR')} تومان</p>

      <form onSubmit={submit}>
        <FormField label="روش پرداخت">
          <select value={methodId} onChange={(e) => setMethodId(e.target.value)} className={fieldClass}>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({methodTypeLabel[m.type]})
              </option>
            ))}
          </select>
        </FormField>

        {selectedMethod && (
          <div className="mb-4 rounded-[10px] border border-border bg-bg-soft p-3.5 text-[13px] text-ink">
            {selectedMethod.type === 'card_to_card' ? (
              <>
                <div>
                  شماره کارت: <span className="inline-block font-mono" dir="ltr">{selectedMethod.card_number}</span>
                </div>
                {selectedMethod.card_holder_name && <div>به نام: {selectedMethod.card_holder_name}</div>}
              </>
            ) : (
              <>
                <div>
                  شماره شبا: <span className="inline-block font-mono" dir="ltr">{selectedMethod.iban}</span>
                </div>
                {selectedMethod.account_holder_name && <div>به نام: {selectedMethod.account_holder_name}</div>}
                {selectedMethod.bank_name && <div>بانک: {selectedMethod.bank_name}</div>}
              </>
            )}
            {selectedMethod.instructions && <div className="mt-1.5 text-ink-muted">{selectedMethod.instructions}</div>}
            <div className="mt-1.5 text-ink-muted">
              حداقل {selectedMethod.min_amount.toLocaleString('fa-IR')} تومان
              {selectedMethod.max_amount ? ` — حداکثر ${selectedMethod.max_amount.toLocaleString('fa-IR')} تومان` : ''}
            </div>
          </div>
        )}

        <FormField label="مبلغ واریزی (تومان)">
          <Input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-md" />
        </FormField>
        {cashAmount > 0 && (
          <p className="-mt-2.5 mb-4 text-[13px] text-ink-muted">
            کارمزد: {feeAmount.toLocaleString('fa-IR')} تومان — تیکت قابل شارژ: تقریباً {ticketPreview}
          </p>
        )}

        <FormField label="تصویر رسید واریز (الزامی)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            required
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="text-sm text-ink-muted file:me-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3.5 file:py-2 file:text-[13px] file:text-ink"
          />
        </FormField>

        <FormField label="توضیح یا کد پیگیری (اختیاری)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="rounded-md" />
        </FormField>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'در حال ثبت...' : 'ثبت درخواست شارژ'}
        </Button>
      </form>

      {message && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 size={15} /> {message}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-critical">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {requests.length > 0 && (
        <div className="mt-4">
          {requests.map((r) => (
            <div key={r.id} className="border-b border-border py-2.5 text-[13px] last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-ink-muted">
                  {r.cash_amount.toLocaleString('fa-IR')} تومان ({methodTypeLabel[r.method_type]}) — {formatDateTime(r.created_at)}
                </span>
                <Badge variant={depositStatusBadge[r.status]}>{depositStatusLabel[r.status]}</Badge>
              </div>
              {r.status === 'approved' && <div className="mt-1.5 text-success">{r.ticket_amount} تیکت اضافه شد</div>}
              {r.admin_notes && <div className="mt-1.5 text-ink-muted">یادداشت مدیر: {r.admin_notes}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
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
    <Card className="mb-8 p-5">
      <h3 className="mb-1.5 flex items-center gap-2 text-base font-bold text-gold">
        <Banknote size={18} /> برداشت تیکت به نقد
      </h3>
      <p className="mb-4 text-[13px] text-ink-muted">نرخ فعلی: هر تیکت = {rate.toLocaleString('fa-IR')} تومان</p>

      {!iban ? (
        <p className="flex items-center gap-1.5 text-sm text-critical">
          <AlertCircle size={14} />
          برای ثبت درخواست برداشت، ابتدا شماره شبا خود را در{' '}
          <Link to="/profile" className="underline">
            پروفایل
          </Link>{' '}
          ثبت کنید.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2.5">
          <div className="mb-0 flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-muted">تعداد تیکت</label>
            <Input
              type="number"
              min={1}
              max={ticketBalance}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32 rounded-md"
            />
          </div>
          <span className="pb-3 text-[13px] text-ink-muted">≈ {(Number(amount || 0) * rate).toLocaleString('fa-IR')} تومان</span>
          <Button type="submit">ثبت درخواست برداشت</Button>
        </form>
      )}
      {message && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 size={15} /> {message}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-critical">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {requests.length > 0 && (
        <div className="mt-4">
          {requests.map((r) => (
            <div key={r.id} className="border-b border-border py-2.5 text-[13px] last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-ink-muted">
                  {r.ticket_amount} تیکت ({r.cash_amount.toLocaleString('fa-IR')} تومان) — {formatDateTime(r.created_at)}
                </span>
                <Badge variant={withdrawalStatusBadge[r.status]}>{withdrawalStatusLabel[r.status]}</Badge>
              </div>
              {r.admin_notes && <div className="mt-1.5 text-ink-muted">یادداشت مدیر: {r.admin_notes}</div>}
              {r.receipt_url && (
                <a
                  href={assetUrl(r.receipt_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold"
                >
                  <Paperclip size={12} /> مشاهده فیش پرداخت
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
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

  if (!data) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  const { wallet, transactions } = data;

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">کیف پول من</h1>
        <p className="text-ink-muted">موجودی تیکت، اکسپرینس و تاریخچه تراکنش‌ها</p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 md:px-6">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <Coins size={20} className="mb-1 text-gold" />
            <div className="text-2xl font-extrabold tabular-nums text-gold">{wallet.ticket_balance}</div>
            <div className="text-[13px] text-ink-muted">موجودی تیکت</div>
          </Card>
          <Card className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <Zap size={20} className="mb-1 text-gold" />
            <div className="text-2xl font-extrabold tabular-nums text-gold">{wallet.xp}</div>
            <div className="text-[13px] text-ink-muted">اکسپرینس (XP)</div>
          </Card>
          <Card className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <div className="text-2xl font-extrabold text-gold">{wallet.grade}</div>
            <div className="text-[13px] text-ink-muted">گرید فصلی ({wallet.season_points} امتیاز)</div>
          </Card>
        </div>

        <DepositSection refreshWallet={refreshWallet} />
        <WithdrawalSection ticketBalance={wallet.ticket_balance} iban={user.iban} refreshWallet={refreshWallet} />

        <h3 className="mb-4 text-lg font-bold text-gold">تراکنش‌های اخیر</h3>
        {transactions.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-faint">هنوز تراکنشی ثبت نشده است.</div>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-ink-muted">
                  <th className="px-4 py-3 text-start font-semibold">ارز</th>
                  <th className="px-4 py-3 text-start font-semibold">مقدار</th>
                  <th className="px-4 py-3 text-start font-semibold">دلیل</th>
                  <th className="px-4 py-3 text-start font-semibold">موجودی پس از تراکنش</th>
                  <th className="px-4 py-3 text-start font-semibold">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border text-ink last:border-b-0">
                    <td className="px-4 py-3">{t.currency === 'ticket' ? 'تیکت' : 'XP'}</td>
                    <td className={t.amount >= 0 ? 'px-4 py-3 text-success' : 'px-4 py-3 text-critical'}>
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{reasonLabel[t.reason] || t.reason}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.balance_after}</td>
                    <td className="px-4 py-3 text-ink-muted">{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
