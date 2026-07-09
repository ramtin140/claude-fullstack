import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { api } from '../api/client.js';
import NewsCard from './NewsCard.jsx';
import { Skeleton } from './ui/skeleton.jsx';
import { cn } from '../lib/utils.js';

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const tabs = [
  { key: 'active_games', label: 'بازی‌های فعال' },
  { key: 'newest', label: 'جدیدترین‌ها' },
  { key: 'popular', label: 'گیک‌ها' },
  { key: 'tutorial', label: 'آموزش‌ها' },
];

function NewsCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-auto h-3 w-20" />
      </div>
    </div>
  );
}

export default function NewsTabsSection() {
  const [active, setActive] = useState(tabs[0].key);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/news', { params: { category: active } })
      .then(({ data }) => setNews(data.news))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <section className="bg-bg py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-ink md:text-3xl">اخبار و مطالب</h2>

        <div role="tablist" aria-label="دسته‌بندی اخبار" className="mb-8 flex flex-wrap justify-center gap-2.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150',
                focusRing,
                active === t.key
                  ? 'bg-gradient-to-br from-gold-light to-gold text-[#241102]'
                  : 'bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-ink-faint">
            <Inbox size={28} />
            <span className="text-sm">مطلبی در این دسته ثبت نشده است.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
