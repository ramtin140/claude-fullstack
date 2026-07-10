import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Wallet as WalletIcon,
  Swords,
  Search,
  MessageCircle,
  LifeBuoy,
  Film,
  Trophy,
  Grid3x3,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { assetUrl } from '../api/client.js';
import PlayerAvatarIcon from './PlayerAvatarIcon.jsx';
import '../styles/member.css';
import '../styles/toast.css';

const sidebarLinks = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'پروفایل من', icon: User },
  { to: '/wallet', label: 'کیف پول من', icon: WalletIcon },
  { to: '/h2h?tab=mine', label: 'مسابقات من', icon: Swords },
  { to: '/players', label: 'جستجوی کاربران', icon: Search },
  { to: '/messages', label: 'پیام‌ها', icon: MessageCircle, badgeKey: 'unreadMessages' },
  { to: '/support', label: 'پشتیبانی', icon: LifeBuoy },
  { to: '/goal-clips', label: 'کلیپ گل من', icon: Film },
];

const moreLinks = [
  { to: '/profile', label: 'پروفایل من', icon: User },
  { to: '/players', label: 'جستجوی کاربران', icon: Search },
  { to: '/support', label: 'پشتیبانی', icon: LifeBuoy },
  { to: '/goal-clips', label: 'کلیپ گل من', icon: Film },
];

export default function MemberLayout() {
  const { user } = useAuth();
  const realtime = useRealtime();
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadMessages = realtime?.unreadMessages ?? 0;

  // Some routes nested here (e.g. /h2h, /support/:id) are also reachable by
  // guests directly, so this shell only puts on its sidebar/tabbar chrome
  // once someone's actually logged in — otherwise it's just the outlet.
  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="member-layout">
      <aside className="member-sidebar">
        <div className="member-sidebar-profile">
          {user?.avatar_url ? (
            <img src={assetUrl(user.avatar_url)} alt="" className="member-sidebar-avatar" />
          ) : (
            <div className="member-sidebar-avatar member-sidebar-avatar-placeholder">
              <PlayerAvatarIcon seed={user?.id} size={22} />
            </div>
          )}
          <div>
            <div className="member-sidebar-name">{user?.name}</div>
            <div className="member-sidebar-grade">گرید {user?.grade}</div>
          </div>
        </div>

        {sidebarLinks.map(({ to, label, icon: Icon, end, badgeKey }) => {
          const badgeCount = badgeKey ? realtime?.[badgeKey] : 0;
          return (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} />
              {label}
              {badgeCount > 0 && <span className="expert-badge">{badgeCount}</span>}
            </NavLink>
          );
        })}
      </aside>

      <main className="member-content">
        <Outlet />
      </main>

      <nav className="mobile-tabbar">
        <NavLink to="/dashboard" end className="mobile-tab">
          <LayoutDashboard size={21} />
          <span>داشبورد</span>
        </NavLink>
        <NavLink to="/wallet" className="mobile-tab">
          <WalletIcon size={21} />
          <span>کیف پول</span>
        </NavLink>
        <NavLink to="/h2h?tab=mine" className="mobile-tab mobile-tab-center">
          <span className="mobile-tab-center-icon">
            <Trophy size={22} />
          </span>
          <span>مسابقات</span>
        </NavLink>
        <NavLink to="/messages" className="mobile-tab">
          <span className="mobile-tab-icon-wrap">
            <MessageCircle size={21} />
            {unreadMessages > 0 && <span className="mobile-tab-badge">{unreadMessages > 9 ? '9+' : unreadMessages}</span>}
          </span>
          <span>پیام‌ها</span>
        </NavLink>
        <button
          type="button"
          className={`mobile-tab mobile-tab-more ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen((o) => !o)}
        >
          <Grid3x3 size={21} />
          <span>بیشتر</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)} />
          <div className="mobile-more-sheet">
            <div className="mobile-more-sheet-header">
              <span>گزینه‌های بیشتر</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="بستن">
                <X size={18} />
              </button>
            </div>
            <div className="mobile-more-sheet-links">
              {moreLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="mobile-more-link" onClick={() => setMoreOpen(false)}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
