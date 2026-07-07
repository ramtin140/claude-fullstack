import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasStaffAccess } from '../../components/ProtectedRoute.jsx';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState({ tournaments: 0, matches: 0, news: 0, users: 0 });

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats));
    // A writer/match_expert can't reach every one of these endpoints (e.g.
    // /users is senior_admin-only), so failures are handled per-call —
    // otherwise Promise.all would reject entirely and leave every count at 0
    // even for endpoints the current role does have access to.
    const endpoints = { tournaments: '/tournaments', matches: '/matches', news: '/news', users: '/users' };
    Promise.allSettled(Object.entries(endpoints).map(([key, url]) => api.get(url).then((r) => [key, r.data]))).then(
      (results) => {
        const next = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const [key, data] = r.value;
            next[key] = (data.tournaments || data.matches || data.news || data.users).length;
          }
        }
        setCounts((prev) => ({ ...prev, ...next }));
      }
    );
  }, []);

  return (
    <div>
      <div className="admin-header">
        <h1>داشبورد مدیریت</h1>
      </div>
      <div className="admin-kpis">
        {hasStaffAccess(user, []) && (
          <>
            <div className="card admin-kpi">
              <div className="value">{counts.tournaments}</div>
              <div className="label">تورنمنت‌ها</div>
            </div>
            <div className="card admin-kpi">
              <div className="value">{counts.matches}</div>
              <div className="label">مسابقات</div>
            </div>
            <div className="card admin-kpi">
              <div className="value">{counts.users}</div>
              <div className="label">کاربران</div>
            </div>
          </>
        )}
        {hasStaffAccess(user, ['writer']) && (
          <div className="card admin-kpi">
            <div className="value">{counts.news}</div>
            <div className="label">اخبار</div>
          </div>
        )}
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
