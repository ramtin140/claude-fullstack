import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, User, Wallet as WalletIcon, Swords, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl } from '../api/client.js';
import '../styles/member.css';

const baseLinks = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'پروفایل من', icon: User },
  { to: '/wallet', label: 'کیف پول من', icon: WalletIcon },
  { to: '/h2h?tab=mine', label: 'مسابقات من', icon: Swords },
];

export default function MemberLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = user?.is_vip ? [...baseLinks, { to: '/players', label: 'جستجوی حریف', icon: Search }] : baseLinks;

  return (
    <div className="member-layout">
      <aside className={`member-sidebar ${open ? 'open' : ''}`}>
        <div className="member-sidebar-profile">
          {user?.avatar_url ? (
            <img src={assetUrl(user.avatar_url)} alt="" className="member-sidebar-avatar" />
          ) : (
            <div className="member-sidebar-avatar member-sidebar-avatar-placeholder">
              <User size={22} />
            </div>
          )}
          <div>
            <div className="member-sidebar-name">{user?.name}</div>
            <div className="member-sidebar-grade">گرید {user?.grade}</div>
          </div>
        </div>

        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </aside>

      <button className="member-sidebar-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? <X size={16} /> : <Menu size={16} />} {open ? 'بستن منو' : 'منوی حساب کاربری'}
      </button>

      <main className="member-content">
        <Outlet />
      </main>
    </div>
  );
}
