import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, XCircle, Star, Coins, Search, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

const statItems = (user) => [
  { icon: Star, value: user.points, label: 'امتیاز' },
  { icon: Trophy, value: user.wins, label: 'برد' },
  { icon: XCircle, value: user.losses, label: 'باخت' },
  { icon: Target, value: user.wins + user.losses, label: 'مجموع مسابقات' },
  { icon: null, value: user.grade, label: `گرید فصلی (${user.season_points} امتیاز)` },
  { icon: Coins, value: user.ticket_balance, label: 'موجودی تیکت' },
];

function StatCard({ icon: Icon, value, label }) {
  return (
    <Card className="flex flex-col items-center gap-2 px-4 py-6 text-center">
      {Icon && <Icon size={20} className="mb-1 text-gold" />}
      <div className="text-2xl font-extrabold tabular-nums text-gold">{value}</div>
      <div className="text-[13px] text-ink-muted">{label}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [incoming, setIncoming] = useState([]);

  function loadChallenges() {
    api.get('/challenges/incoming').then(({ data }) => setIncoming(data.challenges));
  }

  useEffect(() => {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments));
    loadChallenges();
  }, []);

  async function respond(id, action) {
    const { data } = await api.post(`/challenges/${id}/${action}`);
    loadChallenges();
    if (action === 'accept' && data.h2h_match_id) {
      window.location.href = `/h2h/${data.h2h_match_id}`;
    }
    refreshUser();
  }

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">سلام {user.name} 👋</h1>
        <p className="text-ink-muted">خلاصه فعالیت‌ها و آمار حساب کاربری شما</p>
        <p className="mt-1 flex items-center justify-center gap-2 font-mono text-[13px] text-ink-muted">
          fifa soul ID: {user.fifa_soul_id} {user.is_guest ? '· کاربر مهمان' : ''}
          {user.is_vip && <Badge variant="live">VIP</Badge>}
        </p>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6">
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {statItems(user).map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/h2h/new">ساخت مسابقه رو-در-رو</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/wallet">کیف پول من</Link>
          </Button>
          {user.is_vip && (
            <Button asChild variant="outline">
              <Link to="/players" className="gap-1.5">
                <Search size={15} /> جستجوی حریف
              </Link>
            </Button>
          )}
        </div>

        {incoming.length > 0 && (
          <>
            <h3 className="mb-4 text-lg font-bold text-gold">چالش‌های دریافتی</h3>
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {incoming.map((c) => (
                <Card key={c.id} className="flex flex-col gap-3 p-5">
                  <h3 className="text-sm font-bold text-ink">{c.from_user_name} شما را به مسابقه دعوت کرده</h3>
                  <div className="flex gap-2.5">
                    <Button className="flex-1 gap-1.5" onClick={() => respond(c.id, 'accept')}>
                      <Check size={15} /> پذیرش
                    </Button>
                    <Button variant="outline" className="flex-1 gap-1.5" onClick={() => respond(c.id, 'decline')}>
                      <X size={15} /> رد کردن
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <h3 className="mb-4 text-lg font-bold text-gold">تورنمنت‌های موجود برای ثبت‌نام</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tournaments.map((t) => (
            <Card key={t.id} className="flex flex-col gap-2.5 p-5">
              <h3 className="text-sm font-bold text-ink">{t.title}</h3>
              <p className="flex-1 text-sm leading-7 text-ink-muted">{t.description}</p>
              <Button asChild variant="outline" className="w-fit">
                <Link to={`/tournaments/${t.id}`}>مشاهده و ثبت‌نام</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
