import { useEffect, useState } from 'react';
import { Radio, Clock, Star, Inbox } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from './ui/card.jsx';
import { Badge } from './ui/badge.jsx';
import { Avatar, AvatarFallback } from './ui/avatar.jsx';
import { cn } from '../lib/utils.js';

function ColumnEmpty({ text }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-ink-faint">
      <Inbox size={22} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function ColumnHeader({ icon: Icon, children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-ink">
      <Icon size={17} className="text-gold" />
      {children}
    </h3>
  );
}

const rankStyles = ['bg-gold text-[#241102]', 'bg-white/20 text-ink', 'bg-[#a3672f]/50 text-ink'];

export default function BottomColumns() {
  const [inProgress, setInProgress] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api.get('/matches', { params: { status: 'in_progress' } }).then(({ data }) => setInProgress(data.matches));
    api.get('/matches', { params: { status: 'waiting' } }).then(({ data }) => setWaiting(data.matches));
    api.get('/stats/leaderboard').then(({ data }) => setLeaders(data.leaderboard));
  }, []);

  return (
    <section className="bg-bg py-16 md:py-20">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 px-4 md:grid-cols-3 md:px-6">
        <Card className="p-5">
          <ColumnHeader icon={Radio}>مسابقات در حال اجرا</ColumnHeader>
          {inProgress.length === 0 ? (
            <ColumnEmpty text="مسابقه‌ای در حال اجرا نیست." />
          ) : (
            <div className="flex flex-col gap-2">
              {inProgress.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <span className="truncate">{m.home_name}</span>
                    <span className="shrink-0 text-[11px] font-bold text-ink-faint">VS</span>
                    <span className="truncate">{m.away_name || '؟'}</span>
                  </div>
                  <Badge variant="live" className="shrink-0 gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-magenta-light opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-magenta-light" />
                    </span>
                    زنده
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <ColumnHeader icon={Clock}>مسابقات در انتظار</ColumnHeader>
          {waiting.length === 0 ? (
            <ColumnEmpty text="مسابقه‌ای در انتظار نیست." />
          ) : (
            <div className="flex flex-col gap-2">
              {waiting.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <span className="truncate">{m.home_name}</span>
                    <span className="shrink-0 text-[11px] font-bold text-ink-faint">VS</span>
                    <span className="truncate">{m.away_name || '؟'}</span>
                  </div>
                  <Badge variant="waiting" className="shrink-0">در انتظار</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <ColumnHeader icon={Star}>اعضای برتر</ColumnHeader>
          {leaders.length === 0 ? (
            <ColumnEmpty text="هنوز عضوی امتیاز کسب نکرده است." />
          ) : (
            <div className="flex flex-col gap-1">
              {leaders.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 rounded-md px-1.5 py-2 transition-colors hover:bg-surface-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      rankStyles[i] ?? 'bg-white/10 text-ink-muted'
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-bold">{u.name?.[0] ?? '؟'}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm text-ink">{u.name}</span>
                  <span className="shrink-0 text-[13px] font-semibold text-gold">{u.points.toLocaleString('fa-IR')} امتیاز</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
