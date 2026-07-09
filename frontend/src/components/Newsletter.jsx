import { useState } from 'react';
import { MessageSquareText, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';

export default function Newsletter() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await api.post('/newsletter', { phone });
      setMessage('عضویت شما با موفقیت ثبت شد!');
      setPhone('');
    } catch (err) {
      setError(err.response?.data?.error || 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-bg-soft py-16 md:py-20">
      <div className="mx-auto flex max-w-[560px] flex-col items-center px-4 text-center md:px-6">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
          <MessageSquareText size={22} />
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-ink md:text-3xl">عضویت در اطلاع‌رسانی پیامکی</h2>
        <p className="mb-7 text-sm leading-7 text-ink-muted">
          جهت دریافت اخبار مسابقات و پیشنهادات ویژه بازی، شماره موبایل خود را وارد کنید.
        </p>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
          <Input
            type="tel"
            placeholder="09xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? 'در حال ارسال...' : 'عضویت'}
          </Button>
        </form>

        <p className="mt-4 flex items-start justify-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          <span className="max-w-xs text-start">
            با ثبت شماره، فقط پیامک‌های مربوط به مسابقات و تخفیف‌های فیفاسول دریافت می‌کنید. شماره شما نزد ما محرمانه
            می‌ماند.
          </span>
        </p>

        {message && (
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={15} />
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-critical">
            <AlertCircle size={15} />
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
