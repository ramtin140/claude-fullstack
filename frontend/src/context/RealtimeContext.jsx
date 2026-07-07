import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiOrigin } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const RealtimeContext = createContext(null);

let idSeq = 0;

// Live notifications over websocket: challenge received/answered, h2h result
// submitted/confirmed/disputed/forfeited, match completed, and — for
// senior_admin/match_expert — a running count of the expert dispute queue
// (see Navbar's badge). One socket per authenticated session, torn down on
// logout so a stale connection doesn't keep emitting toasts for a signed-out user.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [expertQueueCount, setExpertQueueCount] = useState(0);
  const socketRef = useRef(null);

  function pushToast(message, tone = 'info') {
    const id = ++idSeq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }

  useEffect(() => {
    const token = localStorage.getItem('fifasoul_token');
    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setExpertQueueCount(0);
      return;
    }

    const socket = io(apiOrigin, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('challenge:new', ({ from_user_name }) => {
      pushToast(`${from_user_name} شما را به مسابقه رو-در-رو دعوت کرد.`, 'info');
    });
    socket.on('challenge:accepted', () => pushToast('حریف چالش شما را پذیرفت!', 'success'));
    socket.on('challenge:declined', () => pushToast('حریف چالش شما را رد کرد.', 'warning'));

    socket.on('h2h:leg_submitted', ({ leg_number }) => {
      pushToast(`نتیجه نیم‌فصل ${leg_number} ثبت شد — منتظر تایید شماست.`, 'info');
    });
    socket.on('h2h:leg_confirmed', ({ leg_number }) => {
      pushToast(`نتیجه ثبت‌شده شما برای نیم‌فصل ${leg_number} تایید شد.`, 'success');
    });
    socket.on('h2h:disputed', ({ leg_number }) => {
      pushToast(`به نتیجه ثبت‌شده شما در نیم‌فصل ${leg_number} اعتراض شد.`, 'warning');
    });
    socket.on('h2h:forfeit_claimed', ({ leg_number }) => {
      pushToast(`چون به‌موقع نتیجه ثبت نشد، نیم‌فصل ${leg_number} به‌صورت فرجه‌ای ۳-۰ ثبت شد.`, 'warning');
    });
    socket.on('h2h:expert_resolved', ({ leg_number, home_score, away_score }) => {
      pushToast(`کارشناس نتیجه نیم‌فصل ${leg_number} را ${home_score}-${away_score} اعلام کرد.`, 'info');
    });
    socket.on('h2h:match_completed', ({ winner_id, is_draw }) => {
      pushToast(is_draw ? 'مسابقه رو-در-رو شما با تساوی پایان یافت.' : winner_id === user.id ? 'تبریک! برنده مسابقه شدید 🎉' : 'مسابقه رو-در-رو شما به پایان رسید.', is_draw ? 'info' : winner_id === user.id ? 'success' : 'info');
    });
    socket.on('expert_queue:update', ({ count }) => setExpertQueueCount(count));

    return () => socket.disconnect();
  }, [user?.id]);

  return (
    <RealtimeContext.Provider value={{ toasts, expertQueueCount }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
