import { useEffect, useState } from 'react';
import { Users, Swords, Trophy, Shield, Award } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/home.css';

const items = [
  { key: 'members', label: 'عضو فعال', icon: Users },
  { key: 'ro_dero', label: 'رو در رو', icon: Swords },
  { key: 'play_off', label: 'پلی آف', icon: Shield },
  { key: 'leagues', label: 'لیگ', icon: Trophy },
  { key: 'cups', label: 'کاپ', icon: Award },
];

export default function StatsSection() {
  const [stats, setStats] = useState({ members: 0, ro_dero: 0, play_off: 0, leagues: 0, cups: 0 });

  useEffect(() => {
    api.get('/stats').then(({ data }) => setStats(data.stats));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">FIFA Soul در یک نگاه</h2>
        <div className="stats-grid">
          {items.map(({ key, label, icon: Icon }) => (
            <div className="card stat-card" key={key}>
              <div className="icon">
                <Icon size={24} />
              </div>
              <div className="value">{stats[key] ?? 0}</div>
              <div className="label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
