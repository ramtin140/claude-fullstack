import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Separator } from './ui/separator.jsx';

const linkCls =
  'text-sm text-ink-muted transition-colors hover:text-gold outline-none focus-visible:ring-2 focus-visible:ring-gold-light rounded-sm';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="mt-10 border-t border-border bg-bg-soft">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-3.5 font-bold text-gold">FIFA SOUL</h4>
            <p className="text-sm leading-8 text-ink-muted">
              خانه دیجیتال فوتبال؛ برگزاری تورنمنت‌ها و مسابقات آنلاین فیفا برای گیمرهای حرفه‌ای و
              علاقه‌مندان.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 font-bold text-gold">لینک‌های مهم</h4>
            <ul className="flex flex-col gap-2.5">
              <li><Link to="/tournaments" className={linkCls}>مسابقات</Link></li>
              <li><Link to="/news" className={linkCls}>اخبار</Link></li>
              <li><Link to="/about" className={linkCls}>درباره ما</Link></li>
              <li><Link to="/about#rules-fees" className={linkCls}>قوانین و کارمزدها</Link></li>
              <li><Link to="/contact" className={linkCls}>تماس با ما</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 font-bold text-gold">حساب کاربری</h4>
            <ul className="flex flex-col gap-2.5">
              {user ? (
                <>
                  <li><Link to="/dashboard" className={linkCls}>داشبورد من</Link></li>
                  <li><Link to="/wallet" className={linkCls}>کیف پول من</Link></li>
                  <li><Link to="/profile" className={linkCls}>پروفایل من</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" className={linkCls}>ورود</Link></li>
                  <li><Link to="/register" className={linkCls}>ثبت‌نام</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 font-bold text-gold">ارتباط با ما</h4>
            <ul className="flex flex-col gap-2.5">
              <li className="text-sm text-ink-muted">info@fifasoul.example</li>
              <li className="text-sm text-ink-muted">تهران، ایران</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-center text-xs text-ink-faint">
          © {new Date().getFullYear()} FIFA Soul — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
