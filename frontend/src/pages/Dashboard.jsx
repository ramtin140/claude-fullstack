import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, XCircle, Star, Search, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import '../styles/pages.css';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [incoming, setIncoming] = useState([]);

  function loadChallenges() {
    api.get('/challenges/incoming').then(({ data }) => setIncoming(data.challenges));
  }

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments));
    loadChallenges();
  }, []);

  async function respond(id, action) {
    const { data } = await api.post(`/challenges/${id}/${action}`);
    loadChallenges();
    if (action === 'accept' && data.h2h_match_id) {
      window.location.href = `/h2h/${data.h2h_match_id}`;
    }
    refreshUser();
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>سلام {user.name} 👋</h1>
        <p>خلاصه فعالیت‌ها و آمار حساب کاربری شما</p>
        <p style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          fifa soul ID: {user.fifa_soul_id} {user.is_guest ? '· کاربر مهمان' : ''}
          {user.is_vip ? ' · ' : ''}
          {user.is_vip && <span className="badge badge-live">VIP</span>}
        </p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="dashboard-grid">
          <div className="card dashboard-stat">
            <Star color="var(--gold)" />
            <div className="value">{user.points}</div>
            <div className="label">امتیاز</div>
          </div>
          <div className="card dashboard-stat">
            <Trophy color="var(--gold)" />
            <div className="value">{user.wins}</div>
            <div className="label">برد</div>
          </div>
          <div className="card dashboard-stat">
            <XCircle color="var(--gold)" />
            <div className="value">{user.losses}</div>
            <div className="label">باخت</div>
          </div>
          <div className="card dashboard-stat">
            <Target color="var(--gold)" />
            <div className="value">{user.wins + user.losses}</div>
            <div className="label">مجموع مسابقات</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value" style={{ color: 'var(--gold)' }}>{user.grade}</div>
            <div className="label">گرید فصلی ({user.season_points} امتیاز)</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value">{user.ticket_balance}</div>
            <div className="label">موجودی تیکت</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link to="/h2h/new" className="btn btn-primary">
            ساخت مسابقه رو-در-رو
          </Link>
          <Link to="/wallet" className="btn btn-outline">
            کیف پول من
          </Link>
          {user.is_vip && (
            <Link to="/players" className="btn btn-outline">
              <Search size={15} /> جستجوی حریف
            </Link>
          )}
        </div>

        {incoming.length > 0 && (
          <>
            <h3 style={{ color: 'var(--gold)' }}>چالش‌های دریافتی</h3>
            <div className="grid-2" style={{ marginBottom: 32 }}>
              {incoming.map((c) => (
                <div key={c.id} className="card tournament-card">
                  <h3>{c.from_user_name} شما را به مسابقه دعوت کرده</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => respond(c.id, 'accept')}>
                      <Check size={15} /> پذیرش
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => respond(c.id, 'decline')}>
                      <X size={15} /> رد کردن
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 style={{ color: 'var(--gold)' }}>تورنمنت‌های موجود برای ثبت‌نام</h3>
        <div className="grid-2">
          {tournaments.map((t) => (
            <div key={t.id} className="card tournament-card">
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <a href={`/tournaments/${t.id}`} className="btn btn-outline">
                مشاهده و ثبت‌نام
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
