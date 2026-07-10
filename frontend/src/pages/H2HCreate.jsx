import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

function FormField({ label, children, hint }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label className="text-[13px] text-ink-muted">{label}</label>
      {children}
      {hint && <p className="text-[12px] text-ink-faint">{hint}</p>}
    </div>
  );
}

export default function H2HCreate() {
  const navigate = useNavigate();
  const [consoles, setConsoles] = useState([]);
  const [gameVersions, setGameVersions] = useState([]);
  const [form, setForm] = useState({
    stake_type: 'ticket',
    stake_amount: 1,
    console: '',
    game_version: '',
    is_private: false,
    password: '',
    time_limit_hours: 24,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/game-options', { params: { category: 'console' } }).then(({ data }) => setConsoles(data.options));
    api.get('/game-options', { params: { category: 'game_version' } }).then(({ data }) => setGameVersions(data.options));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/h2h', form);
      navigate(`/h2h/${data.match.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ساخت مسابقه');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-[480px] p-8">
        <h1 className="mb-1.5 text-center text-xl font-bold text-gold">ساخت مسابقه رو-در-رو</h1>
        <p className="mb-7 text-center text-sm text-ink-muted">حریف جوین شود، مسابقه قفل و شروع می‌شود</p>

        <form onSubmit={handleSubmit}>
          <FormField label="نوع ورودی">
            <select value={form.stake_type} onChange={(e) => setForm({ ...form, stake_type: e.target.value })} className={fieldClass}>
              <option value="ticket">تیکتی (۱ تا ۵ تیکت)</option>
              <option value="xp">رایگان (بر اساس اکسپرینس)</option>
            </select>
          </FormField>
          {form.stake_type === 'ticket' && (
            <FormField label="تعداد تیکت">
              <Input
                type="number"
                min={1}
                max={5}
                value={form.stake_amount}
                onChange={(e) => setForm({ ...form, stake_amount: Number(e.target.value) })}
                className="rounded-md"
              />
            </FormField>
          )}
          <FormField label="کنسول">
            <select value={form.console} onChange={(e) => setForm({ ...form, console: e.target.value })} className={fieldClass}>
              <option value="">انتخاب کنید</option>
              {consoles.map((c) => (
                <option key={c.id} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="ورژن بازی">
            <select value={form.game_version} onChange={(e) => setForm({ ...form, game_version: e.target.value })} className={fieldClass}>
              <option value="">انتخاب کنید</option>
              {gameVersions.map((g) => (
                <option key={g.id} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_private"
              checked={form.is_private}
              onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              className="h-4 w-4 accent-gold"
            />
            <label htmlFor="is_private" className="text-sm text-ink">
              مسابقه خصوصی (با رمز عبور)
            </label>
          </div>
          {form.is_private && (
            <FormField label="رمز عبور مسابقه">
              <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-md" />
            </FormField>
          )}
          <FormField
            label="فرجه زمانی برای ثبت نتیجه هر نیم‌فصل (ساعت)"
            hint="اگر تا پایان این مدت نتیجه ثبت نشود، طرف مقابل می‌تواند برد ۳-۰ را درخواست کند."
          >
            <Input
              type="number"
              min={1}
              value={form.time_limit_hours}
              onChange={(e) => setForm({ ...form, time_limit_hours: e.target.value })}
              className="rounded-md"
            />
          </FormField>
          {error && (
            <p className="mb-4 flex items-center gap-1.5 text-sm text-critical">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'در حال ساخت...' : 'ساخت مسابقه'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
