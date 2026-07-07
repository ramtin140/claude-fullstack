import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import '../styles/auth.css';

export default function H2HCreate() {
  const navigate = useNavigate();
  const [consoles, setConsoles] = useState([]);
  const [gameVersions, setGameVersions] = useState([]);
  const [form, setForm] = useState({
    stake_type: 'ticket',
    stake_amount: 1,
    console: '',
    game_version: '',
    is_private: false,
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/game-options', { params: { category: 'console' } }).then(({ data }) => setConsoles(data.options));
    api.get('/game-options', { params: { category: 'game_version' } }).then(({ data }) => setGameVersions(data.options));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/h2h', form);
      navigate(`/h2h/${data.match.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ساخت مسابقه');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card" style={{ maxWidth: 480 }}>
        <h1>ساخت مسابقه رو-در-رو</h1>
        <p className="subtitle">حریف جوین شود، مسابقه قفل و شروع می‌شود</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>نوع شرط‌بندی</label>
            <select value={form.stake_type} onChange={(e) => setForm({ ...form, stake_type: e.target.value })}>
              <option value="ticket">تیکتی (۱ تا ۵ تیکت)</option>
              <option value="xp">رایگان (بر اساس اکسپرینس)</option>
            </select>
          </div>
          {form.stake_type === 'ticket' && (
            <div className="form-field">
              <label>تعداد تیکت</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.stake_amount}
                onChange={(e) => setForm({ ...form, stake_amount: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="form-field">
            <label>کنسول</label>
            <select value={form.console} onChange={(e) => setForm({ ...form, console: e.target.value })}>
              <option value="">انتخاب کنید</option>
              {consoles.map((c) => (
                <option key={c.id} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>ورژن بازی</label>
            <select value={form.game_version} onChange={(e) => setForm({ ...form, game_version: e.target.value })}>
              <option value="">انتخاب کنید</option>
              {gameVersions.map((g) => (
                <option key={g.id} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="is_private"
              checked={form.is_private}
              onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              style={{ width: 'auto' }}
            />
            <label htmlFor="is_private" style={{ margin: 0 }}>
              مسابقه خصوصی (با رمز عبور)
            </label>
          </div>
          {form.is_private && (
            <div className="form-field">
              <label>رمز عبور مسابقه</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'در حال ساخت...' : 'ساخت مسابقه'}
          </button>
        </form>
      </div>
    </div>
  );
}
