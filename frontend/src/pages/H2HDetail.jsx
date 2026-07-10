import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Gavel, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasStaffAccess } from '../components/ProtectedRoute.jsx';
import { parseUtc } from '../utils/datetime.js';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const legStatusLabel = {
  pending_submission: 'در انتظار ثبت نتیجه',
  pending_confirmation: 'در انتظار تایید حریف',
  confirmed: 'تایید شده',
  expert_review: 'در حال بررسی کارشناسی',
  expert_resolved: 'توسط کارشناس نهایی شد',
  forfeited: 'نتیجه فرجه‌ای (۳-۰)',
  technical_issue: 'گزارش نقص فنی — در انتظار تایید حریف',
  cancelled: 'لغوشده (نقص فنی)',
};

function formatRemaining(deadline) {
  const ms = deadline - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours} ساعت و ${minutes} دقیقه`;
}

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

function PlayerChip({ name, avatar, fifaSoulId, roleLabel }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-sm">
      <span className="text-[13px] text-ink-muted">{roleLabel}</span>
      {avatar ? (
        <img src={assetUrl(avatar)} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-bg-soft">
          <PlayerAvatarIcon seed={fifaSoulId || name} size={14} />
        </span>
      )}
      <strong className="font-bold text-ink">{name || 'نامشخص'}</strong>
      {fifaSoulId && <span className="rounded-md bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">{fifaSoulId}</span>}
    </div>
  );
}

// Always shows BOTH sides labeled by role (میزبان/میهمان) — regardless of
// who's viewing — since leg 2 (برگشت) swaps home/away relative to leg 1
// (رفت), and that swap was exactly the source of confusion being fixed here.
function LegParticipants({ leg }) {
  return (
    <div className="mb-3.5 flex flex-wrap gap-x-6 gap-y-2 border-b border-dashed border-border pb-3">
      <PlayerChip name={leg.home_user_name} avatar={leg.home_user_avatar} fifaSoulId={leg.home_user_fifa_soul_id} roleLabel="میزبان:" />
      <PlayerChip name={leg.away_user_name} avatar={leg.away_user_avatar} fifaSoulId={leg.away_user_fifa_soul_id} roleLabel="میهمان:" />
    </div>
  );
}

function ScoreInputRow({ homeLabel, homeId, awayLabel, awayId, homeValue, onHomeChange, awayValue, onAwayChange }) {
  return (
    <div className="mb-3 flex items-end justify-center gap-3.5">
      <div className="flex flex-col items-center gap-1.5">
        <label className="text-center text-[12px] text-ink-muted">
          {homeLabel} {homeId && <span className="rounded-md bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">{homeId}</span>}
        </label>
        <input
          type="number"
          min={0}
          required
          value={homeValue}
          onChange={(e) => onHomeChange(e.target.value)}
          className="w-20 rounded-[10px] border border-border bg-bg-soft px-2.5 py-2.5 text-center text-lg font-bold text-ink outline-none focus-visible:border-gold"
        />
      </div>
      <span className="mb-3 self-center font-bold text-ink-muted">-</span>
      <div className="flex flex-col items-center gap-1.5">
        <label className="text-center text-[12px] text-ink-muted">
          {awayLabel} {awayId && <span className="rounded-md bg-gold/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">{awayId}</span>}
        </label>
        <input
          type="number"
          min={0}
          required
          value={awayValue}
          onChange={(e) => onAwayChange(e.target.value)}
          className="w-20 rounded-[10px] border border-border bg-bg-soft px-2.5 py-2.5 text-center text-lg font-bold text-ink outline-none focus-visible:border-gold"
        />
      </div>
    </div>
  );
}

// Reusable "report a technical problem" link + inline reason form — offered
// alongside the normal submit/confirm actions, not instead of them, since a
// ping/disconnect issue can surface either before a result is submitted or
// while waiting for the other side to confirm it.
function TechnicalIssueReporter({ onReport }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2.5 flex items-center gap-1.5 bg-transparent text-[12px] text-ink-muted outline-none hover:text-gold focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Wifi size={13} /> گزارش نقص فنی (پینگ/قطعی و غیره)
      </button>
    );
  }

  return (
    <form
      className="mt-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        onReport(reason).catch((err) => setError(err.response?.data?.error || 'خطا در ثبت گزارش'));
      }}
    >
      <div className="mb-3 flex flex-col gap-1.5">
        <label className="text-[13px] text-ink-muted">توضیح نقص فنی</label>
        <textarea
          required
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="مثلاً: پینگ حریف بالا بود و بازی قطع و وصل می‌شد"
          className={fieldClass}
        />
      </div>
      {error && <p className="mb-3 text-sm text-critical">{error}</p>}
      <div className="flex gap-2.5">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
          انصراف
        </Button>
        <Button type="submit" variant="magenta" className="flex-1">
          ثبت گزارش
        </Button>
      </div>
    </form>
  );
}

function LegCard({
  leg,
  index,
  userId,
  onSubmit,
  onConfirm,
  onDispute,
  onClaimForfeit,
  onDisputeForfeit,
  onReportTechnicalIssue,
  onConfirmTechnicalIssue,
  onRejectTechnicalIssue,
}) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeHome, setDisputeHome] = useState('');
  const [disputeAway, setDisputeAway] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [forfeitDisputeMode, setForfeitDisputeMode] = useState(false);
  const [error, setError] = useState(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const isParticipant = userId === leg.home_user_id || userId === leg.away_user_id;

  const deadline = parseUtc(leg.deadline_at);
  const deadlinePassed = deadline && Date.now() >= deadline.getTime();
  const forfeitDeadline = parseUtc(leg.forfeit_dispute_deadline);
  const forfeitWindowOpen = forfeitDeadline && Date.now() < forfeitDeadline.getTime();
  const forfeitWinnerId = leg.final_home_score === 3 ? leg.home_user_id : leg.away_user_id;
  const isForfeitLoser = isParticipant && userId !== forfeitWinnerId;

  return (
    <Card className="mb-4 p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-sm font-bold text-ink">
          نیم‌فصل {index + 1} ({index === 0 ? 'رفت' : 'برگشت'})
        </strong>
        <Badge variant="waiting">{legStatusLabel[leg.status]}</Badge>
      </div>

      <LegParticipants leg={leg} />

      {leg.status === 'technical_issue' ? (
        <div>
          <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink-muted">
            <Wifi size={13} /> نقص فنی گزارش‌شده: {leg.technical_issue_reason}
          </p>
          {isParticipant && leg.technical_issue_reported_by === userId ? (
            <p className="text-center text-sm text-ink-muted">در انتظار تایید حریف برای لغو مسابقه...</p>
          ) : isParticipant ? (
            <div className="flex gap-2.5">
              <Button
                variant="magenta"
                className="flex-1"
                onClick={() => onConfirmTechnicalIssue(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                تایید (لغو مسابقه)
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onRejectTechnicalIssue(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                رد کردن (ارجاع به کارشناسی)
              </Button>
            </div>
          ) : null}
        </div>
      ) : leg.status === 'cancelled' ? (
        <p className="text-center text-sm text-ink-muted">این نیم‌فصل به دلیل نقص فنی لغو شد.</p>
      ) : leg.status === 'forfeited' ? (
        <div>
          <div className="mb-3 flex items-center justify-center gap-4 text-xl font-bold">
            <span className="text-ink">{leg.final_home_score}</span>
            <span className="text-sm text-ink-muted">-</span>
            <span className="text-ink">{leg.final_away_score}</span>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink-muted">
            <AlertTriangle size={13} /> نتیجه به دلیل عدم ثبت به موقع، فرجه‌ای اعمال شد.
          </p>
          {isForfeitLoser && forfeitWindowOpen && !forfeitDisputeMode && (
            <Button variant="magenta" className="mt-3 w-full" onClick={() => setForfeitDisputeMode(true)}>
              اعتراض به نتیجه فرجه‌ای ({formatRemaining(forfeitDeadline)} فرصت باقی‌مانده)
            </Button>
          )}
          {isForfeitLoser && forfeitWindowOpen && forfeitDisputeMode && (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                onDisputeForfeit(leg.leg_number, evidenceText, evidenceFile).catch((err) =>
                  setError(err.response?.data?.error || 'خطا در ثبت اعتراض')
                );
              }}
            >
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">توضیحات اعتراض</label>
                <textarea rows={2} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} className={fieldClass} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">عکس مستندات (اختیاری)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                  className="text-[13px] text-ink-muted file:me-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3.5 file:py-2 file:text-[13px] file:text-ink"
                />
              </div>
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForfeitDisputeMode(false)}>
                  انصراف
                </Button>
                <Button type="submit" variant="magenta" className="flex-1">
                  ثبت اعتراض
                </Button>
              </div>
            </form>
          )}
          {isForfeitLoser && !forfeitWindowOpen && (
            <p className="mt-3 text-center text-[13px] text-ink-muted">فرصت اعتراض به پایان رسیده است.</p>
          )}
        </div>
      ) : ['confirmed', 'expert_resolved'].includes(leg.status) ? (
        <div className="mb-3 flex items-center justify-center gap-4 text-xl font-bold">
          <span className="text-ink">{leg.final_home_score}</span>
          <span className="text-sm text-ink-muted">-</span>
          <span className="text-ink">{leg.final_away_score}</span>
          {leg.is_expert_reviewed && (
            <Badge variant="live" className="gap-1 text-[11px]">
              <Gavel size={12} /> نظر کارشناس
            </Badge>
          )}
        </div>
      ) : leg.status === 'expert_review' ? (
        <p className="text-sm text-ink-muted">
          نتیجه ثبت‌شده: {leg.submitted_home_score}-{leg.submitted_away_score} | نتیجه پیشنهادی معترض: {leg.dispute_home_score}-
          {leg.dispute_away_score}
        </p>
      ) : leg.status === 'pending_submission' && isParticipant ? (
        <div>
          {deadline && (
            <p className={`mb-2 flex items-center gap-1.5 text-[13px] ${deadlinePassed ? 'text-magenta' : 'text-ink-muted'}`}>
              <Clock size={13} />
              {deadlinePassed ? 'فرجه زمانی ثبت نتیجه تمام شده است.' : `فرجه باقی‌مانده: ${formatRemaining(deadline)}`}
            </p>
          )}
          {deadlinePassed ? (
            <Button
              variant="magenta"
              className="w-full"
              onClick={() => onClaimForfeit(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا در درخواست فرجه'))}
            >
              درخواست نتیجه ۳-۰ به نفع خودم (فرجه تمام شد)
            </Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                onSubmit(leg.leg_number, Number(homeScore), Number(awayScore)).catch((err) =>
                  setError(err.response?.data?.error || 'خطا در ثبت نتیجه')
                );
              }}
            >
              <ScoreInputRow
                homeLabel={`گل میزبان (${leg.home_user_name || '؟'})`}
                homeId={leg.home_user_fifa_soul_id}
                awayLabel={`گل میهمان (${leg.away_user_name || '؟'})`}
                awayId={leg.away_user_fifa_soul_id}
                homeValue={homeScore}
                onHomeChange={setHomeScore}
                awayValue={awayScore}
                onAwayChange={setAwayScore}
              />
              <Button type="submit" className="w-full">
                ثبت نتیجه
              </Button>
            </form>
          )}
          {!deadlinePassed && <TechnicalIssueReporter onReport={(reason) => onReportTechnicalIssue(leg.leg_number, reason)} />}
        </div>
      ) : leg.status === 'pending_confirmation' && isParticipant && leg.submitted_by_id !== userId ? (
        <div>
          <p className="mb-3 text-center">
            نتیجه ثبت‌شده: <strong className="text-ink">{leg.submitted_home_score} - {leg.submitted_away_score}</strong>
          </p>
          {!disputeMode ? (
            <div className="flex gap-2.5">
              <Button
                className="flex-1"
                onClick={() => onConfirm(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                تایید نتیجه
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setDisputeMode(true)}>
                اعتراض
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                onDispute(leg.leg_number, Number(disputeHome), Number(disputeAway), evidenceText, evidenceFile).catch((err) =>
                  setError(err.response?.data?.error || 'خطا در ثبت اعتراض')
                );
              }}
            >
              <ScoreInputRow
                homeLabel={`گل میزبان (${leg.home_user_name || '؟'})`}
                homeId={leg.home_user_fifa_soul_id}
                awayLabel={`گل میهمان (${leg.away_user_name || '؟'})`}
                awayId={leg.away_user_fifa_soul_id}
                homeValue={disputeHome}
                onHomeChange={setDisputeHome}
                awayValue={disputeAway}
                onAwayChange={setDisputeAway}
              />
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">توضیحات (اختیاری)</label>
                <textarea rows={2} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} className={fieldClass} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">عکس مستندات (اختیاری)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                  className="text-[13px] text-ink-muted file:me-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3.5 file:py-2 file:text-[13px] file:text-ink"
                />
              </div>
              <div className="flex gap-2.5">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDisputeMode(false)}>
                  انصراف
                </Button>
                <Button type="submit" variant="magenta" className="flex-1">
                  ثبت اعتراض
                </Button>
              </div>
            </form>
          )}
          {!disputeMode && <TechnicalIssueReporter onReport={(reason) => onReportTechnicalIssue(leg.leg_number, reason)} />}
        </div>
      ) : leg.status === 'pending_confirmation' ? (
        <p className="text-sm text-ink-muted">
          نتیجه ثبت شده ({leg.submitted_home_score}-{leg.submitted_away_score})، در انتظار تایید حریف.
        </p>
      ) : (
        <p className="text-sm text-ink-muted">در انتظار شروع.</p>
      )}

      {error && <p className="mt-3 text-sm text-critical">{error}</p>}
    </Card>
  );
}

function TimeLimitControl({ match, onUpdate }) {
  const [hours, setHours] = useState(match.time_limit_hours || 24);

  return (
    <Card className="mb-6 flex flex-wrap items-center gap-2.5 p-4">
      <Gavel size={16} className="text-gold" />
      <span className="text-[13px] text-ink-muted">تنظیم فرجه زمانی کارشناسی (ساعت):</span>
      <Input type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} className="w-[90px] rounded-md" />
      <Button variant="outline" size="sm" onClick={() => onUpdate(hours)}>
        اعمال
      </Button>
    </Card>
  );
}

export default function H2HDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [legs, setLegs] = useState([]);
  const [joinPassword, setJoinPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get(`/h2h/${id}`).then(({ data }) => {
      setMatch(data.match);
      setLegs(data.legs);
    });
    refreshUser();
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleJoin() {
    setError(null);
    try {
      await api.post(`/h2h/${id}/join`, match.is_private ? { password: joinPassword } : {});
      setMessage('با موفقیت جوین شدید! مسابقه قفل شد.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در جوین شدن');
    }
  }

  async function submitLeg(legNumber, home, away) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/submit`, { home_score: home, away_score: away });
    load();
    return data;
  }

  async function confirmLeg(legNumber) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/confirm`);
    load();
    return data;
  }

  async function disputeLeg(legNumber, home, away, evidenceText, file) {
    const formData = new FormData();
    formData.append('home_score', home);
    formData.append('away_score', away);
    if (evidenceText) formData.append('evidence', evidenceText);
    if (file) formData.append('evidence_file', file);
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/dispute`, formData);
    load();
    return data;
  }

  async function claimForfeit(legNumber) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/claim-forfeit`);
    load();
    return data;
  }

  async function disputeForfeit(legNumber, evidenceText, file) {
    const formData = new FormData();
    if (evidenceText) formData.append('evidence', evidenceText);
    if (file) formData.append('evidence_file', file);
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/dispute-forfeit`, formData);
    load();
    return data;
  }

  async function updateTimeLimit(hours) {
    setError(null);
    try {
      await api.put(`/h2h/${id}/time-limit`, { time_limit_hours: Number(hours) });
      setMessage('فرجه زمانی به‌روزرسانی شد.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در تنظیم فرجه زمانی');
    }
  }

  async function reportTechnicalIssue(legNumber, reason) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/report-technical-issue`, { reason });
    load();
    return data;
  }

  async function confirmTechnicalIssue(legNumber) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/confirm-technical-issue`);
    load();
    return data;
  }

  async function rejectTechnicalIssue(legNumber) {
    const { data } = await api.post(`/h2h/${id}/legs/${legNumber}/reject-technical-issue`);
    load();
    return data;
  }

  if (!match) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="bg-[linear-gradient(135deg,var(--color-brand-900),var(--color-bg-soft))] px-4 py-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">مسابقه رو-در-رو #{match.id}</h1>
        <p className="text-ink-muted">
          {match.console || 'کنسول نامشخص'} — {match.game_version || 'ورژن نامشخص'} —{' '}
          {match.stake_type === 'ticket' ? `${match.stake_amount} تیکت` : 'رایگان (XP)'}
        </p>
      </div>

      <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
        {hasStaffAccess(user, ['senior_admin', 'match_expert']) && match.status === 'locked' && (
          <TimeLimitControl match={match} onUpdate={updateTimeLimit} />
        )}

        {match.status === 'completed' && (
          <div className="mb-5 rounded-md border border-gold/30 bg-gradient-to-br from-gold/15 to-transparent p-5 text-center font-bold text-gold">
            <Trophy size={20} className="me-2 inline-block align-middle" />
            {match.winner_id
              ? user && match.winner_id === user.id
                ? 'تبریک! شما برنده این مسابقه شدید.'
                : 'این مسابقه به پایان رسید.'
              : 'این مسابقه با تساوی به پایان رسید.'}
          </div>
        )}

        {match.status === 'completed' && match.winner_id && match.stake_type === 'ticket' && match.platform_fee_amount !== null && (
          <p className="-mt-3 mb-5 text-center text-[13px] text-ink-muted">
            مبلغ واریزی به برنده: {match.stake_amount * 2 - match.platform_fee_amount} تیکت (کارمزد سایت: {match.platform_fee_amount} تیکت)
          </p>
        )}

        {match.status === 'cancelled' && (
          <div className="mb-5 rounded-md border border-magenta/40 bg-gradient-to-br from-magenta/15 to-transparent p-5 text-center font-bold text-magenta-light">
            <Wifi size={20} className="me-2 inline-block align-middle" />
            این مسابقه به دلیل نقص فنی لغو شد{match.cancel_reason ? `: ${match.cancel_reason}` : ''} — مبلغ ورودی بازگردانده شد.
          </div>
        )}

        {match.status === 'open' && user && match.creator_id !== user.id && (
          <Card className="mb-6 p-5">
            {match.is_private && (
              <div className="mb-3 flex flex-col gap-1.5">
                <label className="text-[13px] text-ink-muted">رمز عبور مسابقه</label>
                <Input type="text" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className="rounded-md" />
              </div>
            )}
            <Button onClick={handleJoin}>جوین شدن به این مسابقه</Button>
            {message && <p className="mt-2.5 text-sm font-medium text-success">{message}</p>}
            {error && <p className="mt-2.5 text-sm text-critical">{error}</p>}
          </Card>
        )}
        {match.status === 'open' && !user && (
          <div className="py-10 text-center text-sm text-ink-faint">برای جوین شدن ابتدا وارد حساب کاربری خود شوید.</div>
        )}

        {legs.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-gold">نیم‌فصل‌های مسابقه</h3>
            {legs.map((leg, i) => (
              <LegCard
                key={leg.id}
                leg={leg}
                index={i}
                userId={user?.id}
                onSubmit={submitLeg}
                onConfirm={confirmLeg}
                onDispute={disputeLeg}
                onClaimForfeit={claimForfeit}
                onDisputeForfeit={disputeForfeit}
                onReportTechnicalIssue={reportTechnicalIssue}
                onConfirmTechnicalIssue={confirmTechnicalIssue}
                onRejectTechnicalIssue={rejectTechnicalIssue}
              />
            ))}
          </div>
        )}

        <Button asChild variant="outline" className="mt-5">
          <Link to="/h2h">بازگشت به لیست مسابقات</Link>
        </Button>
      </div>
    </div>
  );
}
