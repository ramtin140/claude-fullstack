import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { timeAgo } from '../utils/datetime.js';
import '../styles/toast.css';

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
