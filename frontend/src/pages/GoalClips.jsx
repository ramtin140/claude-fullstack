import { useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import { api } from '../api/client.js';
import { formatDateTime } from '../utils/datetime.js';
import '../styles/pages.css';
import '../styles/support.css';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusBadge = { pending: 'badge-waiting', approved: 'badge-live', rejected: 'badge-finished' };

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
    <div className="page-wrap">
      <div className="page-header">
        <h1>
          <Film size={22} style={{ verticalAlign: 'middle' }} /> کلیپ گل و کد تخفیف
        </h1>
        <p>لینک کلیپ گل خود را ارسال کنید — در صورت تایید، کد تخفیف دریافت می‌کنید</p>
      </div>
      <div className="container" style={{ paddingBottom: 60, maxWidth: 640 }}>
        <form className="card" style={{ padding: 24, marginBottom: 24 }} onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>ارسال کلیپ جدید</h3>
          <div className="form-field">
            <label>لینک کلیپ (اینستاگرام، یوتیوب، آپارات و ...)</label>
            <input
              required
              type="url"
              placeholder="https://..."
              value={form.clip_url}
              onChange={(e) => setForm({ ...form, clip_url: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>توضیحات (اختیاری)</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
            ارسال کلیپ
          </button>
        </form>

        <h3 style={{ color: 'var(--gold)' }}>کلیپ‌های من</h3>
        {clips.length === 0 ? (
          <div className="empty-state">هنوز کلیپی ارسال نکرده‌اید.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {clips.map((c) => (
              <div key={c.id} className="card support-ticket-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <a href={c.clip_url} target="_blank" rel="noreferrer">
                    {c.clip_url}
                  </a>
                  <span className={`badge ${statusBadge[c.status]}`}>{statusLabel[c.status]}</span>
                </div>
                <span className="ticket-date">{formatDateTime(c.created_at)}</span>
                {c.status === 'approved' && (
                  <span className="ticket-number">کد تخفیف: {c.discount_code}</span>
                )}
                {c.status === 'rejected' && c.admin_notes && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>دلیل: {c.admin_notes}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
