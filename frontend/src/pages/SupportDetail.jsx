import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isStaff } from '../components/ProtectedRoute.jsx';
import { formatDateTime, formatTime } from '../utils/datetime.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { cn } from '../lib/utils.js';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusVariant = { open: 'waiting', answered: 'live', closed: 'finished' };
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

  if (!ticket) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-10 pt-6 md:px-6">
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Button asChild variant="outline" size="icon">
          <Link to={isStaff(user) ? '/admin/support' : '/support'}>
            <ArrowRight size={16} />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-ink">
            <span className="font-mono font-bold text-gold">#{ticket.id}</span> {ticket.subject}
          </div>
          <div className="text-xs text-ink-faint">
            {categoryLabel[ticket.category]} — {formatDateTime(ticket.created_at)}
          </div>
        </div>
        <Badge variant={statusVariant[ticket.status]}>{statusLabel[ticket.status]}</Badge>
      </div>

      <div className="mb-2 flex max-h-[55vh] min-h-[300px] flex-col gap-2.5 overflow-y-auto p-1 pb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'flex max-w-[75%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-[14px]',
              m.is_staff
                ? 'self-start border border-gold/30 bg-gradient-to-br from-gold/20 to-gold/[0.08] text-ink'
                : 'self-end border border-border bg-surface text-ink'
            )}
          >
            <strong className="text-xs text-gold">{m.is_staff ? `پشتیبانی (${m.sender_name})` : m.sender_name}</strong>
            <span>{m.body}</span>
            <span className="self-end text-[11px] text-ink-faint">{formatTime(m.created_at)}</span>
          </div>
        ))}
      </div>

      {error && <p className="mb-2 text-sm text-critical">{error}</p>}

      {ticket.status !== 'closed' ? (
        <form onSubmit={reply} className="mt-2 flex gap-2.5">
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="پاسخ خود را بنویسید..." className="flex-1 rounded-md" />
          <Button type="submit">ارسال</Button>
        </form>
      ) : (
        <p className="py-6 text-center text-sm text-ink-faint">این تیکت بسته شده است.</p>
      )}

      {isStaff(user) && ticket.status !== 'closed' && (
        <Button variant="outline" className="mt-3" onClick={close}>
          بستن تیکت
        </Button>
      )}
    </div>
  );
}
