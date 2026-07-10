import { useEffect, useState } from 'react';
import { Film, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/datetime.js';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusVariant = { pending: 'waiting', approved: 'success', rejected: 'critical' };

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

export default function GoalClips() {
  const [clips, setClips] = useState([]);
  const [form, setForm] = useState({ clip_url: '', description: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/goal-clips/mine').then(({ data }) => setClips(data.clips));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.post('/goal-clips', form);
      setMessage('کلیپ شما ثبت شد و در انتظار بررسی است.');
      setForm({ clip_url: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت کلیپ');
    }
  }

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-gold">
          <Film size={22} /> کلیپ گل و کد تخفیف
        </h1>
        <p className="text-ink-muted">لینک کلیپ گل خود را ارسال کنید — در صورت تایید، کد تخفیف دریافت می‌کنید</p>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-16 pt-4 md:px-6">
        <Card className="mb-6 p-6">
          <h3 className="mb-4 mt-0 text-lg font-bold text-gold">ارسال کلیپ جدید</h3>
          <form onSubmit={handleSubmit}>
            <FormField label="لینک کلیپ (اینستاگرام، یوتیوب، آپارات و ...)">
              <Input
                required
                type="url"
                dir="ltr"
                placeholder="https://..."
                value={form.clip_url}
                onChange={(e) => setForm({ ...form, clip_url: e.target.value })}
                className="rounded-md text-end"
              />
            </FormField>
            <FormField label="توضیحات (اختیاری)">
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={fieldClass} />
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
              ارسال کلیپ
            </Button>
          </form>
        </Card>

        <h3 className="mb-3 text-lg font-bold text-gold">کلیپ‌های من</h3>
        {clips.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">هنوز کلیپی ارسال نکرده‌اید.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {clips.map((c) => (
              <div key={c.id} className="flex flex-col gap-1.5 rounded-md border border-border bg-surface px-5 py-4">
                <div className="flex w-full items-center justify-between gap-3">
                  <a href={c.clip_url} target="_blank" rel="noreferrer" dir="ltr" className="truncate text-sm text-gold hover:underline">
                    {c.clip_url}
                  </a>
                  <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                </div>
                <span className="text-xs text-ink-faint">{formatDateTime(c.created_at)}</span>
                {c.status === 'approved' && <span className="font-mono text-sm font-bold text-gold">کد تخفیف: {c.discount_code}</span>}
                {c.status === 'rejected' && c.admin_notes && <span className="text-[13px] text-ink-muted">دلیل: {c.admin_notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
