import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { timeAgo } from '../utils/datetime.js';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Card } from '../components/ui/card.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';

function ThreadSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-[18px] py-3.5 last:border-b-0">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-2 h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export default function MessagesInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/threads').then(({ data }) => setThreads(data.threads)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">پیام‌های من</h1>
        <p className="text-ink-muted">گفتگو با سایر کاربران</p>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-16 pt-4 md:px-6">
        {loading ? (
          <Card className="overflow-hidden p-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <ThreadSkeleton key={i} />
            ))}
          </Card>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-ink-faint">
            <Inbox size={28} />
            <span className="text-sm">
              هنوز گفتگویی ندارید. از{' '}
              <Link to="/players" className="text-gold underline">
                جستجوی کاربران
              </Link>{' '}
              شروع کنید.
            </span>
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            {threads.map((t) => (
              <Link
                key={t.user_id}
                to={`/messages/${t.user_id}`}
                className="flex items-center gap-3 border-b border-border px-[18px] py-3.5 text-ink transition-colors last:border-b-0 hover:bg-bg-soft"
              >
                {t.avatar_url ? (
                  <img src={assetUrl(t.avatar_url)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-soft">
                    <PlayerAvatarIcon seed={t.user_id} size={18} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink">{t.name}</div>
                  <div className="truncate text-[13px] text-ink-muted">{t.last_message}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-ink-faint">{timeAgo(t.last_at)}</span>
                  {t.unread_count > 0 && (
                    <span className="rounded-full bg-magenta px-1.5 py-0.5 text-[11px] font-bold text-white">{t.unread_count}</span>
                  )}
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
