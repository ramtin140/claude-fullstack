import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, User, Wallet as WalletIcon, Swords, Search, Menu, X, MessageCircle, LifeBuoy, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { assetUrl } from '../api/client.js';
import '../styles/member.css';
import '../styles/toast.css';

const links = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'پروفایل من', icon: User },
  { to: '/wallet', label: 'کیف پول من', icon: WalletIcon },
  { to: '/h2h?tab=mine', label: 'مسابقات من', icon: Swords },
  { to: '/players', label: 'جستجوی کاربران', icon: Search },
  { to: '/messages', label: 'پیام‌ها', icon: MessageCircle, badgeKey: 'unreadMessages' },
  { to: '/support', label: 'پشتیبانی', icon: LifeBuoy },
  { to: '/goal-clips', label: 'کلیپ گل من', icon: Film },
];

export default function MemberLayout() {
  const { user } = useAuth();
  const realtime = useRealtime();
  const [open, setOpen] = useState(false);

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

        {links.map(({ to, label, icon: Icon, end, badgeKey }) => {
          const badgeCount = badgeKey ? realtime?.[badgeKey] : 0;
          return (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
              {badgeCount > 0 && <span className="expert-badge">{badgeCount}</span>}
            </NavLink>
          );
        })}
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
