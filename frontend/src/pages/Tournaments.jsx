import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Coins, Calendar } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/layout.css';
import '../styles/pages.css';

const statusLabel = { upcoming: 'در انتظار شروع', in_progress: 'در حال اجرا', finished: 'پایان‌یافته' };
const statusBadge = { upcoming: 'badge-waiting', in_progress: 'badge-live', finished: 'badge-finished' };
const typeLabel = { league: 'لیگ', cup: 'کاپ', playoff: 'پلی‌آف' };

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>مسابقات و تورنمنت‌ها</h1>
        <p>لیست کامل لیگ‌ها و کاپ‌های فعال، در انتظار و پایان‌یافته</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">تورنمنتی ثبت نشده است.</div>
        ) : (
          <div className="grid-2">
            {tournaments.map((t) => (
              <div key={t.id} className="card tournament-card">
                <div className="top-row">
                  <h3>{t.title}</h3>
                  <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
                </div>
                <p>{t.description}</p>
                <div className="tournament-meta">
                  <span>{typeLabel[t.type] || t.type}{t.type === 'cup' && t.bracket_size ? ` (${t.bracket_size} نفره)` : ''}</span>
                  <span>
                    <Users size={14} /> {t.participant_count}
                    {t.type === 'cup' && t.bracket_size ? `/${t.bracket_size}` : ''} شرکت‌کننده
                  </span>
                  <span>
                    <Coins size={14} /> {t.entry_fee.toLocaleString('fa-IR')} تومان
                  </span>
                  {t.start_date && (
                    <span>
                      <Calendar size={14} /> {t.start_date}
                    </span>
                  )}
                </div>
                <Link to={`/tournaments/${t.id}`} className="btn btn-outline" style={{ marginTop: 8 }}>
                  مشاهده جزئیات
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
