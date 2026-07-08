import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Gavel, User, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hasStaffAccess } from '../components/ProtectedRoute.jsx';
import { parseUtc } from '../utils/datetime.js';
import '../styles/h2h.css';
import '../styles/pages.css';

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

function PlayerChip({ name, avatar, fifaSoulId, roleLabel }) {
  return (
    <div className="opponent-chip">
      <span className="role-tag">{roleLabel}</span>
      {avatar ? (
        <img src={assetUrl(avatar)} alt="" />
      ) : (
        <span className="opponent-avatar-placeholder">
          <User size={14} />
        </span>
      )}
      <strong>{name || 'نامشخص'}</strong>
      {fifaSoulId && <span className="fifa-soul-tag">{fifaSoulId}</span>}
    </div>
  );
}

// Always shows BOTH sides labeled by role (میزبان/میهمان) — regardless of
// who's viewing — since leg 2 (برگشت) swaps home/away relative to leg 1
// (رفت), and that swap was exactly the source of confusion being fixed here.
function LegParticipants({ leg }) {
  return (
    <div className="leg-participants">
      <PlayerChip name={leg.home_user_name} avatar={leg.home_user_avatar} fifaSoulId={leg.home_user_fifa_soul_id} roleLabel="میزبان:" />
      <PlayerChip name={leg.away_user_name} avatar={leg.away_user_avatar} fifaSoulId={leg.away_user_fifa_soul_id} roleLabel="میهمان:" />
    </div>
  );
}

function ScoreInputRow({ homeLabel, homeId, awayLabel, awayId, homeValue, onHomeChange, awayValue, onAwayChange }) {
  return (
    <div className="score-input-row">
      <div className="score-input-col">
        <label>
          {homeLabel} {homeId && <span className="fifa-soul-tag">{homeId}</span>}
        </label>
        <input type="number" min={0} required value={homeValue} onChange={(e) => onHomeChange(e.target.value)} />
      </div>
      <span className="score-input-sep">-</span>
      <div className="score-input-col">
        <label>
          {awayLabel} {awayId && <span className="fifa-soul-tag">{awayId}</span>}
        </label>
        <input type="number" min={0} required value={awayValue} onChange={(e) => onAwayChange(e.target.value)} />
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
      <button type="button" className="btn-link-muted" onClick={() => setOpen(true)}>
        <Wifi size={13} /> گزارش نقص فنی (پینگ/قطعی و غیره)
      </button>
    );
  }

  return (
    <form
      style={{ marginTop: 10 }}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        onReport(reason).catch((err) => setError(err.response?.data?.error || 'خطا در ثبت گزارش'));
      }}
    >
      <div className="form-field">
        <label>توضیح نقص فنی</label>
        <textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثلاً: پینگ حریف بالا بود و بازی قطع و وصل می‌شد" />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setOpen(false)}>
          انصراف
        </button>
        <button type="submit" className="btn btn-magenta" style={{ flex: 1 }}>
          ثبت گزارش
        </button>
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
    <div className="card leg-card">
      <div className="leg-title">
        <strong>نیم‌فصل {index + 1} ({index === 0 ? 'رفت' : 'برگشت'})</strong>
        <span className="badge badge-waiting">{legStatusLabel[leg.status]}</span>
      </div>

      <LegParticipants leg={leg} />

      {leg.status === 'technical_issue' ? (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            <Wifi size={13} style={{ verticalAlign: 'middle' }} /> نقص فنی گزارش‌شده: {leg.technical_issue_reason}
          </p>
          {isParticipant && leg.technical_issue_reported_by === userId ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              در انتظار تایید حریف برای لغو مسابقه...
            </p>
          ) : isParticipant ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-magenta"
                style={{ flex: 1 }}
                onClick={() => onConfirmTechnicalIssue(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                تایید (لغو مسابقه)
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => onRejectTechnicalIssue(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                رد کردن (ارجاع به کارشناسی)
              </button>
            </div>
          ) : null}
        </div>
      ) : leg.status === 'cancelled' ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          این نیم‌فصل به دلیل نقص فنی لغو شد.
        </p>
      ) : leg.status === 'forfeited' ? (
        <div>
          <div className="leg-score-row">
            <span>{leg.final_home_score}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</span>
            <span>{leg.final_away_score}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            <AlertTriangle size={13} style={{ verticalAlign: 'middle' }} /> نتیجه به دلیل عدم ثبت به موقع، فرجه‌ای اعمال شد.
          </p>
          {isForfeitLoser && forfeitWindowOpen && !forfeitDisputeMode && (
            <button className="btn btn-magenta" style={{ width: '100%' }} onClick={() => setForfeitDisputeMode(true)}>
              اعتراض به نتیجه فرجه‌ای ({formatRemaining(forfeitDeadline)} فرصت باقی‌مانده)
            </button>
          )}
          {isForfeitLoser && forfeitWindowOpen && forfeitDisputeMode && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                onDisputeForfeit(leg.leg_number, evidenceText, evidenceFile).catch((err) =>
                  setError(err.response?.data?.error || 'خطا در ثبت اعتراض')
                );
              }}
            >
              <div className="form-field">
                <label>توضیحات اعتراض</label>
                <textarea rows={2} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} />
              </div>
              <div className="form-field">
                <label>عکس مستندات (اختیاری)</label>
                <input
                  className="evidence-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setForfeitDisputeMode(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-magenta" style={{ flex: 1 }}>
                  ثبت اعتراض
                </button>
              </div>
            </form>
          )}
          {isForfeitLoser && !forfeitWindowOpen && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              فرصت اعتراض به پایان رسیده است.
            </p>
          )}
        </div>
      ) : ['confirmed', 'expert_resolved'].includes(leg.status) ? (
        <div className="leg-score-row">
          <span>{leg.final_home_score}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>-</span>
          <span>{leg.final_away_score}</span>
          {leg.is_expert_reviewed && (
            <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>
              <Gavel size={12} /> نظر کارشناس
            </span>
          )}
        </div>
      ) : leg.status === 'expert_review' ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          نتیجه ثبت‌شده: {leg.submitted_home_score}-{leg.submitted_away_score} | نتیجه پیشنهادی معترض:{' '}
          {leg.dispute_home_score}-{leg.dispute_away_score}
        </p>
      ) : leg.status === 'pending_submission' && isParticipant ? (
        <div>
          {deadline && (
            <p style={{ color: deadlinePassed ? 'var(--magenta)' : 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} />
              {deadlinePassed ? 'فرجه زمانی ثبت نتیجه تمام شده است.' : `فرجه باقی‌مانده: ${formatRemaining(deadline)}`}
            </p>
          )}
          {deadlinePassed ? (
            <button
              className="btn btn-magenta"
              style={{ width: '100%' }}
              onClick={() => onClaimForfeit(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا در درخواست فرجه'))}
            >
              درخواست نتیجه ۳-۰ به نفع خودم (فرجه تمام شد)
            </button>
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
              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                ثبت نتیجه
              </button>
            </form>
          )}
          {!deadlinePassed && (
            <TechnicalIssueReporter onReport={(reason) => onReportTechnicalIssue(leg.leg_number, reason)} />
          )}
        </div>
      ) : leg.status === 'pending_confirmation' && isParticipant && leg.submitted_by_id !== userId ? (
        <div>
          <p style={{ textAlign: 'center', marginBottom: 12 }}>
            نتیجه ثبت‌شده: <strong>{leg.submitted_home_score} - {leg.submitted_away_score}</strong>
          </p>
          {!disputeMode ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => onConfirm(leg.leg_number).catch((err) => setError(err.response?.data?.error || 'خطا'))}
              >
                تایید نتیجه
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDisputeMode(true)}>
                اعتراض
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                onDispute(leg.leg_number, Number(disputeHome), Number(disputeAway), evidenceText, evidenceFile).catch(
                  (err) => setError(err.response?.data?.error || 'خطا در ثبت اعتراض')
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
              <div className="form-field">
                <label>توضیحات (اختیاری)</label>
                <textarea rows={2} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} />
              </div>
              <div className="form-field">
                <label>عکس مستندات (اختیاری)</label>
                <input
                  className="evidence-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDisputeMode(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-magenta" style={{ flex: 1 }}>
                  ثبت اعتراض
                </button>
              </div>
            </form>
          )}
          {!disputeMode && (
            <TechnicalIssueReporter onReport={(reason) => onReportTechnicalIssue(leg.leg_number, reason)} />
          )}
        </div>
      ) : leg.status === 'pending_confirmation' ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          نتیجه ثبت شده ({leg.submitted_home_score}-{leg.submitted_away_score})، در انتظار تایید حریف.
        </p>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>در انتظار شروع.</p>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

function TimeLimitControl({ match, onUpdate }) {
  const [hours, setHours] = useState(match.time_limit_hours || 24);

  return (
    <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <Gavel size={16} style={{ color: 'var(--gold)' }} />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>تنظیم فرجه زمانی کارشناسی (ساعت):</span>
      <input
        type="number"
        min={1}
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        style={{ width: 90, padding: 8, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
      />
      <button className="btn btn-outline" style={{ padding: '6px 16px' }} onClick={() => onUpdate(hours)}>
        اعمال
      </button>
    </div>
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

  if (!match) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  return (
    <div className="page-wrap">
      <div className="detail-hero">
        <div className="container">
          <h1>مسابقه رو-در-رو #{match.id}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {match.console || 'کنسول نامشخص'} — {match.game_version || 'ورژن نامشخص'} —{' '}
            {match.stake_type === 'ticket' ? `${match.stake_amount} تیکت` : 'رایگان (XP)'}
          </p>
        </div>
      </div>

      <div className="container detail-body">
        {hasStaffAccess(user, ['senior_admin', 'match_expert']) && match.status === 'locked' && (
          <TimeLimitControl match={match} onUpdate={updateTimeLimit} />
        )}

        {match.status === 'completed' && (
          <div className="winner-banner">
            <Trophy size={20} style={{ verticalAlign: 'middle', marginLeft: 8 }} />
            {match.winner_id
              ? user && match.winner_id === user.id
                ? 'تبریک! شما برنده این مسابقه شدید.'
                : 'این مسابقه به پایان رسید.'
              : 'این مسابقه با تساوی به پایان رسید.'}
          </div>
        )}

        {match.status === 'completed' && match.winner_id && match.stake_type === 'ticket' && match.platform_fee_amount !== null && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: -12, marginBottom: 20 }}>
            مبلغ واریزی به برنده: {match.stake_amount * 2 - match.platform_fee_amount} تیکت (کارمزد سایت: {match.platform_fee_amount} تیکت)
          </p>
        )}

        {match.status === 'cancelled' && (
          <div className="winner-banner" style={{ borderColor: 'var(--magenta)', color: 'var(--magenta)' }}>
            <Wifi size={20} style={{ verticalAlign: 'middle', marginLeft: 8 }} />
            این مسابقه به دلیل نقص فنی لغو شد{match.cancel_reason ? `: ${match.cancel_reason}` : ''} — مبلغ شرط‌بندی بازگردانده شد.
          </div>
        )}

        {match.status === 'open' && user && match.creator_id !== user.id && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            {match.is_private && (
              <div className="form-field">
                <label>رمز عبور مسابقه</label>
                <input type="text" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
              </div>
            )}
            <button className="btn btn-primary" onClick={handleJoin}>
              جوین شدن به این مسابقه
            </button>
            {message && <p className="success-text" style={{ marginTop: 10 }}>{message}</p>}
            {error && <p className="error-text" style={{ marginTop: 10 }}>{error}</p>}
          </div>
        )}
        {match.status === 'open' && !user && (
          <div className="empty-state">برای جوین شدن ابتدا وارد حساب کاربری خود شوید.</div>
        )}

        {legs.length > 0 && (
          <div>
            <h3 style={{ color: 'var(--gold)' }}>نیم‌فصل‌های مسابقه</h3>
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

        <Link to="/h2h" className="btn btn-outline" style={{ marginTop: 20 }}>
          بازگشت به لیست مسابقات
        </Link>
      </div>
    </div>
  );
}
