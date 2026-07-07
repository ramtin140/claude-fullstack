import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Send, ArrowRight } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { formatTime } from '../utils/datetime.js';
import '../styles/pages.css';
import '../styles/messages.css';

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

  if (!other) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: 24, paddingBottom: 40, maxWidth: 640 }}>
        <div className="thread-header">
          <Link to="/messages" className="btn btn-outline" style={{ padding: '8px 12px' }}>
            <ArrowRight size={16} />
          </Link>
          {other.avatar_url ? (
            <img src={assetUrl(other.avatar_url)} alt="" className="thread-avatar" />
          ) : (
            <span className="thread-avatar thread-avatar-placeholder">
              <User size={18} />
            </span>
          )}
          <Link to={`/u/${other.id}`} className="thread-name">
            {other.name}
          </Link>
        </div>

        <div className="chat-window">
          {messages.length === 0 ? (
            <div className="empty-state">هنوز پیامی رد و بدل نشده — اولین پیام را بفرستید.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.from_user_id === user.id ? 'mine' : 'theirs'}`}>
                <span>{m.body}</span>
                <span className="chat-time">{formatTime(m.created_at)}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="error-text">{error}</p>}

        {messagingEnabled ? (
          <form className="chat-input-row" onSubmit={send}>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="پیام خود را بنویسید..." />
            <button className="btn btn-primary" type="submit">
              <Send size={16} />
            </button>
          </form>
        ) : (
          <p className="empty-state">قابلیت پیام‌رسانی توسط مدیریت غیرفعال شده است.</p>
        )}
      </div>
    </div>
  );
}
