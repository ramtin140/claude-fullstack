import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { h2hApi } from '../api/h2h.js';
import '../styles/pages.css';
import '../styles/h2h.css';

const initialForm = {
  stake_type: 'ticket',
  stake_amount: 1,
  console: 'PS5',
  game_version: 'FC 25',
  is_private: false,
  password: '',
  admin_notes: '',
};

function MatchCard({ match, onJoin }) {
  return (
    <div className="card h2h-card">
      <h3>بازی #{match.id}</h3>
      <div className="h2h-meta">
        <span className="h2h-pill">{match.stake_type === 'ticket' ? `${match.stake_amount} تیکت` : 'XP'}</span>
        <span className="h2h-pill">{match.console || 'کنسول نامشخص'}</span>
        <span className="h2h-pill">{match.game_version || 'نسخه نامشخص'}</span>
        {match.is_private && <span className="h2h-pill">خصوصی</span>}
        <span className="h2h-pill">{match.status}</span>
      </div>
      {match.admin_notes && <p>{match.admin_notes}</p>}
      <div className="h2h-actions">
        <Link className="btn btn-outline" to={`/h2h/${match.id}`}>جزئیات</Link>
        {match.status === 'open' && <button className="btn btn-primary" onClick={() => onJoin(match)}>جوین شدن</button>}
      </div>
    </div>
  );
}

export default function H2HMatches() {
  const [openMatches, setOpenMatches] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [joinPassword, setJoinPassword] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError('');
    const [openRes, mineRes] = await Promise.allSettled([h2hApi.listOpen(), h2hApi.listMine()]);
    if (openRes.status === 'fulfilled') setOpenMatches(openRes.value.data.matches || []);
    if (mineRes.status === 'fulfilled') setMyMatches(mineRes.value.data.matches || []);
  };

  useEffect(() => { load(); }, []);

  const submitCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const payload = {
        ...form,
        stake_amount: Number(form.stake_amount),
        is_private: Boolean(form.is_private),
      };
      if (!payload.is_private) delete payload.password;
      await h2hApi.create(payload);
      setMessage('بازی رو-در-رو ساخته شد.');
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'ساخت بازی ناموفق بود.');
    } finally { setLoading(false); }
  };

  const submitJoin = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setLoading(true); setError(''); setMessage('');
    try {
      await h2hApi.join(selectedMatch.id, selectedMatch.is_private ? { password: joinPassword } : {});
      setMessage('با موفقیت وارد بازی شدید و بازی قفل شد.');
      setSelectedMatch(null); setJoinPassword('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'جوین شدن ناموفق بود.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>بازی رو-در-رو</h1>
        <p>ساخت بازی، جوین شدن، قفل شدن مسابقه و ورود به گردش ثبت نتیجه</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {message && <div className="h2h-message success">{message}</div>}
        {error && <div className="h2h-message error">{error}</div>}

        <div className="card">
          <h3>ساخت بازی جدید</h3>
          <form className="h2h-form" onSubmit={submitCreate}>
            <div className="h2h-row">
              <label>نوع بازی<select value={form.stake_type} onChange={(e) => setForm({ ...form, stake_type: e.target.value })}><option value="ticket">تیکتی</option><option value="xp">XP / رایگان</option></select></label>
              <label>تعداد تیکت<input type="number" min="1" max="5" value={form.stake_amount} disabled={form.stake_type !== 'ticket'} onChange={(e) => setForm({ ...form, stake_amount: e.target.value })} /></label>
              <label>کنسول<input value={form.console} onChange={(e) => setForm({ ...form, console: e.target.value })} /></label>
              <label>نسخه بازی<input value={form.game_version} onChange={(e) => setForm({ ...form, game_version: e.target.value })} /></label>
            </div>
            <label><input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} /> خصوصی / رمزدار</label>
            {form.is_private && <label>رمز بازی<input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
            <label>توضیحات / قوانین کوتاه<textarea value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} /></label>
            <button className="btn btn-primary" disabled={loading}>ساخت بازی</button>
          </form>
        </div>

        {selectedMatch && (
          <div className="card" style={{ marginTop: 18 }}>
            <h3>جوین شدن به بازی #{selectedMatch.id}</h3>
            <form className="h2h-form" onSubmit={submitJoin}>
              {selectedMatch.is_private && <label>رمز بازی<input value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} /></label>}
              <div className="h2h-actions"><button className="btn btn-primary" disabled={loading}>تایید و جوین</button><button type="button" className="btn btn-outline" onClick={() => setSelectedMatch(null)}>انصراف</button></div>
            </form>
          </div>
        )}

        <div className="h2h-section-title"><h3>بازی‌های آماده جوین</h3><Link to="/wallet" className="btn btn-outline">کیف پول</Link></div>
        <div className="h2h-grid">{openMatches.length ? openMatches.map((m) => <MatchCard key={m.id} match={m} onJoin={setSelectedMatch} />) : <div className="card">فعلاً بازی بازی برای جوین وجود ندارد.</div>}</div>

        <div className="h2h-section-title"><h3>بازی‌های من</h3></div>
        <div className="h2h-grid">{myMatches.length ? myMatches.map((m) => <MatchCard key={m.id} match={m} onJoin={setSelectedMatch} />) : <div className="card">هنوز بازی‌ای ندارید.</div>}</div>
      </div>
    </div>
  );
}
