import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, apiOrigin } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const RealtimeContext = createContext(null);

let toastSeq = 0;

// Live layer on top of the persisted notification inbox (backend writes each
// event to the `notifications` table first, then pushes it here) — so a
// user who was offline when something happened still sees it in the bell
// dropdown, and one who's online gets a toast + live message updates too.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [expertQueueCount, setExpertQueueCount] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [pendingGoalClips, setPendingGoalClips] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState(0);
  const [openSupportTickets, setOpenSupportTickets] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  function pushToast(message, tone) {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    api.post('/notifications/read-all').catch(() => {});
  }

  useEffect(() => {
    const token = localStorage.getItem('fifasoul_token');
    if (!user || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setExpertQueueCount(0);
      setPendingWithdrawals(0);
      setPendingGoalClips(0);
      setPendingDeposits(0);
      setOpenSupportTickets(0);
      setNotifications([]);
      setUnreadMessages(0);
      return;
    }

    api.get('/notifications').then(({ data }) => setNotifications(data.notifications)).catch(() => {});
    api
      .get('/messages/threads')
      .then(({ data }) => setUnreadMessages(data.threads.reduce((sum, t) => sum + t.unread_count, 0)))
      .catch(() => {});

    const s = io(apiOrigin, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = s;
    setSocket(s);

    s.on('notification:new', (n) => {
      pushToast(n.message, n.tone);
      setNotifications((list) => [n, ...list].slice(0, 30));
    });
    s.on('message:new', () => setUnreadMessages((c) => c + 1));
    s.on('expert_queue:update', ({ count }) => setExpertQueueCount(count));
    s.on('withdrawals:update', ({ count }) => setPendingWithdrawals(count));
    s.on('goal_clips:update', ({ count }) => setPendingGoalClips(count));
    s.on('deposits:update', ({ count }) => setPendingDeposits(count));
    s.on('support:update', ({ count }) => setOpenSupportTickets(count));

    return () => s.disconnect();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <RealtimeContext.Provider
      value={{
        toasts,
        notifications,
        unreadCount,
        markAllRead,
        expertQueueCount,
        pendingWithdrawals,
        pendingGoalClips,
        pendingDeposits,
        openSupportTickets,
        unreadMessages,
        setUnreadMessages,
        socket,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
