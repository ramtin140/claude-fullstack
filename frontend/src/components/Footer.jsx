import { Link } from 'react-router-dom';
import '../styles/layout.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>FIFA SOUL</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.9 }}>
              خانه دیجیتال فوتبال؛ برگزاری تورنمنت‌ها و مسابقات آنلاین فیفا برای گیمرهای حرفه‌ای و
              علاقه‌مندان.
            </p>
          </div>
          <div>
            <h4>لینک‌های مهم</h4>
            <ul>
              <li>
                <Link to="/tournaments">مسابقات</Link>
              </li>
              <li>
                <Link to="/news">اخبار</Link>
              </li>
              <li>
                <Link to="/about">درباره ما</Link>
              </li>
              <li>
                <Link to="/contact">تماس با ما</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>حساب کاربری</h4>
            <ul>
              <li>
                <Link to="/login">ورود</Link>
              </li>
              <li>
                <Link to="/register">ثبت‌نام</Link>
              </li>
              <li>
                <Link to="/dashboard">داشبورد من</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>ارتباط با ما</h4>
            <ul>
              <li style={{ color: 'var(--text-muted)' }}>info@fifasoul.example</li>
              <li style={{ color: 'var(--text-muted)' }}>تهران، ایران</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} FIFA Soul — تمامی حقوق محفوظ است.</div>
      </div>
    </footer>
  );
}
