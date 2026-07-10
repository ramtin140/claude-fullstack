import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldCheck, LayoutDashboard, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { hasStaffAccess, isStaff } from './ProtectedRoute.jsx';
import { assetUrl } from '../api/client.js';
import NotificationBell from './NotificationBell.jsx';
import PlayerAvatarIcon from './PlayerAvatarIcon.jsx';
import { Button } from './ui/button.jsx';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu.jsx';
import { cn } from '../lib/utils.js';

const links = [
  { to: '/', label: 'خانه' },
  { to: '/tournaments', label: 'مسابقات' },
  { to: '/h2h', label: 'رو-در-رو' },
  { to: '/news', label: 'اخبار' },
  { to: '/about', label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
];

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const realtime = useRealtime();
  const navigate = useNavigate();
  const showExpertBadge = hasStaffAccess(user, ['senior_admin', 'match_expert']) && realtime?.expertQueueCount > 0;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-[70px] max-w-[1200px] items-center justify-between gap-4 px-4 md:px-6">
        <Link to="/" className={cn('flex shrink-0 items-center gap-2.5 rounded-lg font-extrabold text-gold', focusRing)}>
          <span
            className="h-9 w-9 shrink-0 bg-gradient-to-br from-gold-light to-gold"
            style={{
              WebkitMaskImage: 'url(/logo-monogram.png)',
              maskImage: 'url(/logo-monogram.png)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
            aria-hidden="true"
          />
          <span className="hidden text-lg sm:inline">FIFA SOUL</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink',
                  isActive && 'bg-gold/10 text-gold ring-1 ring-inset ring-gold/25',
                  focusRing
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Link
                to="/wallet"
                className={cn(
                  'flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-gold/40',
                  focusRing
                )}
                title="کیف پول"
              >
                <WalletIcon size={16} className="text-gold" />
                {user.ticket_balance ?? 0}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn('relative rounded-full bg-transparent', focusRing)} aria-label="منوی کاربر">
                    <Avatar className="h-10 w-10 border border-border">
                      {user.avatar_url ? (
                        <AvatarImage src={assetUrl(user.avatar_url)} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {isStaff(user) ? <ShieldCheck size={17} /> : <PlayerAvatarIcon seed={user.id} size={17} />}
                      </AvatarFallback>
                    </Avatar>
                    {showExpertBadge && (
                      <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta-light px-1 text-[10px] font-bold text-white">
                        {realtime.expertQueueCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <div className="text-sm font-semibold text-ink">{user.name}</div>
                    <div className="mt-0.5 text-xs text-ink-faint">{isStaff(user) ? 'عضو تیم فیفاسول' : 'عضو فیفاسول'}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User size={16} /> پروفایل من
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={isStaff(user) ? '/admin' : '/dashboard'}>
                      <LayoutDashboard size={16} />
                      {isStaff(user) ? 'پنل مدیریت' : 'داشبورد من'}
                      {showExpertBadge && (
                        <span className="ms-auto rounded-full bg-magenta-light/20 px-1.5 py-0.5 text-[11px] font-bold text-magenta-light">
                          {realtime.expertQueueCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-critical hover:bg-critical/10 hover:text-critical focus:bg-critical/10 focus:text-critical"
                    onSelect={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    <LogOut size={16} /> خروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="outline" size="sm">
                <Link to="/login">ورود</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">ثبت‌نام</Link>
              </Button>
            </div>
          )}

          <button
            className={cn('inline-flex rounded-full bg-transparent p-2 text-ink md:hidden', focusRing)}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="flex flex-col gap-1 border-b border-border bg-bg-soft px-4 py-3 md:hidden"
          onClick={() => setOpen(false)}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-2.5 text-sm text-ink-muted transition-colors',
                  isActive ? 'bg-gold/10 text-gold' : 'hover:bg-white/5 hover:text-ink',
                  focusRing
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          {!user && (
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link to="/login">ورود</Link>
              </Button>
              <Button asChild size="sm" className="flex-1">
                <Link to="/register">ثبت‌نام</Link>
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
