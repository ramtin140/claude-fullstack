import '../styles/pages.css';

export default function About() {
  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>درباره ما</h1>
        <p>آشنایی با FIFA Soul</p>
      </div>
      <div className="container about-content">
        <p>
          FIFA Soul خانه دیجیتال فوتبال است؛ بستری برای برگزاری تورنمنت‌ها و مسابقات آنلاین فیفا که در
          آن گیمرها می‌توانند در قالب لیگ یا کاپ با یکدیگر رقابت کنند، امتیاز کسب کنند و در جدول
          رتبه‌بندی بدرخشند.
        </p>
        <p>
          این پلتفرم به‌صورت کامل با معماری فول‌استک (React در سمت فرانت‌اند و Node.js/Express در
          سمت بک‌اند با پایگاه‌داده SQLite) توسعه داده شده و امکاناتی مانند ثبت‌نام و ورود کاربران،
          مدیریت تورنمنت‌ها و مسابقات، و پنل مدیریت کامل را در اختیار قرار می‌دهد.
        </p>
      </div>
    </div>
  );
}
