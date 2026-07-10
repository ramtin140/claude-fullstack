import { useEffect, useState } from 'react';
import { Swords, Trophy, Wallet as WalletIcon, LifeBuoy, ShieldCheck, Users } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from '../components/ui/card.jsx';

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/deposits/rate').then(({ data }) => setRate(data.rate)),
      api.get('/payment-methods/public-summary').then(({ data }) => setMethods(data.methods)),
    ]).finally(() => setLoaded(true));
  }, []);

  // The payment-methods table above renders async and shifts this section's
  // position, so a #rules-fees deep-link (from the footer) can land short of
  // the target if it scrolls before that content settles — re-scroll once loaded.
  useEffect(() => {
    if (loaded && window.location.hash === '#rules-fees') {
      requestAnimationFrame(() => {
        document.getElementById('rules-fees')?.scrollIntoView({ block: 'start' });
      });
    }
  }, [loaded]);

  return (
    <Card id="rules-fees" className="mt-10 p-6" style={{ scrollMarginTop: 90 }}>
      <h2 className="mb-2 text-xl font-bold text-gold">قوانین و کارمزدها</h2>
      <p className="text-ink-muted">
        نرخ تبدیل فعلی: هر تیکت = <strong className="text-gold">{rate ? rate.toLocaleString('fa-IR') : '...'}</strong> تومان (برای شارژ و
        برداشت یکسان است)
      </p>

      {methods.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-ink-muted">
                <th className="px-4 py-3 text-start font-semibold">روش شارژ</th>
                <th className="px-4 py-3 text-start font-semibold">کارمزد</th>
                <th className="px-4 py-3 text-start font-semibold">محدوده مبلغ (تومان)</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-ink">{m.title}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {m.fee_percent > 0 && `${m.fee_percent}%`}
                    {m.fee_percent > 0 && m.fee_fixed > 0 && ' + '}
                    {m.fee_fixed > 0 && `${m.fee_fixed.toLocaleString('fa-IR')} تومان`}
                    {m.fee_percent === 0 && m.fee_fixed === 0 && 'بدون کارمزد'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {m.min_amount.toLocaleString('fa-IR')} تا {m.max_amount ? m.max_amount.toLocaleString('fa-IR') : 'نامحدود'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="mt-5 list-disc space-y-2 ps-5 leading-7 text-ink-muted">
        <li>هر درخواست شارژ یا برداشت به‌صورت دستی توسط مدیر سایت بررسی می‌شود و نیاز به ارسال تصویر رسید دارد.</li>
        <li>در صورت رد درخواست، دلیل آن برای شما ثبت می‌شود؛ در برداشت، تیکت‌های کسرشده بلافاصله به کیف پول بازمی‌گردد.</li>
        <li>کارمزد شارژ از مبلغ واریزی کسر شده و باقی‌مانده بر اساس نرخ روز به تیکت تبدیل می‌شود.</li>
        <li>در اختلافات مسابقات رو-در-رو، تصمیم نهایی بر عهده تیم کارشناسی و بر اساس مستندات ارسالی طرفین است.</li>
        <li>
          از مجموع تیکت ورودی هر مسابقه رو-در-رو، <strong className="text-gold">{h2hFeePercent ?? 30}٪</strong> به‌عنوان کارمزد سایت کسر
          و باقی‌مانده به برنده واریز می‌شود.
        </li>
      </ul>
    </Card>
  );
}

export default function About() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats));
  }, []);

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">درباره ما</h1>
        <p className="text-ink-muted">آشنایی با FIFA Soul</p>
      </div>

      <div className="mx-auto max-w-[760px] px-4 leading-8 text-ink-muted md:px-6">
        <p>
          FIFA Soul خانه دیجیتال فوتبال است؛ بستری برای برگزاری تورنمنت‌ها و مسابقات آنلاین فیفا که در آن گیمرها می‌توانند در قالب لیگ یا
          کاپ با یکدیگر رقابت کنند، امتیاز کسب کنند و در جدول رتبه‌بندی بدرخشند.
        </p>
        <p className="mt-4">
          از مسابقات یک‌نفره رو-در-رو گرفته تا تورنمنت‌های لیگی و حذفی با جوایز نقدی، همه‌چیز در یک پلتفرم یکپارچه با کیف پول، پشتیبانی و
          داوری کارشناسی مدیریت می‌شود.
        </p>

        {stats && (
          <p className="mt-4 font-bold text-gold">
            تاکنون {stats.members.toLocaleString('fa-IR')} عضو، {stats.ro_dero + stats.play_off} مسابقه رو-در-رو/پلی‌آف و{' '}
            {stats.leagues + stats.cups} تورنمنت روی FIFA Soul برگزار شده است.
          </p>
        )}
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6">
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-5">
              <Icon size={22} className="text-gold" />
              <h3 className="mb-1.5 mt-2.5 text-[15px] font-bold text-ink">{title}</h3>
              <p className="text-[13px] leading-6 text-ink-muted">{text}</p>
            </Card>
          ))}
        </div>

        <RulesSection h2hFeePercent={stats?.h2h_fee_percent} />
      </div>
    </div>
  );
}
