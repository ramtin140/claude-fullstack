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
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar.jsx';
import { cn } from '../lib/utils.js';

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

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

function SidebarLink({ to, label, icon: Icon, end, badgeCount }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-sm text-ink-muted transition-colors',
          focusRing,
          isActive ? 'bg-gold/10 text-gold' : 'hover:bg-gold/10 hover:text-gold'
        )
      }
    >
      <Icon size={18} />
      {label}
      {badgeCount > 0 && (
        <span className="ms-auto rounded-full bg-magenta px-1.5 py-0.5 text-[11px] font-bold text-white">{badgeCount}</span>
      )}
    </NavLink>
  );
}

function MobileTab({ to, end, icon: Icon, label, badgeCount }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[11px]', focusRing, isActive ? 'text-gold' : 'text-ink-muted')
      }
    >
      <span className="relative inline-flex">
        <Icon size={21} />
        {badgeCount > 0 && (
          <span className="absolute -start-2.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-magenta-light px-1 text-[10px] font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

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
    <div className="grid min-h-[calc(100vh-130px)] grid-cols-1 items-start md:grid-cols-[240px_1fr]">
      <aside className="sticky top-[70px] hidden h-[calc(100vh-70px)] flex-col gap-1.5 overflow-y-auto border-e border-border bg-bg-soft px-3.5 py-6 md:flex">
        <div className="mb-2 flex items-center gap-3 border-b border-border px-3.5 pb-5 pt-2">
          <Avatar className="h-[42px] w-[42px] border-2 border-gold">
            {user?.avatar_url ? <AvatarImage src={assetUrl(user.avatar_url)} alt="" /> : null}
            <AvatarFallback>
              <PlayerAvatarIcon seed={user?.id} size={20} />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-bold text-ink">{user?.name}</div>
            <div className="text-xs text-gold">گرید {user?.grade}</div>
          </div>
        </div>

        {sidebarLinks.map(({ to, label, icon, end, badgeKey }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} end={end} badgeCount={badgeKey ? realtime?.[badgeKey] ?? 0 : 0} />
        ))}
      </aside>

      <main className="min-w-0 pb-[86px] md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[70] flex items-end justify-around border-t border-border bg-bg/95 px-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 backdrop-blur-md md:hidden">
        <MobileTab to="/dashboard" end icon={LayoutDashboard} label="داشبورد" />
        <MobileTab to="/wallet" icon={WalletIcon} label="کیف پول" />

        <NavLink
          to="/h2h?tab=mine"
          className={({ isActive }) => cn('relative -mt-6 flex flex-1 flex-col items-center gap-0.5 px-0.5 py-1 text-[11px]', focusRing, isActive ? 'text-gold' : 'text-ink-muted')}
        >
          <span className="mb-0.5 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-gradient-to-br from-gold-light to-gold text-[#241102] shadow-[0_6px_18px_rgba(242,183,5,0.45),0_0_0_4px_var(--color-bg)]">
            <Trophy size={22} />
          </span>
          <span className="text-gold">مسابقات</span>
        </NavLink>

        <MobileTab to="/messages" icon={MessageCircle} label="پیام‌ها" badgeCount={unreadMessages} />

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 bg-transparent px-0.5 py-1 text-[11px]',
            focusRing,
            moreOpen ? 'text-gold' : 'text-ink-muted'
          )}
        >
          <Grid3x3 size={21} />
          <span>بیشتر</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="fixed inset-0 z-[71] bg-black/55 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed inset-x-0 bottom-16 z-[72] flex flex-col rounded-t-[18px] border-t border-border bg-bg-soft px-4 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] pt-2.5 shadow-[0_-12px_30px_rgba(0,0,0,0.45)] md:hidden">
            <div className="flex items-center justify-between px-1 pb-3 pt-2 text-[13px] text-ink-muted">
              <span>گزینه‌های بیشتر</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="بستن"
                className={cn('flex h-[30px] w-[30px] items-center justify-center rounded-full bg-surface text-ink', focusRing)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pb-1">
              {moreLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-xl bg-surface px-3 py-3 text-sm text-ink-muted',
                      focusRing,
                      isActive && 'bg-gold/10 text-gold'
                    )
                  }
                >
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
