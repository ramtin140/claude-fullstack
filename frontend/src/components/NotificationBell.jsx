import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { timeAgo } from '../utils/datetime.js';
import { cn } from '../lib/utils.js';

const toneBorder = {
  success: 'border-e-2 border-e-gold',
  warning: 'border-e-2 border-e-magenta',
};

export default function NotificationBell() {
  const realtime = useRealtime();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!realtime) return null;

  function toggle() {
    setOpen((o) => {
      if (!o) realtime.markAllRead();
      return !o;
    });
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-ink outline-none transition-colors hover:border-gold/40 focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        onClick={toggle}
        title="اعلان‌ها"
      >
        <Bell size={17} />
        {realtime.unreadCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta-light px-1 text-[10px] font-bold text-white">
            {realtime.unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute start-0 top-[calc(100%+10px)] z-[60] flex max-h-[420px] w-80 flex-col overflow-y-auto rounded-md border border-border bg-surface-2 shadow-[0_12px_32px_rgba(0,0,0,0.4)] max-[480px]:w-[90vw]">
          {realtime.notifications.length === 0 ? (
            <div className="p-5 text-center text-sm text-ink-muted">اعلانی وجود ندارد</div>
          ) : (
            realtime.notifications.map((n) => (
              <button
                key={n.id}
                className={cn(
                  'flex flex-col gap-1 border-b border-border px-4 py-3 text-right text-[13px] text-ink outline-none transition-colors last:border-b-0 hover:bg-bg-soft focus-visible:bg-bg-soft',
                  toneBorder[n.tone]
                )}
                onClick={() => {
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
              >
                <span>{n.message}</span>
                <span className="text-xs text-ink-muted">{timeAgo(n.created_at)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
