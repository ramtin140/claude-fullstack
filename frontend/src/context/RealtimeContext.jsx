import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiOrigin } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const RealtimeContext = createContext(null);

let idSeq = 0;
const MAX_NOTIFICATIONS = 30;

// Live notifications over websocket: challenge received/answered, h2h result
// submitted/confirmed/disputed/forfeited, match completed, and — for
// senior_admin/match_expert — a running count of the expert dispute queue
// (see Navbar's badge). One socket per authenticated session, torn down on
// logout so a stale connection doesn't keep emitting events for a signed-out
// user. Every event produces both a transient toast (auto-dismisses) and an
// entry in the persistent notification bell (stays until read) — a toast
// alone disappears before a user who's mid-task ever looks up and sees it.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [expertQueueCount, setExpertQueueCount] = useState(0);
  const socketRef = useRef(null);

  function notify(message, tone = 'info', link = null) {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
    setNotifications((list) => [{ id, message, tone, link, read: false, at: Date.now() }, ...list].slice(0, MAX_NOTIFICATIONS));
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }

  useEffect(() => {
    const token = localStorage.getItem('fifasoul_token');
    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setExpertQueueCount(0);
      setNotifications([]);
      return;
    }

    const socket = io(apiOrigin, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('challenge:new', ({ from_user_name }) => {
      notify(`${from_user_name} شما را به مسابقه رو-در-رو دعوت کرد.`, 'info', '/dashboard');
    });
    socket.on('challenge:accepted', ({ h2h_match_id }) => notify('حریف چالش شما را پذیرفت!', 'success', h2h_match_id ? `/h2h/${h2h_match_id}` : '/dashboard'));
    socket.on('challenge:declined', () => notify('حریف چالش شما را رد کرد.', 'warning', '/dashboard'));

    socket.on('h2h:match_locked', ({ match_id }) => {
      notify('حریف جوین شد و مسابقه قفل شد — می‌توانید بازی را شروع کنید.', 'success', `/h2h/${match_id}`);
    });
    socket.on('h2h:leg_submitted', ({ match_id, leg_number }) => {
      notify(`نتیجه نیم‌فصل ${leg_number} ثبت شد — منتظر تایید شماست.`, 'info', `/h2h/${match_id}`);
    });
    socket.on('h2h:leg_confirmed', ({ match_id, leg_number }) => {
      notify(`نتیجه ثبت‌شده شما برای نیم‌فصل ${leg_number} تایید شد.`, 'success', `/h2h/${match_id}`);
    });
    socket.on('h2h:disputed', ({ match_id, leg_number }) => {
      notify(`به نتیجه ثبت‌شده شما در نیم‌فصل ${leg_number} اعتراض شد.`, 'warning', `/h2h/${match_id}`);
    });
    socket.on('h2h:forfeit_claimed', ({ match_id, leg_number }) => {
      notify(`چون به‌موقع نتیجه ثبت نشد، نیم‌فصل ${leg_number} به‌صورت فرجه‌ای ۳-۰ ثبت شد.`, 'warning', `/h2h/${match_id}`);
    });
    socket.on('h2h:expert_resolved', ({ match_id, leg_number, home_score, away_score }) => {
      notify(`کارشناس نتیجه نیم‌فصل ${leg_number} را ${home_score}-${away_score} اعلام کرد.`, 'info', `/h2h/${match_id}`);
    });
    socket.on('h2h:match_completed', ({ match_id, winner_id, is_draw }) => {
      notify(
        is_draw ? 'مسابقه رو-در-رو شما با تساوی پایان یافت.' : winner_id === user.id ? 'تبریک! برنده مسابقه شدید 🎉' : 'مسابقه رو-در-رو شما به پایان رسید.',
        is_draw ? 'info' : winner_id === user.id ? 'success' : 'info',
        `/h2h/${match_id}`
      );
    });
    socket.on('expert_queue:update', ({ count }) => setExpertQueueCount(count));

    return () => socket.disconnect();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider value={{ toasts, notifications, unreadCount, markAllRead, expertQueueCount }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
