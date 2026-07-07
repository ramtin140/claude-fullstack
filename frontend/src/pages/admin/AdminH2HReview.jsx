import { useEffect, useState } from 'react';
import { adminEconomyApi } from '../../api/h2h.js';
import '../../styles/admin.css';
import '../../styles/h2h.css';

export default function AdminH2HReview() {
  const [legs, setLegs] = useState([]);
  const [scores, setScores] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    adminEconomyApi.expertQueue()
      .then(({ data }) => setLegs(data.legs || []))
      .catch((err) => setError(err.response?.data?.error || 'خطا در دریافت صف کارشناسی'));
  };

  useEffect(() => { load(); }, []);

  const setScore = (legId, key, value) => setScores((old) => ({ ...old, [legId]: { ...old[legId], [key]: value } }));

  const resolve = async (leg) => {
    setError(''); setMessage('');
    const score = scores[leg.id] || {};
    try {
      await adminEconomyApi.expertResolve(leg.match_id, leg.leg_number, {
        home_score: Number(score.home_score),
        away_score: Number(score.away_score),
      });
      setMessage(`نتیجه بازی ${leg.match_id} / نیم‌فصل ${leg.leg_number} توسط کارشناس ثبت شد.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'ثبت نظر کارشناس ناموفق بود.');
    }
  };

  return (
    <div>
      <h1>صف داوری بازی‌های رو-در-رو</h1>
      <p className="h2h-muted">اعتراض‌های ثبت‌شده توسط کاربران اینجا بررسی و نتیجه نهایی توسط کارشناس ثبت می‌شود.</p>
      {message && <div className="h2h-message success">{message}</div>}
      {error && <div className="h2h-message error">{error}</div>}

      <div className="card">
        {legs.length === 0 ? <p>در حال حاضر اعتراضی در صف کارشناسی نیست.</p> : (
          <table className="h2h-table">
            <thead>
              <tr><th>Match</th><th>Leg</th><th>نتیجه ثبت‌شده</th><th>اعتراض</th><th>مستندات</th><th>نتیجه نهایی</th><th></th></tr>
            </thead>
            <tbody>
              {legs.map((leg) => (
                <tr key={leg.id}>
                  <td>{leg.match_id}</td>
                  <td>{leg.leg_number}</td>
                  <td>{leg.submitted_home_score} - {leg.submitted_away_score}</td>
                  <td>{leg.dispute_home_score} - {leg.dispute_away_score}</td>
                  <td>{leg.dispute_evidence || '-'}</td>
                  <td>
                    <div className="h2h-score-box">
                      <input type="number" min="0" placeholder="میزبان" value={scores[leg.id]?.home_score || ''} onChange={(e) => setScore(leg.id, 'home_score', e.target.value)} />
                      <input type="number" min="0" placeholder="مهمان" value={scores[leg.id]?.away_score || ''} onChange={(e) => setScore(leg.id, 'away_score', e.target.value)} />
                    </div>
                  </td>
                  <td><button className="btn btn-primary" onClick={() => resolve(leg)}>ثبت داوری</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
