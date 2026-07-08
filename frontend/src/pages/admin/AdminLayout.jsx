import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, Swords, Newspaper, Users, Sliders, Gavel, DollarSign, LifeBuoy, Banknote, Film } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRealtime } from '../../context/RealtimeContext.jsx';
import { hasStaffAccess } from '../../components/ProtectedRoute.jsx';
import '../../styles/admin.css';

const links = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true, roles: ['senior_admin', 'writer', 'match_expert'] },
  { to: '/admin/tournaments', label: 'تورنمنت‌ها', icon: Trophy, roles: ['senior_admin'] },
  { to: '/admin/matches', label: 'مسابقات', icon: Swords, roles: ['senior_admin'] },
  { to: '/admin/news', label: 'اخبار', icon: Newspaper, roles: ['senior_admin', 'writer'] },
  { to: '/admin/users', label: 'کاربران', icon: Users, roles: ['senior_admin'] },
  { to: '/admin/game-options', label: 'گزینه‌های بازی', icon: Sliders, roles: ['senior_admin'] },
  { to: '/admin/expert-queue', label: 'صف کارشناسی', icon: Gavel, roles: ['senior_admin', 'match_expert'], dotKey: 'expertQueueCount' },
  { to: '/admin/economy', label: 'اقتصاد و گریدبندی', icon: DollarSign, roles: ['senior_admin'] },
  { to: '/admin/support', label: 'تیکت‌های پشتیبانی', icon: LifeBuoy, roles: ['senior_admin', 'writer'], dotKey: 'openSupportTickets' },
  { to: '/admin/withdrawals', label: 'درخواست‌های برداشت', icon: Banknote, roles: ['senior_admin'], dotKey: 'pendingWithdrawals' },
  { to: '/admin/goal-clips', label: 'کلیپ‌های گل', icon: Film, roles: ['senior_admin'], dotKey: 'pendingGoalClips' },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const realtime = useRealtime();
  const visibleLinks = links.filter((l) => hasStaffAccess(user, l.roles));

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {visibleLinks.map(({ to, label, icon: Icon, end, dotKey }) => {
          const showDot = dotKey && (realtime?.[dotKey] ?? 0) > 0;
          return (
            <NavLink key={to} to={to} end={end}>
              <span className="admin-link-icon">
                <Icon size={18} />
                {showDot && <span className="admin-alert-dot" />}
              </span>
              {label}
            </NavLink>
          );
        })}
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
