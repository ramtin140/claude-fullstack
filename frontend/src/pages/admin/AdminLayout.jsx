import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, Swords, Newspaper, Users, Sliders, Gavel, DollarSign, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { hasStaffAccess } from '../../components/ProtectedRoute.jsx';
import '../../styles/admin.css';

const links = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true, roles: ['senior_admin', 'writer', 'match_expert'] },
  { to: '/admin/tournaments', label: 'تورنمنت‌ها', icon: Trophy, roles: ['senior_admin'] },
  { to: '/admin/matches', label: 'مسابقات', icon: Swords, roles: ['senior_admin'] },
  { to: '/admin/news', label: 'اخبار', icon: Newspaper, roles: ['senior_admin', 'writer'] },
  { to: '/admin/users', label: 'کاربران', icon: Users, roles: ['senior_admin'] },
  { to: '/admin/game-options', label: 'گزینه‌های بازی', icon: Sliders, roles: ['senior_admin'] },
  { to: '/admin/expert-queue', label: 'صف کارشناسی', icon: Gavel, roles: ['senior_admin', 'match_expert'] },
  { to: '/admin/economy', label: 'اقتصاد و گریدبندی', icon: DollarSign, roles: ['senior_admin'] },
  { to: '/admin/support', label: 'تیکت‌های پشتیبانی', icon: LifeBuoy, roles: ['senior_admin', 'writer'] },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const visibleLinks = links.filter((l) => hasStaffAccess(user, l.roles));

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {visibleLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
