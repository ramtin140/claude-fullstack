import { useEffect, useRef, useState } from 'react';
import { Users, Swords, Trophy, ShieldCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';

function useCountUp(target, { duration = 1200, start = false } = {}) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    if (!start) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || target === 0) {
      setValue(target);
      return;
    }
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [start, target, duration]);

  return value;
}

function StatCard({ icon: Icon, value, label, start }) {
  const count = useCountUp(value, { start });
  return (
    <Card className="flex flex-col items-center gap-3 px-5 py-8 text-center transition-transform duration-300 motion-safe:hover:-translate-y-1">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Icon size={22} />
      </span>
      <span className="text-3xl font-extrabold tabular-nums text-ink md:text-4xl">
        {count.toLocaleString('fa-IR')}
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </Card>
  );
}

export default function StatsSection() {
  const [stats, setStats] = useState(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats)).catch(() => {});
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const matches = stats ? stats.ro_dero + stats.play_off : 0;
  const tournaments = stats ? stats.leagues + stats.cups : 0;

  return (
    <section ref={sectionRef} className="bg-bg-soft py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <Badge variant="live" className="mb-4 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-magenta-light opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-magenta-light" />
            </span>
            آمار زنده
          </Badge>
          <h2 className="mb-2 text-2xl font-extrabold text-ink md:text-3xl">فیفاسول در یک نگاه</h2>
          <p className="max-w-md text-sm leading-7 text-ink-muted">
            جامعه‌ای رو به رشد از گیمرهایی که هر روز رو-در-رو رقابت می‌کنند و جایزه نقدی می‌گیرند.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Users} value={stats?.members ?? 0} label="عضو فعال" start={inView} />
          <StatCard icon={Swords} value={matches} label="مسابقه برگزار شده" start={inView} />
          <StatCard icon={Trophy} value={tournaments} label="تورنومنت فعال و برگزارشده" start={inView} />
          <Card className="flex flex-col items-center gap-3 px-5 py-8 text-center transition-transform duration-300 motion-safe:hover:-translate-y-1">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
              <ShieldCheck size={22} />
            </span>
            <span className="text-lg font-extrabold text-ink">شفاف و امن</span>
            <span className="text-sm text-ink-muted">داوری کارشناسی و تسویه کیف پول آنی</span>
          </Card>
        </div>
      </div>
    </section>
  );
}
