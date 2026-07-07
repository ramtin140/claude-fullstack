import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Gavel } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/h2h.css';
import '../styles/pages.css';

const legStatusLabel = {
  pending_submission: 'در انتظار ثبت نتیجه',
  pending_confirmation: 'در انتظار تایید حریف',
  confirmed: 'تایید شده',
  expert_review: 'در حال بررسی کارشناسی',
  expert_resolved: 'توسط کارشناس نهایی شد',
};

function LegCard({ leg, index, userId, onSubmit, onConfirm, onDispute }) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputeHome, setDisputeHome] = useState('');
  const [disputeAway, setDisputeAway] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [error, setError] = useState(null);

  const isParticipant = userId === leg.home_user_id || userId === leg.away_user_id;

  return (
    <div className="card leg-card">
      <div className="leg-title">
        <strong>نیم‌فصل {index + 1}</strong>
        <span className="badge badge-waiting">{legStatusLabel[leg.status]}</span>
      </div>

      {['confirmed', 'expert_resolved'].includes(leg.status) ? (
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            onSubmit(leg.leg_number, Number(homeScore), Number(awayScore)).catch((err) =>
              setError(err.response?.data?.error || 'خطا در ثبت نتیجه')
            );
          }}
        >
          <div className="leg-score-row">
            <input type="number" min={0} required value={homeScore} onChange={(e) => setHomeScore(e.target.value)} />
            <span>-</span>
            <input type="number" min={0} required value={awayScore} onChange={(e) => setAwayScore(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
            ثبت نتیجه
          </button>
        </form>
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
              <div className="leg-score-row">
                <input type="number" min={0} required value={disputeHome} onChange={(e) => setDisputeHome(e.target.value)} />
                <span>-</span>
                <input type="number" min={0} required value={disputeAway} onChange={(e) => setDisputeAway(e.target.value)} />
              </div>
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
