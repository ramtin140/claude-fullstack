import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/pages.css';
import '../styles/support.css';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusBadge = { open: 'badge-waiting', answered: 'badge-live', closed: 'badge-finished' };

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
    <div className="page-wrap">
      <div className="page-header">
        <h1>
          <LifeBuoy size={22} style={{ verticalAlign: 'middle' }} /> پشتیبانی
        </h1>
        <p>سوالات و مشکلات خود را در هر بخش از سایت با پشتیبانی در میان بگذارید</p>
      </div>
      <div className="container" style={{ paddingBottom: 60, maxWidth: 640 }}>
        <form className="card" style={{ padding: 24, marginBottom: 24 }} onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>ثبت تیکت جدید</h3>
          <div className="form-field">
            <label>بخش مربوطه</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>موضوع</label>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="form-field">
            <label>توضیحات</label>
            <textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
            ارسال تیکت
          </button>
        </form>

        <h3 style={{ color: 'var(--gold)' }}>تیکت‌های من</h3>
        {tickets.length === 0 ? (
          <div className="empty-state">هنوز تیکتی ثبت نکرده‌اید.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tickets.map((t) => (
              <Link key={t.id} to={`/support/${t.id}`} className="card support-ticket-row">
                <span>{t.subject}</span>
                <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
