import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasStaffAccess } from '../../components/ProtectedRoute.jsx';
import { Card } from '../../components/ui/card.jsx';

function Kpi({ value, label }) {
  return (
    <Card className="p-5 text-center">
      <div className="text-[1.7rem] font-extrabold text-gold">{value}</div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </Card>
  );
}

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">داشبورد مدیریت</h1>
      </div>
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        {hasStaffAccess(user, []) && (
          <>
            <Kpi value={counts.tournaments} label="تورنمنت‌ها" />
            <Kpi value={counts.matches} label="مسابقات" />
            <Kpi value={counts.users} label="کاربران" />
          </>
        )}
        {hasStaffAccess(user, ['writer']) && <Kpi value={counts.news} label="اخبار" />}
      </div>

      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
          <Kpi value={stats.ro_dero} label="رو در رو" />
          <Kpi value={stats.play_off} label="پلی آف" />
          <Kpi value={stats.leagues} label="لیگ" />
          <Kpi value={stats.cups} label="کاپ" />
        </div>
      )}
    </div>
  );
}
