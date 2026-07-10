import { useEffect, useState } from 'react';
import { Gavel } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';

const fieldClass =
  'rounded-md border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">صف کارشناسی مسابقات مورد اختلاف</h1>
      </div>

      {error && <p className="mb-4 text-sm text-critical">{error}</p>}

      {legs.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">مسابقه‌ای در انتظار بررسی کارشناسی نیست.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {legs.map((leg) => (
            <Card className="p-5" key={leg.id}>
              <h3 className="mb-2 mt-0 flex items-center gap-2 text-[15px] font-bold text-gold">
                <Gavel size={18} /> مسابقه #{leg.match_id} — نیم‌فصل {leg.leg_number}
              </h3>
              <p className="text-sm text-ink-muted">
                {leg.home_user_name} در برابر {leg.away_user_name}
              </p>
              <p className="text-sm text-ink-muted">
                نتیجه ثبت‌شده اولیه: <b>{leg.submitted_home_score} - {leg.submitted_away_score}</b> (توسط کاربر #{leg.submitted_by_id})
              </p>
              <p className="text-sm text-ink-muted">
                نتیجه پیشنهادی معترض: <b>{leg.dispute_home_score} - {leg.dispute_away_score}</b> (کاربر #{leg.dispute_by_id})
              </p>
              {leg.dispute_evidence && <p className="text-[13px] text-ink-muted">مستندات: {leg.dispute_evidence}</p>}

              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <input
                  type="number"
                  placeholder={`گل میزبان (${leg.home_user_name || '؟'})`}
                  className={`w-[220px] ${fieldClass}`}
                  onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], home: e.target.value } })}
                />
                <span className="text-ink-muted">-</span>
                <input
                  type="number"
                  placeholder={`گل میهمان (${leg.away_user_name || '؟'})`}
                  className={`w-[220px] ${fieldClass}`}
                  onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], away: e.target.value } })}
                />
                <Button onClick={() => resolve(leg)}>ثبت نتیجه نهایی</Button>
                <Button variant="magenta" onClick={() => voidMatch(leg)}>
                  لغو مسابقه (نقص فنی)
                </Button>
              </div>
              <textarea
                rows={2}
                placeholder="یادداشت کارشناسی (اختیاری) — در تاریخچه بررسی یا دلیل لغو ثبت می‌شود"
                className={`mt-2.5 w-full ${fieldClass}`}
                onChange={(e) => setScores({ ...scores, [leg.id]: { ...scores[leg.id], notes: e.target.value } })}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
