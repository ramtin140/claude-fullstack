import { useEffect, useState } from 'react';
import { Gavel } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

export default function AdminExpertQueue() {
  const [legs, setLegs] = useState([]);
  const [scores, setScores] = useState({});
  const [error, setError] = useState(null);

  function load() {
    api.get('/h2h/admin/expert-queue').then(({ data }) => setLegs(data.legs));
  }

  useEffect(load, []);

  async function resolve(leg) {
    setError(null);
    const score = scores[leg.id];
    if (!score || score.home === undefined || score.away === undefined) {
      setError('لطفاً نتیجه نهایی را وارد کنید.');
      return;
    }
    try {
      await api.post(`/h2h/${leg.match_id}/legs/${leg.leg_number}/expert-resolve`, {
        home_score: Number(score.home),
        away_score: Number(score.away),
        notes: score.notes || null,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت نتیجه نهایی.');
    }
  }

  async function voidMatch(leg) {
    if (!confirm('آیا مطمئنید؟ کل مسابقه لغو و مبلغ ورودی به هر دو طرف بازگردانده می‌شود.')) return;
    setError(null);
    try {
      await api.post(`/h2h/${leg.match_id}/legs/${leg.leg_number}/expert-void`, { reason: scores[leg.id]?.notes });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در لغو مسابقه.');
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1>صف کارشناسی مسابقات مورد اختلاف</h1>
      </div>

      {error && <p className="error-text">{error}</p>}

      {legs.length === 0 ? (
        <div className="empty-state">مسابقه‌ای در انتظار بررسی کارشناسی نیست.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {legs.map((leg) => (
            <div className="card" style={{ padding: 20 }} key={leg.id}>
              <h3 style={{ marginTop: 0, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gavel size={18} /> مسابقه #{leg.match_id} — نیم‌فصل {leg.leg_number}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {leg.home_user_name} در برابر {leg.away_user_name}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                نتیجه ثبت‌شده اولیه: <b>{leg.submitted_home_score} - {leg.submitted_away_score}</b> (توسط کاربر #{leg.submitted_by_id})
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                نتیجه پیشنهادی معترض: <b>{leg.dispute_home_score} - {leg.dispute_away_score}</b> (کاربر #{leg.dispute_by_id})
              </p>
              {leg.dispute_evidence && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>مستندات: {leg.dispute_evidence}</p>
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
                <input
                  type="number"
                  placeholder={`گل میزبان (${leg.home_user_name || '؟'})`}
                  style={{ width: 160, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
                  onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], home: e.target.value } })}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  placeholder={`گل میهمان (${leg.away_user_name || '؟'})`}
                  style={{ width: 160, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
                  onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], away: e.target.value } })}
                />
                <button className="btn btn-primary" onClick={() => resolve(leg)}>
                  ثبت نتیجه نهایی
                </button>
                <button className="btn btn-magenta" onClick={() => voidMatch(leg)}>
                  لغو مسابقه (نقص فنی)
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="یادداشت کارشناسی (اختیاری) — در تاریخچه بررسی یا دلیل لغو ثبت می‌شود"
                style={{ width: '100%', marginTop: 10, padding: 8, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
                onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], notes: e.target.value } })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
