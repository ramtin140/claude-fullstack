import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowRight } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { formatTime } from '../utils/datetime.js';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { cn } from '../lib/utils.js';

export default function MessageThread() {
  const { userId } = useParams();
  const { user } = useAuth();
  const realtime = useRealtime();
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  function load() {
    api.get(`/messages/${userId}`).then(({ data }) => {
      setOther(data.other);
      setMessages(data.messages);
    });
  }

  useEffect(() => {
    load();
    api.get('/messages/settings').then(({ data }) => setMessagingEnabled(data.messaging_enabled));
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!realtime?.socket) return;
    function handler(msg) {
      if (String(msg.from_user_id) === String(userId)) {
        setMessages((list) => [...list, msg]);
      }
    }
    realtime.socket.on('message:new', handler);
    return () => realtime.socket.off('message:new', handler);
  }, [realtime?.socket, userId]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    try {
      const { data } = await api.post(`/messages/${userId}`, { body });
      setMessages((list) => [...list, data.message]);
      setBody('');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال پیام');
    }
  }

  if (!other) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-10 pt-6 md:px-6">
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/messages">
            <ArrowRight size={16} />
          </Link>
        </Button>
        {other.avatar_url ? (
          <img src={assetUrl(other.avatar_url)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-soft">
            <PlayerAvatarIcon seed={other.id} size={18} />
          </span>
        )}
        <Link to={`/u/${other.id}`} className="text-lg font-bold text-gold hover:underline">
          {other.name}
        </Link>
      </div>

      <div className="mb-2 flex max-h-[55vh] min-h-[300px] flex-col gap-2.5 overflow-y-auto p-1 pb-4">
        {messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-faint">هنوز پیامی رد و بدل نشده — اولین پیام را بفرستید.</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex max-w-[75%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-[14px]',
                m.from_user_id === user.id
                  ? 'self-start border border-gold/30 bg-gradient-to-br from-gold/20 to-gold/[0.08] text-ink'
                  : 'self-end border border-border bg-surface text-ink'
              )}
            >
              <span>{m.body}</span>
              <span className="self-end text-[11px] text-ink-faint">{formatTime(m.created_at)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-critical">{error}</p>}

      {messagingEnabled ? (
        <form onSubmit={send} className="mt-2 flex gap-2.5">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="پیام خود را بنویسید..." className="flex-1 rounded-md" />
          <Button type="submit" size="icon">
            <Send size={16} />
          </Button>
        </form>
      ) : (
        <p className="py-6 text-center text-sm text-ink-faint">قابلیت پیام‌رسانی توسط مدیریت غیرفعال شده است.</p>
      )}
    </div>
  );
}
