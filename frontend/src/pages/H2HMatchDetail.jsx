import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { h2hApi } from '../api/h2h.js';
import '../styles/pages.css';
import '../styles/h2h.css';

function LegPanel({ matchId, leg, onDone }) {
  const [submitScore, setSubmitScore] = useState({ home_score: '', away_score: '' });
  const [disputeScore, setDisputeScore] = useState({ home_score: '', away_score: '', evidence: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn, okMessage) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await fn();
      setMessage(okMessage);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'عملیات ناموفق بود.');
    } finally { setBusy(false); }
  };

  return (
    <div className="card h2h-card">
      <h3>بازی {leg.leg_number} - رفت/برگشت</h3>
      <div className="h2h-meta">
        <span className="h2h-pill">میزبان: {leg.home_user_id}</span>
        <span className="h2h-pill">مهمان: {leg.away_user_id}</span>
        <span className="h2h-pill">وضعیت: {leg.status}</span>
        {leg.is_expert_reviewed ? <span className="h2h-pill">بررسی‌شده توسط کارشناس</span> : null}
      </div>
      {error && <div className="h2h-message error">{error}</div>}
      {message && <div className="h2h-message success">{message}</div>}

      {leg.status === 'pending_submission' && (
        <form className="h2h-form" onSubmit={(e) => { e.preventDefault(); run(() => h2hApi.submitLeg(matchId, leg.leg_number, { home_score: Number(submitScore.home_score), away_score: Number(submitScore.away_score) }), 'نتیجه ثبت شد و منتظر تایید حریف است.'); }}>
          <div className="h2h-score-box">
            <label>گل میزبان<input type="number" min="0" value={submitScore.home_score} onChange={(e) => setSubmitScore({ ...submitScore, home_score: e.target.value })} /></label>
            <label>گل مهمان<input type="number" min="0" value={submitScore.away_score} onChange={(e) => setSubmitScore({ ...submitScore, away_score: e.target.value })} /></label>
          </div>
          <button className="btn btn-primary" disabled={busy}>ثبت نتیجه</button>
        </form>
      )}

      {leg.status === 'pending_confirmation' && (
        <>
          <div className="h2h-message">نتیجه ثبت‌شده: {leg.submitted_home_score} - {leg.submitted_away_score}</div>
          <div className="h2h-actions">
            <button className="btn btn-primary" disabled={busy} onClick={() => run(() => h2hApi.confirmLeg(matchId, leg.leg_number), 'نتیجه تایید شد.')}>تایید نتیجه</button>
          </div>
          <form className="h2h-form" onSubmit={(e) => { e.preventDefault(); run(() => h2hApi.disputeLeg(matchId, leg.leg_number, { home_score: Number(disputeScore.home_score), away_score: Number(disputeScore.away_score), evidence: disputeScore.evidence }), 'اعتراض ثبت شد و برای کارشناس ارسال شد.'); }}>
            <h4>اعتراض به نتیجه</h4>
            <div className="h2h-score-box">
              <label>گل میزبان مورد نظر شما<input type="number" min="0" value={disputeScore.home_score} onChange={(e) => setDisputeScore({ ...disputeScore, home_score: e.target.value })} /></label>
              <label>گل مهمان مورد نظر شما<input type="number" min="0" value={disputeScore.away_score} onChange={(e) => setDisputeScore({ ...disputeScore, away_score: e.target.value })} /></label>
            </div>
            <label>مستندات / لینک عکس / توضیحات<textarea value={disputeScore.evidence} onChange={(e) => setDisputeScore({ ...disputeScore, evidence: e.target.value })} /></label>
            <button className="btn btn-outline" disabled={busy}>ثبت اعتراض</button>
          </form>
        </>
      )}

      {['confirmed', 'expert_resolved'].includes(leg.status) && (
        <div className="h2h-message success">نتیجه نهایی: {leg.final_home_score} - {leg.final_away_score}</div>
      )}
      {leg.status === 'expert_review' && <div className="h2h-message">این بازی در صف بررسی کارشناس است.</div>}
    </div>
  );
}

export default function H2HMatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [legs, setLegs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setError('');
    h2hApi.get(id)
      .then(({ data }) => { setMatch(data.match); setLegs(data.legs || []); })
      .catch((err) => setError(err.response?.data?.error || 'مسابقه دریافت نشد.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>جزئیات بازی رو-در-رو #{id}</h1>
        <p>ثبت نتیجه، تایید حریف، اعتراض و داوری کارشناس</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {error && <div className="h2h-message error">{error}</div>}
        {loading ? <div className="card">در حال بارگذاری...</div> : match && (
          <>
            <div className="card h2h-card">
              <h3>وضعیت مسابقه: {match.status}</h3>
              <div className="h2h-meta">
                <span className="h2h-pill">سازنده: {match.creator_id}</span>
                <span className="h2h-pill">حریف: {match.opponent_id || 'هنوز ندارد'}</span>
                <span className="h2h-pill">نوع: {match.stake_type}</span>
                <span className="h2h-pill">مبلغ: {match.stake_amount}</span>
                {match.winner_id ? <span className="h2h-pill">برنده: {match.winner_id}</span> : null}
              </div>
              <div className="h2h-actions"><Link className="btn btn-outline" to="/h2h">بازگشت</Link><Link className="btn btn-outline" to="/wallet">کیف پول</Link></div>
            </div>
            <div className="h2h-grid" style={{ marginTop: 18 }}>
              {legs.length ? legs.map((leg) => <LegPanel key={leg.id} matchId={id} leg={leg} onDone={load} />) : <div className="card">بعد از جوین شدن حریف، دو بازی رفت/برگشت ساخته می‌شود.</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
