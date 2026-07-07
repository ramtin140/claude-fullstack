import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Swords, User, MessageCircle } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages.css';

export default function PlayerSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(true);

  useEffect(() => {
    api.get('/messages/settings').then(({ data }) => setMessagingEnabled(data.messaging_enabled));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.get('/users/directory', { params: { query } });
      setResults(data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در جستجو');
      setResults([]);
    }
  }

  async function sendChallenge(userId) {
    setError(null);
    setMessage(null);
    try {
      await api.post('/challenges', { to_user_id: userId });
      setMessage('چالش با موفقیت ارسال شد!');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال چالش');
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>جستجوی کاربران و حریف‌ها</h1>
        <p>بر اساس نام یا شناسه فیفاسول کاربران را پیدا کنید، پروفایل ببینید و در ارتباط باشید</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
          <input
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--border-soft)',
              background: 'var(--bg-darker)',
              color: 'var(--text-light)',
            }}
            placeholder="نام یا شناسه فیفاسول (FS-xxxx)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            <Search size={16} /> جستجو
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        {results.length > 0 && (
          <div className="grid-2">
            {results.map((u) => (
              <div key={u.id} className="card tournament-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.avatar_url ? (
                    <img src={assetUrl(u.avatar_url)} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span className="opponent-avatar-placeholder" style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </span>
                  )}
                  {u.name} {u.is_vip ? <span className="badge badge-live">VIP</span> : null}
                </h3>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  گرید {u.grade} — {u.fifa_soul_id}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/u/${u.id}`} className="btn btn-outline">
                    مشاهده پروفایل
                  </Link>
                  {messagingEnabled && (
                    <Link to={`/messages/${u.id}`} className="btn btn-outline">
                      <MessageCircle size={15} /> پیام
                    </Link>
                  )}
                  {user?.is_vip && (
                    <button className="btn btn-outline" onClick={() => sendChallenge(u.id)}>
                      <Swords size={15} /> ارسال چالش
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
