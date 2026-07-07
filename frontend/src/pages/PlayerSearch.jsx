import { useState } from 'react';
import { Search, Swords } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/pages.css';

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.get('/users/search', { params: { query } });
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
        <h1>جستجوی حریف</h1>
        <p>بر اساس نام یا شناسه کنسول (PSN/XBOX/Steam) حریف پیدا کنید و چالش بفرستید</p>
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
            placeholder="نام یا شناسه کنسول..."
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
                <h3>
                  {u.name} {u.is_vip ? <span className="badge badge-live" style={{ marginRight: 8 }}>VIP</span> : null}
                </h3>
                <p>
                  گرید: {u.grade}
                  {u.psn_id && ` — PSN: ${u.psn_id}`}
                  {u.xbox_id && ` — XBOX: ${u.xbox_id}`}
                  {u.steam_id && ` — Steam: ${u.steam_id}`}
                </p>
                <button className="btn btn-outline" onClick={() => sendChallenge(u.id)}>
                  <Swords size={15} /> ارسال چالش
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
