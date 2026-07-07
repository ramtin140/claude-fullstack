import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { User, MessageCircle, Swords } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages.css';

export default function PublicProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/users/${id}/profile`)
      .then(({ data }) => setProfile(data.user))
      .catch(() => setNotFound(true));
    api.get('/messages/settings').then(({ data }) => setMessagingEnabled(data.messaging_enabled));
  }, [id]);

  if (notFound) return <Navigate to="/players" replace />;
  if (me && String(me.id) === String(id)) return <Navigate to="/profile" replace />;
  if (!profile) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  async function sendChallenge() {
    setError(null);
    setMessage(null);
    try {
      await api.post('/challenges', { to_user_id: profile.id });
      setMessage('چالش با موفقیت ارسال شد!');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال چالش');
    }
  }

  return (
    <div className="page-wrap">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 640 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 24 }}>
          {profile.avatar_url ? (
            <img src={assetUrl(profile.avatar_url)} alt="" className="profile-avatar" style={{ margin: '0 auto' }} />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder" style={{ margin: '0 auto' }}>
              <User size={36} />
            </div>
          )}
          <h1 style={{ margin: '14px 0 2px' }}>
            {profile.name} {profile.is_vip && <span className="badge badge-live">VIP</span>}
            {profile.is_guest && <span className="badge" style={{ marginRight: 6 }}>مهمان</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{profile.fifa_soul_id}</p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {messagingEnabled && me && (
              <Link to={`/messages/${profile.id}`} className="btn btn-primary">
                <MessageCircle size={16} /> ارسال پیام
              </Link>
            )}
            {me?.is_vip && (
              <button className="btn btn-outline" onClick={sendChallenge}>
                <Swords size={16} /> ارسال چالش
              </button>
            )}
          </div>
          {message && <p className="success-text" style={{ marginTop: 12 }}>{message}</p>}
          {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 24 }}>
          <div className="card dashboard-stat">
            <div className="value" style={{ color: 'var(--gold)' }}>{profile.grade}</div>
            <div className="label">گرید فصلی ({profile.season_points} امتیاز)</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value">{profile.wins}</div>
            <div className="label">برد</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value">{profile.losses}</div>
            <div className="label">باخت</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value">{profile.draws}</div>
            <div className="label">مساوی</div>
          </div>
        </div>

        {(profile.psn_id || profile.xbox_id || profile.steam_id) && (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>شناسه‌های کنسول</h3>
            {profile.psn_id && <p>PSN: {profile.psn_id}</p>}
            {profile.xbox_id && <p>XBOX: {profile.xbox_id}</p>}
            {profile.steam_id && <p>Steam: {profile.steam_id}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
