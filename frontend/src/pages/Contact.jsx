import { useState } from 'react';
import '../styles/pages.css';

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>تماس با ما</h1>
        <p>سوالی دارید؟ برای ما پیام بگذارید</p>
      </div>
      <div className="container contact-form">
        {sent ? (
          <p className="success-text" style={{ textAlign: 'center' }}>
            پیام شما با موفقیت ارسال شد. به‌زودی با شما تماس می‌گیریم.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>نام</label>
              <input required />
            </div>
            <div className="form-field">
              <label>ایمیل</label>
              <input type="email" required />
            </div>
            <div className="form-field">
              <label>پیام</label>
              <textarea rows={5} required />
            </div>
            <button className="btn btn-primary">ارسال پیام</button>
          </form>
        )}
      </div>
    </div>
  );
}
