import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Swords, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { Button } from './ui/button.jsx';
import { Card } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';

function LiveMatchPreview() {
  return (
    <Card className="relative w-full max-w-sm overflow-hidden p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] motion-safe:animate-float">
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="live" className="gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-magenta-light opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-magenta-light" />
          </span>
          زنده
        </Badge>
        <span className="text-[11px] text-ink-faint">نمایش نمونه</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-900 text-lg font-bold text-white">
            ح
          </div>
          <span className="text-sm font-semibold text-ink">حمید</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 font-mono text-2xl font-bold text-ink">
            <span>۲</span>
            <span className="text-ink-faint">-</span>
            <span>۱</span>
          </div>
          <span className="text-[11px] text-ink-faint">نیم‌فصل ۲</span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-magenta-light to-magenta text-lg font-bold text-white">
            م
          </div>
          <span className="text-sm font-semibold text-ink">محمد</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-xs text-ink-muted">
        <Swords size={13} className="text-gold" />
        شرط‌بندی: ۲ تیکت هر نفر
      </div>
    </Card>
  );
}

export default function Hero() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,var(--color-brand-700)_0%,var(--color-brand-900)_45%,var(--color-bg-soft)_100%)] py-16 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 2px, transparent 2px, transparent 30px)',
        }}
      />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <div className="text-center md:text-start">
          <span className="mb-5 inline-block rounded-full bg-magenta-light/20 px-4 py-1.5 text-[13px] font-medium text-magenta-light">
            برگزاری مسابقات آنلاین
          </span>
          <h1 className="mb-4 text-balance text-4xl font-extrabold leading-tight text-transparent md:text-5xl">
            <span className="bg-gradient-to-br from-white to-gold-light bg-clip-text">
              رو-در-رو بازی کن، جایزه نقدی ببر
            </span>
          </h1>
          <p className="mx-auto mb-7 max-w-md text-balance leading-8 text-ink-muted md:mx-0">
            در فیفاسول با گیمرهای دیگر مسابقه رو-در-رو بگذار، در لیگ و کاپ‌های فعال شرکت کن و با کیف پول تیکتی
            شفاف، جوایز نقدی واقعی کسب کن.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 md:justify-start">
            <Button asChild>
              <Link to="/register">ثبت‌نام کنید</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tournaments">بیشتر بدانید</Link>
            </Button>
          </div>

          {stats && (
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-muted md:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Users size={15} className="text-gold" />
                {stats.members.toLocaleString('fa-IR')} عضو فعال
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Swords size={15} className="text-gold" />
                {(stats.ro_dero + stats.play_off).toLocaleString('fa-IR')} مسابقه برگزارشده
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-gold" />
                داوری کارشناسی
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <LiveMatchPreview />
        </div>
      </div>
    </section>
  );
}
