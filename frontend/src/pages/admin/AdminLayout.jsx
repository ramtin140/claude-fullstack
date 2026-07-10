import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, Swords, Newspaper, Users, Sliders, Gavel, DollarSign, LifeBuoy, Banknote, Film, CreditCard, Wallet as WalletIcon, Mail, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRealtime } from '../../context/RealtimeContext.jsx';
import { hasStaffAccess } from '../../components/ProtectedRoute.jsx';
import { cn } from '../../lib/utils.js';

const links = [
  { to: '/admin', label: 'داشبورد', icon: LayoutDashboard, end: true, roles: ['senior_admin', 'writer', 'match_expert'] },
  { to: '/admin/tournaments', label: 'تورنمنت‌ها', icon: Trophy, roles: ['senior_admin'] },
  { to: '/admin/matches', label: 'مسابقات', icon: Swords, roles: ['senior_admin'] },
  { to: '/admin/news', label: 'اخبار', icon: Newspaper, roles: ['senior_admin', 'writer'] },
  { to: '/admin/users', label: 'کاربران', icon: Users, roles: ['senior_admin'] },
  { to: '/admin/game-options', label: 'گزینه‌های بازی', icon: Sliders, roles: ['senior_admin'] },
  { to: '/admin/expert-queue', label: 'صف کارشناسی', icon: Gavel, roles: ['senior_admin', 'match_expert'], dotKey: 'expertQueueCount' },
  { to: '/admin/economy', label: 'اقتصاد و گریدبندی', icon: DollarSign, roles: ['senior_admin'] },
  { to: '/admin/revenue', label: 'درآمد و بازی‌ها', icon: TrendingUp, roles: ['senior_admin'] },
  { to: '/admin/support', label: 'تیکت‌های پشتیبانی', icon: LifeBuoy, roles: ['senior_admin', 'writer'], dotKey: 'openSupportTickets' },
  { to: '/admin/contact-messages', label: 'پیام‌های تماس', icon: Mail, roles: ['senior_admin', 'writer'], dotKey: 'unreadContactMessages' },
  { to: '/admin/withdrawals', label: 'درخواست‌های برداشت', icon: Banknote, roles: ['senior_admin'], dotKey: 'pendingWithdrawals' },
  { to: '/admin/deposits', label: 'درخواست‌های شارژ', icon: WalletIcon, roles: ['senior_admin'], dotKey: 'pendingDeposits' },
  { to: '/admin/payment-methods', label: 'روش‌های شارژ', icon: CreditCard, roles: ['senior_admin'] },
  { to: '/admin/goal-clips', label: 'کلیپ‌های گل', icon: Film, roles: ['senior_admin'], dotKey: 'pendingGoalClips' },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const realtime = useRealtime();
  const visibleLinks = links.filter((l) => hasStaffAccess(user, l.roles));

  return (
    <div className="grid min-h-[calc(100vh-70px)] grid-cols-1 items-start md:grid-cols-[220px_1fr]">
      <aside className="sticky top-[70px] z-40 flex gap-1.5 overflow-x-auto border-b border-border bg-bg px-3.5 py-3 md:h-[calc(100vh-70px)] md:flex-col md:overflow-x-visible md:overflow-y-auto md:border-b-0 md:border-e md:py-6">
        {visibleLinks.map(({ to, label, icon: Icon, end, dotKey }) => {
          const showDot = dotKey && (realtime?.[dotKey] ?? 0) > 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3.5 py-2.5 text-sm text-ink-muted transition-colors md:whitespace-normal',
                  isActive ? 'bg-gold/10 text-gold' : 'hover:bg-gold/10 hover:text-gold'
                )
              }
            >
              <span className="relative inline-flex">
                <Icon size={18} />
                {showDot && (
                  <span className="absolute -left-1 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-critical shadow-[0_0_0_2px_var(--color-bg-darker),0_0_8px_rgba(255,107,129,0.8)]" />
                )}
              </span>
              {label}
            </NavLink>
          );
        })}
      </aside>
      <main className="min-w-0 p-4 md:p-[30px]">
        <Outlet />
      </main>
    </div>
  );
}
