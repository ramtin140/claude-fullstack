import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', psn_id: '', xbox_id: '', steam_id: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasConsoleId = Boolean(form.psn_id || form.xbox_id || form.steam_id);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, {
        psn_id: form.psn_id || undefined,
        xbox_id: form.xbox_id || undefined,
        steam_id: form.steam_id || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'ثبت‌نام ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>ثبت‌نام در FIFA SOUL</h1>
        <p className="subtitle">همین حالا عضو شو و اولین مسابقه‌ات را شروع کن</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>نام و نام خانوادگی</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>ایمیل</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>رمز عبور</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 12px' }}>
            اگر شناسه کنسول دارید وارد کنید (برای شناسایی در بازبینی کارشناسی مهم است). در غیر این صورت به‌عنوان
            کاربر مهمان (Guest) ثبت‌نام می‌شوید و می‌توانید مسابقات آفلاین ثبت کنید.
          </p>
          <div className="form-field">
            <label>PSN ID (اختیاری)</label>
            <input value={form.psn_id} onChange={(e) => setForm({ ...form, psn_id: e.target.value })} />
          </div>
          <div className="form-field">
            <label>XBOX ID (اختیاری)</label>
            <input value={form.xbox_id} onChange={(e) => setForm({ ...form, xbox_id: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Steam ID (اختیاری)</label>
            <input value={form.steam_id} onChange={(e) => setForm({ ...form, steam_id: e.target.value })} />
          </div>
          {!hasConsoleId && (
            <p className="success-text" style={{ marginBottom: 14 }}>
              بدون شناسه کنسول، به‌صورت کاربر مهمان (Guest) ثبت‌نام خواهید شد.
            </p>
          )}

          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        <p className="auth-switch">
          قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login">وارد شوید</Link>
        </p>
      </div>
    </div>
  );
}
