import { Link } from 'react-router-dom';
import { Newspaper, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils.js';

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export default function NewsCard({ item }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-ink-faint">
        <Newspaper size={30} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 text-base font-bold text-ink">{item.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm leading-6 text-ink-muted">{item.excerpt}</p>
        <Link
          to={`/news/${item.id}`}
          className={cn(
            'mt-2 inline-flex w-fit items-center gap-1.5 rounded text-sm font-semibold text-gold transition-colors hover:text-gold-light',
            focusRing
          )}
        >
          ادامه مطلب
          <ArrowLeft size={14} />
        </Link>
      </div>
    </article>
  );
}
