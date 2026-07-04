import { useEffect, useState } from 'react';
import { Trophy, Target, XCircle, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import '../styles/pages.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>سلام {user.name} 👋</h1>
        <p>خلاصه فعالیت‌ها و آمار حساب کاربری شما</p>
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
        </div>

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
