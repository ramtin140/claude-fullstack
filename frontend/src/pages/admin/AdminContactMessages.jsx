import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

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
      <div className="admin-header">
        <h1>پیام‌های تماس با ما</h1>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">پیامی ثبت نشده است.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m) => (
            <div key={m.id} className="card" style={{ padding: 18, borderColor: m.is_read ? 'var(--border-soft)' : 'var(--gold)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                  <Mail size={16} color="var(--gold)" />
                  {m.name}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>({m.email})</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateTime(m.created_at)}</span>
              </div>
              <p style={{ marginBottom: 10 }}>{m.message}</p>
              {!m.is_read && (
                <button className="btn btn-outline" style={{ padding: '6px 14px' }} onClick={() => markRead(m.id)}>
                  علامت‌گذاری به‌عنوان خوانده‌شده
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
