import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ tournaments: 0, matches: 0, news: 0, users: 0 });

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats));
    Promise.all([
      api.get('/tournaments'),
      api.get('/matches'),
      api.get('/news'),
      api.get('/users'),
    ]).then(([t, m, n, u]) => {
      setCounts({
        tournaments: t.data.tournaments.length,
        matches: m.data.matches.length,
        news: n.data.news.length,
        users: u.data.users.length,
      });
    });
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h1>داشبورد مدیریت</h1>
      </div>
      <div className="admin-kpis">
        <div className="card admin-kpi">
          <div className="value">{counts.tournaments}</div>
          <div className="label">تورنمنت‌ها</div>
        </div>
        <div className="card admin-kpi">
          <div className="value">{counts.matches}</div>
          <div className="label">مسابقات</div>
        </div>
        <div className="card admin-kpi">
          <div className="value">{counts.news}</div>
          <div className="label">اخبار</div>
        </div>
        <div className="card admin-kpi">
          <div className="value">{counts.users}</div>
          <div className="label">کاربران</div>
        </div>
      </div>

      {stats && (
        <div className="admin-kpis">
          <div className="card admin-kpi">
            <div className="value">{stats.ro_dero}</div>
            <div className="label">رو در رو</div>
          </div>
          <div className="card admin-kpi">
            <div className="value">{stats.play_off}</div>
            <div className="label">پلی آف</div>
          </div>
          <div className="card admin-kpi">
            <div className="value">{stats.leagues}</div>
            <div className="label">لیگ</div>
          </div>
          <div className="card admin-kpi">
            <div className="value">{stats.cups}</div>
            <div className="label">کاپ</div>
          </div>
        </div>
      )}
    </div>
  );
}
