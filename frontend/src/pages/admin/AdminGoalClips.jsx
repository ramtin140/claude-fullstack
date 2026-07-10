import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusVariant = { pending: 'waiting', approved: 'live', rejected: 'finished' };

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">بررسی کلیپ‌های گل</h1>
      </div>

      {clips.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">کلیپی ثبت نشده است.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {clips.map((c) => (
            <Card className="p-5" key={c.id}>
              <div className="flex items-center justify-between">
                <strong className="text-ink">{c.user_name}</strong>
                <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
              </div>
              <p className="mt-2">
                <a href={c.clip_url} target="_blank" rel="noreferrer" dir="ltr" className="text-gold hover:underline">
                  {c.clip_url}
                </a>
              </p>
              {c.description && <p className="text-[13px] text-ink-muted">{c.description}</p>}
              <p className="text-xs text-ink-faint">{formatDateTime(c.created_at)}</p>
              {c.status === 'approved' && <p className="text-gold">کد تخفیف صادر شده: {c.discount_code}</p>}
              {c.status === 'pending' && (
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" onClick={() => approve(c.id)}>
                    تایید و صدور کد تخفیف
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => reject(c.id)}>
                    رد
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
