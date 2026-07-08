import { useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/pages.css';

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
    <div className="page-wrap">
      <div className="page-header">
        <h1>تماس با ما</h1>
        <p>سوالی دارید؟ برای ما پیام بگذارید</p>
      </div>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, paddingBottom: 60 }}>
        <div className="contact-form">
          {sent ? (
            <p className="success-text" style={{ textAlign: 'center' }}>
              پیام شما با موفقیت ارسال شد. تیم پشتیبانی در اسرع وقت با شما تماس می‌گیرد.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>نام</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>ایمیل</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>پیام</label>
                <textarea rows={5} required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
              </button>
            </form>
          )}
        </div>

        <div className="card" style={{ padding: 20, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>راه‌های ارتباطی</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={16} color="var(--gold)" /> info@fifasoul.example
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={16} color="var(--gold)" /> تهران، ایران
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color="var(--gold)" /> پاسخ‌گویی معمولاً ظرف ۲۴ ساعت کاری
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
