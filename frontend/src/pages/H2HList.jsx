import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Zap, Lock, Plus, Trophy, Inbox } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { cn } from '../lib/utils.js';

const statusLabel = { open: 'باز برای جوین', locked: 'در حال انجام', completed: 'پایان‌یافته', cancelled: 'لغوشده' };
const statusBadge = { open: 'waiting', locked: 'live', completed: 'finished', cancelled: 'finished' };

// "مسابقات من" groups by what needs attention first: in-progress, then
// waiting for an opponent, then done — instead of one flat, unsorted grid.
const MINE_GROUP_ORDER = ['locked', 'open', 'completed', 'cancelled'];
const MINE_GROUP_LABEL = {
  locked: 'در حال انجام',
  open: 'در انتظار حریف',
  completed: 'پایان‌یافته',
  cancelled: 'لغوشده',
};

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

function PersonChip({ name, avatar, fallback = 'ناشناس' }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
      {avatar ? (
        <img src={assetUrl(avatar)} alt="" className="h-[22px] w-[22px] rounded-full object-cover" />
      ) : (
        <span className="flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full bg-bg-soft">
          <PlayerAvatarIcon seed={name || fallback} size={12} />
        </span>
      )}
      {name || fallback}
    </span>
  );
}

function MatchCard({ m, userId }) {
  const isCreator = m.creator_id === userId;
  const opponentName = isCreator ? m.opponent_name : m.creator_name;
  const opponentAvatar = isCreator ? m.opponent_avatar : m.creator_avatar;
  const isMine = userId === m.creator_id || userId === m.opponent_id;

  let resultTag = null;
  if (m.status === 'completed' && isMine) {
    if (!m.winner_id) resultTag = { text: 'تساوی', variant: 'finished' };
    else if (m.winner_id === userId) resultTag = { text: 'برد', variant: 'live' };
    else resultTag = { text: 'باخت', variant: 'finished' };
  }

  return (
    <Card className="flex flex-col gap-2.5 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold text-gold">
          {m.stake_type === 'ticket' ? <Coins size={16} /> : <Zap size={16} />}
          {m.stake_type === 'ticket' ? `${m.stake_amount} تیکت` : 'رایگان (XP)'}
        </span>
        <Badge variant={statusBadge[m.status]}>{statusLabel[m.status]}</Badge>
      </div>

      {isMine && m.opponent_id && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-muted">حریف:</span>
          <PersonChip name={opponentName} avatar={opponentAvatar} />
          {resultTag && (
            <Badge variant={resultTag.variant} className="ms-auto gap-1">
              <Trophy size={12} /> {resultTag.text}
            </Badge>
          )}
        </div>
      )}
      {!isMine && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-muted">سازنده:</span>
          <PersonChip name={m.creator_name} avatar={m.creator_avatar} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[13px] text-ink-muted">
        {m.console && <span>{m.console}</span>}
        {m.game_version && <span>{m.game_version}</span>}
        {m.is_private && (
          <span className="inline-flex items-center gap-1">
            <Lock size={13} /> خصوصی
          </span>
        )}
      </div>
      <Button asChild variant="outline" className="mt-1 w-full">
        <Link to={`/h2h/${m.id}`}>مشاهده جزئیات</Link>
      </Button>
    </Card>
  );
}

export default function H2HList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'mine' ? 'mine' : 'open');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === 'mine' ? '/h2h/mine' : '/h2h';
    api.get(url).then(({ data }) => setMatches(data.matches)).finally(() => setLoading(false));
  }, [tab]);

  const grouped =
    tab === 'mine'
      ? MINE_GROUP_ORDER.map((status) => ({ status, items: matches.filter((m) => m.status === status) })).filter(
          (g) => g.items.length > 0
        )
      : null;

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">مسابقات رو-در-رو</h1>
        <p className="text-ink-muted">مسابقه بساز، حریف جوین شود، نتیجه رفت/برگشت را خودتان ثبت کنید</p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('open')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              focusRing,
              tab === 'open' ? 'bg-gradient-to-br from-gold-light to-gold text-[#241102]' : 'bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink'
            )}
          >
            مسابقات باز
          </button>
          {user && (
            <button
              onClick={() => setTab('mine')}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                focusRing,
                tab === 'mine' ? 'bg-gradient-to-br from-gold-light to-gold text-[#241102]' : 'bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              مسابقات من
            </button>
          )}
          {user && (
            <Button asChild className="ms-auto gap-1.5">
              <Link to="/h2h/new">
                <Plus size={16} /> مسابقه جدید
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[180px] animate-pulse rounded-md border border-border bg-surface" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-16 text-ink-faint">
            <Inbox size={28} />
            <span className="text-sm">مسابقه‌ای یافت نشد.</span>
          </div>
        ) : tab === 'mine' ? (
          grouped.map((g) => (
            <div key={g.status} className="mb-7">
              <h3 className="mb-3 text-base font-bold text-gold">
                {MINE_GROUP_LABEL[g.status]} ({g.items.length})
              </h3>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((m) => (
                  <MatchCard key={m.id} m={m} userId={user?.id} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} m={m} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
