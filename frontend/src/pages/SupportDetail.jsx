import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isStaff } from '../components/ProtectedRoute.jsx';
import '../styles/pages.css';
import '../styles/messages.css';
import '../styles/support.css';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusBadge = { open: 'badge-waiting', answered: 'badge-live', closed: 'badge-finished' };
const categoryLabel = { wallet: 'کیف پول و تیکت', h2h: 'مسابقات رو-در-رو', tournaments: 'تورنمنت‌ها', account: 'حساب کاربری', other: 'سایر موارد' };

export default function SupportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  function load() {
    api.get(`/support/${id}`).then(({ data }) => {
      setTicket(data.ticket);
      setMessages(data.messages);
    });
  }

  useEffect(load, [id]);

  async function reply(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    try {
      await api.post(`/support/${id}/reply`, { body });
      setBody('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال پاسخ');
    }
  }

  async function close() {
    await api.post(`/support/${id}/close`);
    load();
  }

  if (!ticket) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 640 }}>
        <div className="thread-header">
          <Link to={isStaff(user) ? '/admin/support' : '/support'} className="btn btn-outline" style={{ padding: '8px 12px' }}>
            <ArrowRight size={16} />
          </Link>
          <div>
            <div className="thread-name">{ticket.subject}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{categoryLabel[ticket.category]}</div>
          </div>
          <span className={`badge ${statusBadge[ticket.status]}`} style={{ marginRight: 'auto' }}>
            {statusLabel[ticket.status]}
          </span>
        </div>

        <div className="chat-window">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.is_staff ? 'mine' : 'theirs'}`}>
              <strong style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{m.is_staff ? `پشتیبانی (${m.sender_name})` : m.sender_name}</strong>
              <span>{m.body}</span>
            </div>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        {ticket.status !== 'closed' ? (
          <form className="chat-input-row" onSubmit={reply}>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="پاسخ خود را بنویسید..." />
            <button className="btn btn-primary" type="submit">
              ارسال
            </button>
          </form>
        ) : (
          <p className="empty-state">این تیکت بسته شده است.</p>
        )}

        {isStaff(user) && ticket.status !== 'closed' && (
          <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={close}>
            بستن تیکت
          </button>
        )}
      </div>
    </div>
  );
}
