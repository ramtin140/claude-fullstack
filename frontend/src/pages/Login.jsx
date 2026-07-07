import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isStaff } from '../components/ProtectedRoute.jsx';
import '../styles/auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(isStaff(user) ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'ورود ناموفق بود.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>ورود به حساب کاربری</h1>
        <p className="subtitle">برای شرکت در مسابقات وارد شوید</p>

        <form onSubmit={handleSubmit}>
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
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="auth-switch">
          حساب کاربری ندارید؟ <Link to="/register">ثبت‌نام کنید</Link>
        </p>
        <p className="auth-switch" style={{ fontSize: '0.78rem' }}>
          دسترسی‌های آزمایشی: admin@fifasoul.test (مدیر ارشد) / writer@fifasoul.test (نویسنده) / expert@fifasoul.test
          (کارشناس) — رمز همه: admin123
        </p>
      </div>
    </div>
  );
}
