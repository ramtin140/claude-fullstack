import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';
import '../../styles/support.css';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusBadge = { open: 'badge-waiting', answered: 'badge-live', closed: 'badge-finished' };
const categoryLabel = { wallet: 'کیف پول و تیکت', h2h: 'مسابقات رو-در-رو', tournaments: 'تورنمنت‌ها', account: 'حساب کاربری', other: 'سایر موارد' };

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/support/admin/all', { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setTickets(data.tickets));
  }, [statusFilter]);

  return (
    <div>
      <div className="admin-header">
        <h1>تیکت‌های پشتیبانی</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}>
          <option value="">همه وضعیت‌ها</option>
          <option value="open">باز</option>
          <option value="answered">پاسخ داده شده</option>
          <option value="closed">بسته شده</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">تیکتی یافت نشد.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map((t) => (
            <Link key={t.id} to={`/support/${t.id}`} className="card support-ticket-row">
              <span>
                <span className="ticket-number">#{t.id}</span> <strong>{t.subject}</strong> — {t.user_name} ({categoryLabel[t.category]})
                <span className="ticket-date"> — {formatDateTime(t.created_at)}</span>
              </span>
              <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
