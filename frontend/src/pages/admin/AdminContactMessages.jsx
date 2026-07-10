import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../lib/utils.js';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);

  function load() {
    api.get('/contact/admin/all').then(({ data }) => setMessages(data.messages));
  }

  useEffect(load, []);

  async function markRead(id) {
    await api.post(`/contact/${id}/read`);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">پیام‌های تماس با ما</h1>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">پیامی ثبت نشده است.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <Card key={m.id} className={cn('p-[18px]', !m.is_read && 'border-gold')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <Mail size={16} className="text-gold" />
                  {m.name}
                  <span className="text-[13px] font-normal text-ink-muted">({m.email})</span>
                </div>
                <span className="text-xs text-ink-faint">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="mb-2.5 mt-2 text-sm text-ink">{m.message}</p>
              {!m.is_read && (
                <Button variant="outline" size="sm" onClick={() => markRead(m.id)}>
                  علامت‌گذاری به‌عنوان خوانده‌شده
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
