import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages.css';

const roundLabel = (round, totalRounds) => {
  if (totalRounds && round === totalRounds) return 'فینال';
  if (totalRounds && round === totalRounds - 1) return 'نیمه‌نهایی';
  return `دور ${round}`;
};

function BracketView({ matches, nameOf }) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length ? Math.max(...rounds) : 0;

  return (
    <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 8 }}>
      {rounds.map((round) => (
        <div key={round} style={{ minWidth: 220, flex: '0 0 auto' }}>
          <h4 style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 12 }}>
            {roundLabel(round, totalRounds)}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.bracket_slot - b.bracket_slot)
              .map((m) => (
                <div className="card" style={{ padding: 12 }} key={m.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: m.winner_id === m.home_user_id ? 700 : 400, color: m.winner_id === m.home_user_id ? 'var(--gold)' : 'inherit' }}>
                      {nameOf(m.home_user_id)}
                    </span>
                    <span>{m.home_score ?? '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: m.winner_id === m.away_user_id ? 700 : 400, color: m.winner_id === m.away_user_id ? 'var(--gold)' : 'inherit' }}>
                      {nameOf(m.away_user_id)}
                    </span>
                    <span>{m.away_score ?? '-'}</span>
                  </div>
                  {m.is_bye && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>استراحت (bye)</div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ standings, nameOf }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>بازیکن</th>
          <th>بازی</th>
          <th>برد</th>
          <th>مساوی</th>
          <th>باخت</th>
          <th>گل زده</th>
          <th>گل خورده</th>
          <th>تفاضل</th>
          <th>امتیاز</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((row, i) => (
          <tr key={row.user_id}>
            <td>{i + 1}</td>
            <td>{nameOf(row.user_id)}</td>
            <td>{row.played}</td>
            <td>{row.won}</td>
            <td>{row.drawn}</td>
            <td>{row.lost}</td>
            <td>{row.gf}</td>
            <td>{row.ga}</td>
            <td>{row.gd}</td>
            <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

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

  const { tournament, participants, matches, standings } = data;
  const nameMap = new Map(participants.map((p) => [p.id, p.name]));
  const nameOf = (userId) => (userId ? nameMap.get(userId) || `کاربر #${userId}` : '؟');
  const bracketMatches = matches.filter((m) => m.round != null);

  return (
    <div className="page-wrap">
      <div className="detail-hero">
        <div className="container">
          <h1>{tournament.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{tournament.description}</p>
          {user && !tournament.bracket_generated && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleJoin}>
              ثبت‌نام در این تورنمنت
            </button>
          )}
          {tournament.bracket_generated && (
            <span className="badge badge-live" style={{ marginTop: 16, display: 'inline-block' }}>
              مسابقات شروع شده — ثبت‌نام بسته است
            </span>
          )}
          {joinMsg && <p className="success-text" style={{ marginTop: 12 }}>{joinMsg}</p>}
        </div>
      </div>

      <div className="container detail-body">
        {tournament.bracket_generated && tournament.type === 'league' && standings && (
          <div className="card" style={{ padding: 22, marginBottom: 28, overflowX: 'auto' }}>
            <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>جدول امتیازات</h3>
            <StandingsTable standings={standings} nameOf={nameOf} />
          </div>
        )}

        {tournament.bracket_generated && ['cup', 'playoff'].includes(tournament.type) && (
          <div className="card" style={{ padding: 22, marginBottom: 28 }}>
            <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>برکت مسابقات</h3>
            <BracketView matches={bracketMatches} nameOf={nameOf} />
          </div>
        )}

        <div className="detail-grid">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>مسابقات این تورنمنت</h3>
            {matches.length === 0 && <div className="empty-state">هنوز مسابقه‌ای ثبت نشده است.</div>}
            {matches
              .filter((m) => m.round == null)
              .map((m) => (
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
