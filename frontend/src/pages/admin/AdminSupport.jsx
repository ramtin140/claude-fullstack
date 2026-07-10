import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Badge } from '../../components/ui/badge.jsx';

const statusLabel = { open: 'باز', answered: 'پاسخ داده شد', closed: 'بسته شده' };
const statusVariant = { open: 'waiting', answered: 'live', closed: 'finished' };
const categoryLabel = { wallet: 'کیف پول و تیکت', h2h: 'مسابقات رو-در-رو', tournaments: 'تورنمنت‌ها', account: 'حساب کاربری', other: 'سایر موارد' };

const selectClass =
  'rounded-md border border-border bg-bg px-2.5 py-2 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/support/admin/all', { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setTickets(data.tickets));
  }, [statusFilter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">تیکت‌های پشتیبانی</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">همه وضعیت‌ها</option>
          <option value="open">باز</option>
          <option value="answered">پاسخ داده شده</option>
          <option value="closed">بسته شده</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">تیکتی یافت نشد.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/support/${t.id}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-5 py-4 text-ink transition-colors hover:border-gold"
            >
              <span className="min-w-0 text-sm">
                <span className="font-mono font-bold text-gold">#{t.id}</span> <strong>{t.subject}</strong> — {t.user_name} ({categoryLabel[t.category]})
                <span className="text-ink-faint"> — {formatDateTime(t.created_at)}</span>
              </span>
              <Badge variant={statusVariant[t.status]}>{statusLabel[t.status]}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
