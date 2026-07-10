import { useState } from 'react';
import { Mail, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { cn } from '../lib/utils.js';

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">تماس با ما</h1>
        <p className="text-ink-muted">سوالی دارید؟ برای ما پیام بگذارید</p>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 pb-16 pt-4 md:grid-cols-[2fr_1fr] md:px-6">
        <div className="mx-auto w-full max-w-[560px] md:mx-0">
          {sent ? (
            <p className="flex items-center justify-center gap-2 py-10 text-center font-medium text-success">
              <CheckCircle2 size={18} />
              پیام شما با موفقیت ارسال شد. تیم پشتیبانی در اسرع وقت با شما تماس می‌گیرد.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">نام</label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-md" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">ایمیل</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-md"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">پیام</label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className={cn(fieldClass, 'resize-y')}
                />
              </div>
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-critical">
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}
              <Button disabled={submitting} className="w-fit">
                {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
              </Button>
            </form>
          )}
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-base font-bold text-gold">راه‌های ارتباطی</h3>
          <div className="flex flex-col gap-4 text-sm text-ink-muted">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-gold" /> info@fifasoul.example
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-gold" /> تهران، ایران
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-gold" /> پاسخ‌گویی معمولاً ظرف ۲۴ ساعت کاری
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
