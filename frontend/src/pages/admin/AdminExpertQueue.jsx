import { useEffect, useState } from 'react';
import { Gavel, ArrowDownToLine } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../lib/utils.js';

const fieldClass =
  'rounded-md border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

function nameFor(leg, userId) {
  if (userId === leg.home_user_id) return leg.home_user_name || '؟';
  if (userId === leg.away_user_id) return leg.away_user_name || '؟';
  return `کاربر #${userId}`;
}

export default function AdminExpertQueue() {
  const [legs, setLegs] = useState([]);
  const [scores, setScores] = useState({});
  const [error, setError] = useState(null);

  function load() {
    api.get('/h2h/admin/expert-queue').then(({ data }) => setLegs(data.legs));
  }

  useEffect(load, []);

  function setScore(legId, patch) {
    setScores((s) => ({ ...s, [legId]: { ...s[legId], ...patch } }));
  }

  function fillFrom(leg, source) {
    const home = source === 'submitted' ? leg.submitted_home_score : leg.dispute_home_score;
    const away = source === 'submitted' ? leg.submitted_away_score : leg.dispute_away_score;
    setScore(leg.id, { home: String(home), away: String(away) });
  }

  async function resolve(leg) {
    setError(null);
    const score = scores[leg.id];
    if (!score || score.home === undefined || score.away === undefined || score.home === '' || score.away === '') {
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
          {legs.map((leg) => {
            const score = scores[leg.id] || {};
            return (
              <Card className="p-5" key={leg.id}>
                <h3 className="mb-2 mt-0 flex items-center gap-2 text-[15px] font-bold text-gold">
                  <Gavel size={18} /> مسابقه #{leg.match_id} — نیم‌فصل {leg.leg_number}
                </h3>
                <p className="mb-3 text-sm text-ink-muted">
                  میزبان: <b className="text-ink">{leg.home_user_name || '؟'}</b> — میهمان: <b className="text-ink">{leg.away_user_name || '؟'}</b>
                </p>

                <div className="mb-3.5 overflow-hidden rounded-md border border-border">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 bg-bg-soft px-3.5 py-2 text-[13px] font-semibold text-ink-muted">
                    <span>گزارش</span>
                    <span className="text-center">{leg.home_user_name || '؟'} (میزبان)</span>
                    <span className="text-center">{leg.away_user_name || '؟'} (میهمان)</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 border-t border-border px-3.5 py-2.5">
                    <span className="text-[13px] text-ink-muted">
                      ثبت اولیه <span className="text-ink-faint">— توسط {nameFor(leg, leg.submitted_by_id)}</span>
                    </span>
                    <span className="text-center font-mono text-base font-bold tabular-nums text-ink">{leg.submitted_home_score}</span>
                    <span className="text-center font-mono text-base font-bold tabular-nums text-ink">{leg.submitted_away_score}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 border-t border-border px-3.5 py-2.5">
                    <span className="text-[13px] text-ink-muted">
                      ادعای معترض <span className="text-ink-faint">— توسط {nameFor(leg, leg.dispute_by_id)}</span>
                    </span>
                    <span className="text-center font-mono text-base font-bold tabular-nums text-critical">{leg.dispute_home_score}</span>
                    <span className="text-center font-mono text-base font-bold tabular-nums text-critical">{leg.dispute_away_score}</span>
                  </div>
                </div>

                {leg.dispute_evidence && <p className="mb-3.5 text-[13px] text-ink-muted">مستندات: {leg.dispute_evidence}</p>}

                <div className="mb-2.5 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fillFrom(leg, 'submitted')}>
                    <ArrowDownToLine size={13} /> استفاده از نتیجه ثبت‌شده اولیه
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => fillFrom(leg, 'dispute')}>
                    <ArrowDownToLine size={13} /> استفاده از ادعای معترض
                  </Button>
                </div>

                <p className="mb-3.5 text-sm font-bold text-gold">نتیجه نهایی کارشناسی:</p>
                <div className="flex flex-wrap items-end gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] text-ink-muted">گل {leg.home_user_name || 'میزبان'} (میزبان)</label>
                    <input
                      type="number"
                      value={score.home ?? ''}
                      className={cn('w-[180px]', fieldClass)}
                      onChange={(e) => setScore(leg.id, { home: e.target.value })}
                    />
                  </div>
                  <span className="pb-2.5 text-ink-muted">—</span>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] text-ink-muted">گل {leg.away_user_name || 'میهمان'} (میهمان)</label>
                    <input
                      type="number"
                      value={score.away ?? ''}
                      className={cn('w-[180px]', fieldClass)}
                      onChange={(e) => setScore(leg.id, { away: e.target.value })}
                    />
                  </div>
                  <Button onClick={() => resolve(leg)}>ثبت نتیجه نهایی</Button>
                  <Button variant="magenta" onClick={() => voidMatch(leg)}>
                    لغو مسابقه (نقص فنی)
                  </Button>
                </div>
                <textarea
                  rows={2}
                  placeholder="یادداشت کارشناسی (اختیاری) — در تاریخچه بررسی یا دلیل لغو ثبت می‌شود"
                  value={score.notes ?? ''}
                  className={`mt-2.5 w-full ${fieldClass}`}
                  onChange={(e) => setScore(leg.id, { notes: e.target.value })}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
