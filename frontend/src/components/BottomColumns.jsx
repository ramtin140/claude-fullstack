import { useEffect, useState } from 'react';
import { Radio, Clock, Star } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/home.css';

export default function BottomColumns() {
  const [inProgress, setInProgress] = useState([]);
  const [waiting, setWaiting] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    api.get('/matches', { params: { status: 'in_progress' } }).then(({ data }) => setInProgress(data.matches));
    api.get('/matches', { params: { status: 'waiting' } }).then(({ data }) => setWaiting(data.matches));
    api.get('/stats/leaderboard').then(({ data }) => setLeaders(data.leaderboard));
  }, []);

  return (
    <section className="section">
      <div className="container columns-grid">
        <div className="card column-card">
          <h3>
            <Radio size={18} /> مسابقات در حال اجرا
          </h3>
          {inProgress.length === 0 && <div className="empty-state">مسابقه‌ای در حال اجرا نیست.</div>}
          {inProgress.map((m) => (
            <div className="match-row" key={m.id}>
              <div className="match-vs">
                {m.home_name}
                <span className="vs-badge">VS</span>
                {m.away_name || '؟'}
              </div>
              <span className="badge badge-live">زنده</span>
            </div>
          ))}
        </div>

        <div className="card column-card">
          <h3>
            <Clock size={18} /> مسابقات در انتظار
          </h3>
          {waiting.length === 0 && <div className="empty-state">مسابقه‌ای در انتظار نیست.</div>}
          {waiting.map((m) => (
            <div className="match-row" key={m.id}>
              <div className="match-vs">
                {m.home_name}
                <span className="vs-badge">VS</span>
                {m.away_name || '؟'}
              </div>
              <span className="badge badge-waiting">در انتظار</span>
            </div>
          ))}
        </div>

        <div className="card column-card">
          <h3>
            <Star size={18} /> اعضای برتر
          </h3>
          {leaders.map((u, i) => (
            <div className="leader-row" key={u.id}>
              <span className={`leader-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</span>
              <div style={{ flex: 1 }}>{u.name}</div>
              <div style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>{u.points} امتیاز</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
