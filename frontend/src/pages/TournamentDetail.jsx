import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { cn } from '../lib/utils.js';

const roundLabel = (round, totalRounds) => {
  if (totalRounds && round === totalRounds) return 'فینال';
  if (totalRounds && round === totalRounds - 1) return 'نیمه‌نهایی';
  return `دور ${round}`;
};

function BracketView({ matches, nameOf }) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const totalRounds = rounds.length ? Math.max(...rounds) : 0;

  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {rounds.map((round) => (
        <div key={round} className="w-[220px] shrink-0">
          <h4 className="mb-3 text-sm font-bold text-gold">{roundLabel(round, totalRounds)}</h4>
          <div className="flex flex-col gap-3.5">
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.bracket_slot - b.bracket_slot)
              .map((m) => (
                <Card key={m.id} className="p-3">
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className={cn(m.winner_id === m.home_user_id ? 'font-bold text-gold' : 'text-ink')}>{nameOf(m.home_user_id)}</span>
                    <span className="text-ink-muted">{m.home_score ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className={cn(m.winner_id === m.away_user_id ? 'font-bold text-gold' : 'text-ink')}>{nameOf(m.away_user_id)}</span>
                    <span className="text-ink-muted">{m.away_score ?? '-'}</span>
                  </div>
                  {m.is_bye && <div className="mt-1 text-[11px] text-ink-faint">استراحت (bye)</div>}
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ standings, nameOf }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-ink-muted">
            <th className="px-3 py-3 text-start font-semibold">#</th>
            <th className="px-3 py-3 text-start font-semibold">بازیکن</th>
            <th className="px-3 py-3 text-start font-semibold">بازی</th>
            <th className="px-3 py-3 text-start font-semibold">برد</th>
            <th className="px-3 py-3 text-start font-semibold">مساوی</th>
            <th className="px-3 py-3 text-start font-semibold">باخت</th>
            <th className="px-3 py-3 text-start font-semibold">گل زده</th>
            <th className="px-3 py-3 text-start font-semibold">گل خورده</th>
            <th className="px-3 py-3 text-start font-semibold">تفاضل</th>
            <th className="px-3 py-3 text-start font-semibold">امتیاز</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr key={row.user_id} className="border-b border-border text-ink last:border-b-0">
              <td className="px-3 py-3">{i + 1}</td>
              <td className="px-3 py-3">{nameOf(row.user_id)}</td>
              <td className="px-3 py-3 text-ink-muted">{row.played}</td>
              <td className="px-3 py-3 text-ink-muted">{row.won}</td>
              <td className="px-3 py-3 text-ink-muted">{row.drawn}</td>
              <td className="px-3 py-3 text-ink-muted">{row.lost}</td>
              <td className="px-3 py-3 text-ink-muted">{row.gf}</td>
              <td className="px-3 py-3 text-ink-muted">{row.ga}</td>
              <td className="px-3 py-3 text-ink-muted">{row.gd}</td>
              <td className="px-3 py-3 font-bold text-gold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [joinMsg, setJoinMsg] = useState(null);

  function load() {
    api.get(`/tournaments/${id}`).then(({ data }) => setData(data));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleJoin() {
    try {
      await api.post(`/tournaments/${id}/join`);
      setJoinMsg('با موفقیت در تورنمنت ثبت‌نام شدید!');
      load();
    } catch (err) {
      setJoinMsg(err.response?.data?.error || 'خطا در ثبت‌نام');
    }
  }

  if (!data) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  const { tournament, participants, matches, standings } = data;
  const nameMap = new Map(participants.map((p) => [p.id, p.name]));
  const nameOf = (userId) => (userId ? nameMap.get(userId) || `کاربر #${userId}` : '؟');
  const bracketMatches = matches.filter((m) => m.round != null);

  return (
    <div>
      <div className="bg-[linear-gradient(135deg,var(--color-brand-900),var(--color-bg-soft))] px-4 py-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">{tournament.title}</h1>
        <p className="text-ink-muted">{tournament.description}</p>
        {user && !tournament.bracket_generated && (
          <Button className="mt-4" onClick={handleJoin}>
            ثبت‌نام در این تورنمنت
          </Button>
        )}
        {tournament.bracket_generated && (
          <Badge variant="live" className="mt-4 inline-flex">
            مسابقات شروع شده — ثبت‌نام بسته است
          </Badge>
        )}
        {joinMsg && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={15} />
            {joinMsg}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        {tournament.bracket_generated && tournament.type === 'league' && standings && (
          <Card className="mb-7 overflow-x-auto p-5">
            <h3 className="mb-3 text-base font-bold text-gold">جدول امتیازات</h3>
            <StandingsTable standings={standings} nameOf={nameOf} />
          </Card>
        )}

        {tournament.bracket_generated && ['cup', 'playoff'].includes(tournament.type) && (
          <Card className="mb-7 p-5">
            <h3 className="mb-3 text-base font-bold text-gold">برکت مسابقات</h3>
            <BracketView matches={bracketMatches} nameOf={nameOf} />
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
          <Card className="p-5">
            <h3 className="mb-2 text-base font-bold text-gold">مسابقات این تورنمنت</h3>
            {matches.filter((m) => m.round == null).length === 0 && (
              <div className="py-6 text-center text-sm text-ink-faint">هنوز مسابقه‌ای ثبت نشده است.</div>
            )}
            {matches
              .filter((m) => m.round == null)
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-b-0">
                  <div className="flex items-center gap-2 text-ink">
                    <span>{m.home_name}</span>
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-magenta text-[11px] text-white">VS</span>
                    <span>{m.away_name || '؟'}</span>
                  </div>
                  <span className="text-ink-muted">
                    {m.home_score != null ? `${m.home_score} - ${m.away_score}` : m.status === 'in_progress' ? 'زنده' : 'در انتظار'}
                  </span>
                </div>
              ))}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-base font-bold text-gold">شرکت‌کنندگان ({participants.length})</h3>
            <div className="flex flex-col gap-2.5">
              {participants.length === 0 && <div className="py-6 text-center text-sm text-ink-faint">هنوز کسی ثبت‌نام نکرده است.</div>}
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-sm">
                  <span className="text-ink">{p.name}</span>
                  <span className="text-gold">{p.points} امتیاز</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
