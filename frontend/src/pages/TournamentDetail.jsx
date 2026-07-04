import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages.css';

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [joinMsg, setJoinMsg] = useState(null);

  function load() {
    api.get(`/tournaments/${id}`).then(({ data }) => setData(data));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleJoin() {
    try {
      await api.post(`/tournaments/${id}/join`);
      setJoinMsg('با موفقیت در تورنمنت ثبت‌نام شدید!');
      load();
    } catch (err) {
      setJoinMsg(err.response?.data?.error || 'خطا در ثبت‌نام');
    }
  }

  if (!data) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  const { tournament, participants, matches } = data;

  return (
    <div className="page-wrap">
      <div className="detail-hero">
        <div className="container">
          <h1>{tournament.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{tournament.description}</p>
          {user && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleJoin}>
              ثبت‌نام در این تورنمنت
            </button>
          )}
          {joinMsg && <p className="success-text" style={{ marginTop: 12 }}>{joinMsg}</p>}
        </div>
      </div>

      <div className="container detail-body">
        <div className="detail-grid">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>مسابقات این تورنمنت</h3>
            {matches.length === 0 && <div className="empty-state">هنوز مسابقه‌ای ثبت نشده است.</div>}
            {matches.map((m) => (
              <div className="match-row" key={m.id}>
                <div className="match-vs">
                  {m.home_name} <span className="vs-badge">VS</span> {m.away_name || '؟'}
                </div>
                <span>
                  {m.home_score != null ? `${m.home_score} - ${m.away_score}` : m.status === 'in_progress' ? 'زنده' : 'در انتظار'}
                </span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>شرکت‌کنندگان ({participants.length})</h3>
            <div className="participants-list">
              {participants.length === 0 && <div className="empty-state">هنوز کسی ثبت‌نام نکرده است.</div>}
              {participants.map((p) => (
                <div className="participant-row" key={p.id}>
                  <span>{p.name}</span>
                  <span style={{ color: 'var(--gold)' }}>{p.points} امتیاز</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
