import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Zap, Lock, Plus, User, Trophy } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/h2h.css';

const statusLabel = { open: 'باز برای جوین', locked: 'در حال انجام', completed: 'پایان‌یافته', cancelled: 'لغوشده' };
const statusBadge = { open: 'badge-waiting', locked: 'badge-live', completed: 'badge-finished', cancelled: 'badge-finished' };

// "مسابقات من" groups by what needs attention first: in-progress, then
// waiting for an opponent, then done — instead of one flat, unsorted grid.
const MINE_GROUP_ORDER = ['locked', 'open', 'completed', 'cancelled'];
const MINE_GROUP_LABEL = {
  locked: 'در حال انجام',
  open: 'در انتظار حریف',
  completed: 'پایان‌یافته',
  cancelled: 'لغوشده',
};

function PersonChip({ name, avatar, fallback = 'ناشناس' }) {
  return (
    <span className="h2h-person-chip">
      {avatar ? (
        <img src={assetUrl(avatar)} alt="" />
      ) : (
        <span className="opponent-avatar-placeholder">
          <User size={12} />
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
    if (!m.winner_id) resultTag = { text: 'تساوی', cls: '' };
    else if (m.winner_id === userId) resultTag = { text: 'برد', cls: 'badge-live' };
    else resultTag = { text: 'باخت', cls: 'badge-finished' };
  }

  return (
    <div className="card h2h-card">
      <div className="top-row">
        <span className="h2h-stake">
          {m.stake_type === 'ticket' ? <Coins size={16} /> : <Zap size={16} />}
          {m.stake_type === 'ticket' ? `${m.stake_amount} تیکت` : 'رایگان (XP)'}
        </span>
        <span className={`badge ${statusBadge[m.status]}`}>{statusLabel[m.status]}</span>
      </div>

      {isMine && m.opponent_id && (
        <div className="h2h-opponent-row">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>حریف:</span>
          <PersonChip name={opponentName} avatar={opponentAvatar} />
          {resultTag && <span className={`badge ${resultTag.cls}`} style={{ marginRight: 'auto' }}><Trophy size={12} /> {resultTag.text}</span>}
        </div>
      )}
      {!isMine && (
        <div className="h2h-opponent-row">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>سازنده:</span>
          <PersonChip name={m.creator_name} avatar={m.creator_avatar} />
        </div>
      )}

      <div className="h2h-meta">
        {m.console && <span>{m.console}</span>}
        {m.game_version && <span>{m.game_version}</span>}
        {m.is_private && (
          <span>
            <Lock size={13} /> خصوصی
          </span>
        )}
      </div>
      <Link to={`/h2h/${m.id}`} className="btn btn-outline">
        مشاهده جزئیات
      </Link>
    </div>
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
    <div className="page-wrap">
      <div className="page-header">
        <h1>مسابقات رو-در-رو</h1>
        <p>مسابقه بساز، حریف جوین شود، نتیجه رفت/برگشت را خودتان ثبت کنید</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="h2h-tabs">
          <button className={`tab-btn ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
            مسابقات باز
          </button>
          {user && (
            <button className={`tab-btn ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              مسابقات من
            </button>
          )}
          {user && (
            <Link to="/h2h/new" className="btn btn-primary" style={{ marginRight: 'auto' }}>
              <Plus size={16} /> مسابقه جدید
            </Link>
          )}
        </div>

        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : matches.length === 0 ? (
          <div className="empty-state">مسابقه‌ای یافت نشد.</div>
        ) : tab === 'mine' ? (
          grouped.map((g) => (
            <div key={g.status} style={{ marginBottom: 28 }}>
              <h3 style={{ color: 'var(--gold)', fontSize: '1rem', marginBottom: 12 }}>
                {MINE_GROUP_LABEL[g.status]} ({g.items.length})
              </h3>
              <div className="h2h-grid">
                {g.items.map((m) => (
                  <MatchCard key={m.id} m={m} userId={user?.id} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="h2h-grid">
            {matches.map((m) => (
              <MatchCard key={m.id} m={m} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
