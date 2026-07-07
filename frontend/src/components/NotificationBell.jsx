import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.jsx';
import '../styles/toast.css';

// SQLite's datetime('now') stores UTC as "YYYY-MM-DD HH:MM:SS" with no zone
// suffix — Date can't parse that reliably across browsers without this.
function timeAgo(sqliteDatetime) {
  const ts = new Date(sqliteDatetime.replace(' ', 'T') + 'Z').getTime();
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'همین الان';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}

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
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button className="user-chip notif-bell-btn" onClick={toggle} title="اعلان‌ها">
        <Bell size={16} />
        {realtime.unreadCount > 0 && <span className="expert-badge">{realtime.unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          {realtime.notifications.length === 0 ? (
            <div className="notif-empty">اعلانی وجود ندارد</div>
          ) : (
            realtime.notifications.map((n) => (
              <button
                key={n.id}
                className={`notif-item notif-${n.tone}`}
                onClick={() => {
                  setOpen(false);
                  if (n.link) navigate(n.link);
                }}
              >
                <span className="notif-message">{n.message}</span>
                <span className="notif-time">{timeAgo(n.created_at)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
