import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Coins, Zap, Lock, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/h2h.css';

const statusLabel = { open: 'باز برای جوین', locked: 'قفل‌شده', completed: 'پایان‌یافته', cancelled: 'لغوشده' };
const statusBadge = { open: 'badge-waiting', locked: 'badge-live', completed: 'badge-finished', cancelled: 'badge-finished' };

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
        ) : (
          <div className="h2h-grid">
            {matches.map((m) => (
              <div className="card h2h-card" key={m.id}>
                <div className="top-row">
                  <span className="h2h-stake">
                    {m.stake_type === 'ticket' ? <Coins size={16} /> : <Zap size={16} />}
                    {m.stake_type === 'ticket' ? `${m.stake_amount} تیکت` : 'رایگان (XP)'}
                  </span>
                  <span className={`badge ${statusBadge[m.status]}`}>{statusLabel[m.status]}</span>
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
