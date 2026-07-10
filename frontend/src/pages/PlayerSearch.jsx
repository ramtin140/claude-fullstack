import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Swords, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

export default function PlayerSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messagingEnabled, setMessagingEnabled] = useState(true);

  useEffect(() => {
    api.get('/messages/settings').then(({ data }) => setMessagingEnabled(data.messaging_enabled));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.get('/users/directory', { params: { query } });
      setResults(data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در جستجو');
      setResults([]);
    }
  }

  async function sendChallenge(userId) {
    setError(null);
    setMessage(null);
    try {
      await api.post('/challenges', { to_user_id: userId });
      setMessage('چالش با موفقیت ارسال شد!');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ارسال چالش');
    }
  }

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">جستجوی کاربران و حریف‌ها</h1>
        <p className="text-ink-muted">بر اساس نام یا شناسه فیفاسول کاربران را پیدا کنید، پروفایل ببینید و در ارتباط باشید</p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 md:px-6">
        <form onSubmit={handleSearch} className="mb-6 flex max-w-[480px] gap-2.5">
          <Input
            placeholder="نام یا شناسه فیفاسول (FS-xxxx)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-md"
          />
          <Button type="submit" className="shrink-0 gap-1.5">
            <Search size={16} /> جستجو
          </Button>
        </form>

        {error && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-critical">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {message && (
          <p className="mb-4 flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={15} /> {message}
          </p>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {results.map((u) => (
              <Card key={u.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    {u.avatar_url ? <AvatarImage src={assetUrl(u.avatar_url)} alt="" /> : null}
                    <AvatarFallback>
                      <PlayerAvatarIcon seed={u.id} size={14} />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink">
                    {u.name}
                    {u.is_vip && <Badge variant="live">VIP</Badge>}
                  </h3>
                </div>
                <p className="font-mono text-[13px] text-ink-muted">
                  گرید {u.grade} — {u.fifa_soul_id}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/u/${u.id}`}>مشاهده پروفایل</Link>
                  </Button>
                  {messagingEnabled && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/messages/${u.id}`} className="gap-1.5">
                        <MessageCircle size={15} /> پیام
                      </Link>
                    </Button>
                  )}
                  {user?.is_vip && (
                    <Button variant="outline" size="sm" onClick={() => sendChallenge(u.id)} className="gap-1.5">
                      <Swords size={15} /> ارسال چالش
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
