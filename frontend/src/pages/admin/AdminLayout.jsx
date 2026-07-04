import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, Swords, Newspaper, Users } from 'lucide-react';
import '../../styles/admin.css';

const links = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/admin/tournaments', label: 'تورنمنت‌ها', icon: Trophy },
  { to: '/admin/matches', label: 'مسابقات', icon: Swords },
  { to: '/admin/news', label: 'اخبار', icon: Newspaper },
  { to: '/admin/users', label: 'کاربران', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {links.map(({ to, label, icon: Icon, end }) => (
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
