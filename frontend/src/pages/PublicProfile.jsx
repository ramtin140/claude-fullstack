import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, Swords, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

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
  if (!profile) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

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
    <div className="mx-auto max-w-[640px] px-4 py-10 md:px-6">
      <Card className="mb-6 flex flex-col items-center p-6 text-center">
        <Avatar className="h-24 w-24 border-2 border-gold">
          {profile.avatar_url ? <AvatarImage src={assetUrl(profile.avatar_url)} alt="" /> : null}
          <AvatarFallback>
            <PlayerAvatarIcon seed={profile.id} size={36} />
          </AvatarFallback>
        </Avatar>
        <h1 className="mb-0.5 mt-3.5 flex items-center gap-2 text-lg font-bold text-ink">
          {profile.name}
          {profile.is_vip && <Badge variant="live">VIP</Badge>}
          {profile.is_guest && <Badge variant="finished">مهمان</Badge>}
        </h1>
        <p className="font-mono text-[13px] text-ink-muted">{profile.fifa_soul_id}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {messagingEnabled && me && (
            <Button asChild>
              <Link to={`/messages/${profile.id}`} className="gap-1.5">
                <MessageCircle size={16} /> ارسال پیام
              </Link>
            </Button>
          )}
          {me?.is_vip && (
            <Button variant="outline" onClick={sendChallenge} className="gap-1.5">
              <Swords size={16} /> ارسال چالش
            </Button>
          )}
        </div>
        {message && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={15} /> {message}
          </p>
        )}
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-critical">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Card className="flex flex-col items-center gap-1 px-3 py-5 text-center">
          <div className="text-xl font-extrabold text-gold">{profile.grade}</div>
          <div className="text-[12px] text-ink-muted">گرید فصلی ({profile.season_points} امتیاز)</div>
        </Card>
        <Card className="flex flex-col items-center gap-1 px-3 py-5 text-center">
          <div className="text-xl font-extrabold text-ink">{profile.wins}</div>
          <div className="text-[12px] text-ink-muted">برد</div>
        </Card>
        <Card className="flex flex-col items-center gap-1 px-3 py-5 text-center">
          <div className="text-xl font-extrabold text-ink">{profile.losses}</div>
          <div className="text-[12px] text-ink-muted">باخت</div>
        </Card>
        <Card className="flex flex-col items-center gap-1 px-3 py-5 text-center">
          <div className="text-xl font-extrabold text-ink">{profile.draws}</div>
          <div className="text-[12px] text-ink-muted">مساوی</div>
        </Card>
      </div>

      {(profile.psn_id || profile.xbox_id || profile.steam_id) && (
        <Card className="p-5">
          <h3 className="mb-2 text-base font-bold text-gold">شناسه‌های کنسول</h3>
          <div className="flex flex-col gap-1.5 text-sm text-ink-muted">
            {profile.psn_id && <p>PSN: {profile.psn_id}</p>}
            {profile.xbox_id && <p>XBOX: {profile.xbox_id}</p>}
            {profile.steam_id && <p>Steam: {profile.steam_id}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
