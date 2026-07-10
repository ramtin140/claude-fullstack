import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/datetime.js';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusVariant = { open: 'waiting', answered: 'live', closed: 'finished' };

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

export default function SupportPage() {
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: 'other', subject: '', body: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  function load() {
    api.get('/support/mine').then(({ data }) => setTickets(data.tickets));
  }

  useEffect(() => {
    api.get('/support/categories').then(({ data }) => setCategories(data.categories));
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.post('/support', form);
      setMessage('تیکت شما ثبت شد. پشتیبانی به‌زودی پاسخ می‌دهد.');
      setForm({ category: 'other', subject: '', body: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت تیکت');
    }
  }

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-gold">
          <LifeBuoy size={22} /> پشتیبانی
        </h1>
        <p className="text-ink-muted">سوالات و مشکلات خود را در هر بخش از سایت با پشتیبانی در میان بگذارید</p>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-16 pt-4 md:px-6">
        <Card className="mb-6 p-6">
          <h3 className="mb-4 mt-0 text-lg font-bold text-gold">ثبت تیکت جدید</h3>
          <form onSubmit={handleSubmit}>
            <FormField label="بخش مربوطه">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldClass}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="موضوع">
              <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="توضیحات">
              <textarea
                required
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={fieldClass}
              />
            </FormField>
            {error && (
              <p className="mb-4 flex items-center gap-1.5 text-sm text-critical">
                <AlertCircle size={14} /> {error}
              </p>
            )}
            {message && (
              <p className="mb-4 flex items-center gap-1.5 text-sm text-success">
                <CheckCircle2 size={14} /> {message}
              </p>
            )}
            <Button type="submit" className="w-full">
              ارسال تیکت
            </Button>
          </form>
        </Card>

        <h3 className="mb-3 text-lg font-bold text-gold">تیکت‌های من</h3>
        {tickets.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">هنوز تیکتی ثبت نکرده‌اید.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tickets.map((t) => (
              <Link
                key={t.id}
                to={`/support/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-5 py-4 text-ink transition-colors hover:border-gold"
              >
                <span className="min-w-0 text-sm">
                  <span className="font-mono font-bold text-gold">#{t.id}</span> {t.subject}
                  <span className="text-ink-faint"> — {formatDateTime(t.created_at)}</span>
                </span>
                <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
