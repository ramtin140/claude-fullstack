import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Coins, Calendar, Inbox } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';

const statusLabel = { upcoming: 'در انتظار شروع', in_progress: 'در حال اجرا', finished: 'پایان‌یافته' };
const statusBadge = { upcoming: 'waiting', in_progress: 'live', finished: 'finished' };
const typeLabel = { league: 'لیگ', cup: 'کاپ', playoff: 'پلی‌آف' };

function TournamentCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="mt-2 h-9 w-28" />
    </div>
  );
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">مسابقات و تورنمنت‌ها</h1>
        <p className="text-ink-muted">لیست کامل لیگ‌ها و کاپ‌های فعال، در انتظار و پایان‌یافته</p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 md:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-ink-faint">
            <Inbox size={28} />
            <span className="text-sm">تورنمنتی ثبت نشده است.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {tournaments.map((t) => (
              <Card key={t.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-bold text-ink">{t.title}</h3>
                  <Badge variant={statusBadge[t.status]} className="shrink-0">
                    {statusLabel[t.status]}
                  </Badge>
                </div>
                <p className="flex-1 text-sm leading-6 text-ink-muted">{t.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
                  <span>
                    {typeLabel[t.type] || t.type}
                    {t.type === 'cup' && t.bracket_size ? ` (${t.bracket_size} نفره)` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} className="text-gold" />
                    {t.participant_count}
                    {t.type === 'cup' && t.bracket_size ? `/${t.bracket_size}` : ''} شرکت‌کننده
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Coins size={14} className="text-gold" />
                    {t.entry_fee.toLocaleString('fa-IR')} تومان
                  </span>
                  {t.start_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} className="text-gold" />
                      {t.start_date}
                    </span>
                  )}
                </div>
                <Button asChild variant="outline" className="mt-1 w-fit">
                  <Link to={`/tournaments/${t.id}`}>مشاهده جزئیات</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
