import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusBadge = { pending: 'badge-waiting', approved: 'badge-live', rejected: 'badge-finished' };

export default function AdminGoalClips() {
  const [clips, setClips] = useState([]);

  function load() {
    api.get('/goal-clips/admin/all').then(({ data }) => setClips(data.clips));
  }

  useEffect(load, []);

  async function approve(id) {
    await api.post(`/goal-clips/${id}/approve`);
    load();
  }

  async function reject(id) {
    const notes = prompt('دلیل رد کلیپ (اختیاری):') || '';
    await api.post(`/goal-clips/${id}/reject`, { admin_notes: notes });
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>بررسی کلیپ‌های گل</h1>
      </div>

      {clips.length === 0 ? (
        <div className="empty-state">کلیپی ثبت نشده است.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {clips.map((c) => (
            <div className="card" style={{ padding: 20 }} key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{c.user_name}</strong>
                <span className={`badge ${statusBadge[c.status]}`}>{statusLabel[c.status]}</span>
              </div>
              <p>
                <a href={c.clip_url} target="_blank" rel="noreferrer">
                  {c.clip_url}
                </a>
              </p>
              {c.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.description}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatDateTime(c.created_at)}</p>
              {c.status === 'approved' && <p style={{ color: 'var(--gold)' }}>کد تخفیف صادر شده: {c.discount_code}</p>}
              {c.status === 'pending' && (
                <div className="row-actions" style={{ marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={() => approve(c.id)}>
                    تایید و صدور کد تخفیف
                  </button>
                  <button className="btn btn-outline" onClick={() => reject(c.id)}>
                    رد
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
