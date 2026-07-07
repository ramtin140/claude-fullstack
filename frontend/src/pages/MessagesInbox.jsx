import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MessageCircle } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { timeAgo } from '../utils/datetime.js';
import '../styles/pages.css';
import '../styles/messages.css';

export default function MessagesInbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/messages/threads').then(({ data }) => setThreads(data.threads)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>پیام‌های من</h1>
        <p>گفتگو با سایر کاربران</p>
      </div>
      <div className="container" style={{ paddingBottom: 60, maxWidth: 640 }}>
        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : threads.length === 0 ? (
          <div className="empty-state">
            هنوز گفتگویی ندارید. از <Link to="/players">جستجوی کاربران</Link> شروع کنید.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {threads.map((t) => (
              <Link key={t.user_id} to={`/messages/${t.user_id}`} className="thread-row">
                {t.avatar_url ? (
                  <img src={assetUrl(t.avatar_url)} alt="" className="thread-avatar" />
                ) : (
                  <span className="thread-avatar thread-avatar-placeholder">
                    <User size={18} />
                  </span>
                )}
                <div className="thread-info">
                  <div className="thread-name">{t.name}</div>
                  <div className="thread-preview">{t.last_message}</div>
                </div>
                <div className="thread-meta">
                  <span className="thread-time">{timeAgo(t.last_at)}</span>
                  {t.unread_count > 0 && <span className="expert-badge">{t.unread_count}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
