import { useState } from 'react';
import { api } from '../api/client.js';
import '../styles/home.css';

export default function Newsletter() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.post('/newsletter', { phone });
      setMessage('عضویت شما با موفقیت ثبت شد!');
      setPhone('');
    } catch (err) {
      setError(err.response?.data?.error || 'خطایی رخ داد.');
    }
  }

  return (
    <section className="newsletter-section">
      <div className="container">
        <h2 className="section-title">عضویت در خبرنامه</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          جهت دریافت اخبار مسابقات و پیشنهادات ویژه بازی، لطفاً با شماره موبایل خود وارد نمایید.
        </p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="09xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            عضویت
          </button>
        </form>
        {message && <p className="success-text" style={{ marginTop: 12 }}>{message}</p>}
        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      </div>
    </section>
  );
}
