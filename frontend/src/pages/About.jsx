import { useEffect, useState } from 'react';
import { Swords, Trophy, Wallet as WalletIcon, LifeBuoy, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/pages.css';

const features = [
  { icon: Swords, title: 'مسابقات رو-در-رو', text: 'حریف پیدا کن، با تیکت وارد مسابقه شو و نتیجه رفت/برگشت را ثبت کن.' },
  { icon: Trophy, title: 'لیگ و کاپ', text: 'در تورنمنت‌های لیگ و حذفی با جوایز نقدی شرکت کن و در جدول رتبه‌بندی بدرخش.' },
  { icon: WalletIcon, title: 'کیف پول شفاف', text: 'شارژ و برداشت تیکت با کارمزد شفاف و بررسی دستی هر تراکنش توسط مدیر سایت.' },
  { icon: ShieldCheck, title: 'داوری کارشناسی', text: 'در صورت اختلاف بر سر نتیجه، تیم کارشناسی مسابقات با بررسی مدارک تصمیم نهایی را می‌گیرد.' },
  { icon: LifeBuoy, title: 'پشتیبانی سریع', text: 'تیکت پشتیبانی ثبت کن یا مستقیم پیام بده؛ پاسخ‌گویی تیم فیفاسول همیشه در دسترس است.' },
  { icon: Users, title: 'جامعه‌ای فعال', text: 'صدها گیمر فعال، جستجوی بازیکن و پیام‌رسانی مستقیم برای پیدا کردن حریف بعدی.' },
];

function RulesSection({ h2hFeePercent }) {
  const [rate, setRate] = useState(null);
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    api.get('/deposits/rate').then(({ data }) => setRate(data.rate));
    api.get('/payment-methods/public-summary').then(({ data }) => setMethods(data.methods));
  }, []);

  return (
    <div id="rules-fees" className="card" style={{ padding: 24, marginTop: 40, scrollMarginTop: 90 }}>
      <h2 style={{ marginTop: 0, color: 'var(--gold)' }}>قوانین و کارمزدها</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        نرخ تبدیل فعلی: هر تیکت ={' '}
        <strong style={{ color: 'var(--gold)' }}>{rate ? rate.toLocaleString('fa-IR') : '...'}</strong> تومان (برای شارژ و برداشت یکسان است)
      </p>

      {methods.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>روش شارژ</th>
                <th>کارمزد</th>
                <th>محدوده مبلغ (تومان)</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>
                    {m.fee_percent > 0 && `${m.fee_percent}%`}
                    {m.fee_percent > 0 && m.fee_fixed > 0 && ' + '}
                    {m.fee_fixed > 0 && `${m.fee_fixed.toLocaleString('fa-IR')} تومان`}
                    {m.fee_percent === 0 && m.fee_fixed === 0 && 'بدون کارمزد'}
                  </td>
                  <td>
                    {m.min_amount.toLocaleString('fa-IR')} تا {m.max_amount ? m.max_amount.toLocaleString('fa-IR') : 'نامحدود'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul style={{ color: 'var(--text-muted)', lineHeight: 2, marginTop: 20, paddingRight: 20 }}>
        <li>هر درخواست شارژ یا برداشت به‌صورت دستی توسط مدیر سایت بررسی می‌شود و نیاز به ارسال تصویر رسید دارد.</li>
        <li>در صورت رد درخواست، دلیل آن برای شما ثبت می‌شود؛ در برداشت، تیکت‌های کسرشده بلافاصله به کیف پول بازمی‌گردد.</li>
        <li>کارمزد شارژ از مبلغ واریزی کسر شده و باقی‌مانده بر اساس نرخ روز به تیکت تبدیل می‌شود.</li>
        <li>در اختلافات مسابقات رو-در-رو، تصمیم نهایی بر عهده تیم کارشناسی و بر اساس مستندات ارسالی طرفین است.</li>
        <li>
          از مجموع تیکت ورودی هر مسابقه رو-در-رو،{' '}
          <strong style={{ color: 'var(--gold)' }}>{h2hFeePercent ?? 30}٪</strong> به‌عنوان کارمزد سایت کسر و
          باقی‌مانده به برنده واریز می‌شود.
        </li>
      </ul>
    </div>
  );
}

export default function About() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats));
  }, []);

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
          از مسابقات یک‌نفره رو-در-رو گرفته تا تورنمنت‌های لیگی و حذفی با جوایز نقدی، همه‌چیز در یک
          پلتفرم یکپارچه با کیف پول، پشتیبانی و داوری کارشناسی مدیریت می‌شود.
        </p>

        {stats && (
          <p style={{ color: 'var(--gold)', fontWeight: 700 }}>
            تاکنون {stats.members.toLocaleString('fa-IR')} عضو، {stats.ro_dero + stats.play_off} مسابقه رو-در-رو/پلی‌آف و{' '}
            {stats.leagues + stats.cups} تورنمنت روی FIFA Soul برگزار شده است.
          </p>
        )}
      </div>

      <div className="container" style={{ paddingBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {features.map(({ icon: Icon, title, text }) => (
            <div className="card" key={title} style={{ padding: 20 }}>
              <Icon size={22} color="var(--gold)" />
              <h3 style={{ margin: '10px 0 6px', fontSize: '1rem' }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>

        <RulesSection h2hFeePercent={stats?.h2h_fee_percent} />
      </div>
    </div>
  );
}
