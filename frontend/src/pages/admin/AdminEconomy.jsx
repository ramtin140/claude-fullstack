import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';

const fieldClass =
  'rounded-md border border-border bg-bg px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus-visible:border-gold';

export default function AdminEconomy() {
  const [thresholds, setThresholds] = useState([]);
  const [vipThreshold, setVipThreshold] = useState(500);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [archive, setArchive] = useState([]);
  const [walletForm, setWalletForm] = useState({ currency: 'ticket', amount: 1, reason: 'admin_adjustment' });
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [seasonName, setSeasonName] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/admin/grade-thresholds').then(({ data }) => setThresholds(data.thresholds));
    api.get('/admin/vip-threshold').then(({ data }) => setVipThreshold(data.threshold));
    api.get('/admin/messaging-enabled').then(({ data }) => setMessagingEnabled(data.messaging_enabled));
    api.get('/admin/season/archive').then(({ data }) => setArchive(data.archive));
  }

  useEffect(load, []);

  async function saveThreshold(row) {
    setError(null);
    setMessage(null);
    try {
      await api.put(`/admin/grade-thresholds/${row.grade}`, {
        min_points: Number(row.min_points),
        max_points: row.max_points === null || row.max_points === '' ? null : Number(row.max_points),
      });
      setMessage(`گرید ${row.grade} ذخیره شد.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره گرید');
    }
  }

  async function saveVipThreshold() {
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/vip-threshold', { threshold: Number(vipThreshold) });
      setMessage('آستانه اکسپرینس وی‌آی‌پی ذخیره شد.');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره‌سازی');
    }
  }

  async function toggleMessaging() {
    setError(null);
    setMessage(null);
    try {
      const { data } = await api.put('/admin/messaging-enabled', { messaging_enabled: !messagingEnabled });
      setMessagingEnabled(data.messaging_enabled);
      setMessage(data.messaging_enabled ? 'پیام‌رسانی بین کاربران فعال شد.' : 'پیام‌رسانی بین کاربران غیرفعال شد.');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در تغییر وضعیت پیام‌رسانی');
    }
  }

  async function searchUsers(e) {
    e.preventDefault();
    if (!userQuery.trim()) return;
    try {
      const { data } = await api.get('/users', { params: { query: userQuery } });
      setUserResults(data.users);
    } catch {
      setUserResults([]);
    }
  }

  async function adjustWallet(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!selectedUser) {
      setError('لطفاً ابتدا کاربر را از نتایج جستجو انتخاب کنید.');
      return;
    }
    try {
      const { data } = await api.post(`/admin/wallet/${selectedUser.id}/adjust`, {
        currency: walletForm.currency,
        amount: Number(walletForm.amount),
        reason: walletForm.reason,
      });
      setMessage(`موجودی جدید ${selectedUser.name}: ${data.balance}`);
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در تنظیم کیف پول');
    }
  }

  async function resetSeason(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!confirm('آیا از بازنشانی فصل مطمئن هستید؟ امتیاز فصلی همه کاربران صفر می‌شود.')) return;
    try {
      const { data } = await api.post('/admin/season/reset', { season_name: seasonName });
      setMessage(`${data.archived_users} کاربر بایگانی و فصل جدید شروع شد.`);
      setSeasonName('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در بازنشانی فصل');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت اقتصاد و گریدبندی</h1>
      </div>

      {message && <p className="mb-4 text-sm text-success">{message}</p>}
      {error && <p className="mb-4 text-sm text-critical">{error}</p>}

      <Card className="mb-6 p-5">
        <h3 className="mb-3 mt-0 text-[15px] font-bold text-gold">آستانه اکسپرینس برای عضویت VIP</h3>
        <div className="flex gap-2.5">
          <Input type="number" min={0} value={vipThreshold} onChange={(e) => setVipThreshold(e.target.value)} className="w-[140px] rounded-md" />
          <Button onClick={saveVipThreshold}>ذخیره</Button>
        </div>
      </Card>

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-2.5 p-5">
        <div>
          <h3 className="mb-1 mt-0 text-[15px] font-bold text-gold">پیام‌رسانی بین کاربران</h3>
          <p className="m-0 text-[13px] text-ink-muted">در صورت غیرفعال بودن، کاربران نمی‌توانند از طریق جستجوی کاربران به هم پیام بدهند.</p>
        </div>
        <Button variant={messagingEnabled ? 'magenta' : 'primary'} onClick={toggleMessaging}>
          {messagingEnabled ? 'غیرفعال کردن' : 'فعال کردن'}
        </Button>
      </Card>

      <Card className="mb-6 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>گرید</TableHead>
              <TableHead>حداقل امتیاز</TableHead>
              <TableHead>حداکثر امتیاز</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thresholds.map((row) => (
              <TableRow key={row.grade}>
                <TableCell>{row.grade}</TableCell>
                <TableCell>
                  <input type="number" defaultValue={row.min_points} onChange={(e) => (row.min_points = e.target.value)} className={`w-[90px] ${fieldClass}`} />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    defaultValue={row.max_points ?? ''}
                    placeholder="نامحدود"
                    onChange={(e) => (row.max_points = e.target.value)}
                    className={`w-[90px] ${fieldClass}`}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => saveThreshold(row)}>
                    ذخیره
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 mt-0 text-[15px] font-bold text-gold">شارژ دستی کیف پول</h3>

        {selectedUser ? (
          <div className="mb-3.5 flex items-center gap-2.5 rounded-md bg-bg px-3.5 py-2.5">
            <span className="text-sm">
              کاربر انتخاب‌شده: <strong>{selectedUser.name}</strong>{' '}
              <span className="font-mono text-xs text-ink-muted" dir="ltr">
                {selectedUser.fifa_soul_id}
              </span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="me-auto h-8 w-8"
              onClick={() => {
                setSelectedUser(null);
                setUserResults([]);
                setUserQuery('');
              }}
            >
              <X size={15} />
            </Button>
          </div>
        ) : (
          <div className="mb-3.5">
            <form onSubmit={searchUsers} className="flex max-w-[420px] gap-2.5">
              <Input
                placeholder="جستجو بر اساس نام، ایمیل یا fifa soul ID..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="flex-1 rounded-md"
              />
              <Button variant="outline" type="submit">
                <Search size={16} />
              </Button>
            </form>
            {userResults.length > 0 && (
              <div className="mt-2.5 flex max-w-[420px] flex-col gap-1.5">
                {userResults.map((u) => (
                  <Button
                    key={u.id}
                    type="button"
                    variant="outline"
                    className="justify-start rounded-md text-start"
                    onClick={() => {
                      setSelectedUser(u);
                      setUserResults([]);
                    }}
                  >
                    {u.name} — <span className="font-mono text-[12px]" dir="ltr">{u.fifa_soul_id}</span> ({u.email})
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={adjustWallet} className="flex flex-wrap items-end gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-muted">ارز</label>
            <select value={walletForm.currency} onChange={(e) => setWalletForm({ ...walletForm, currency: e.target.value })} className={fieldClass}>
              <option value="ticket">تیکت</option>
              <option value="xp">XP</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-muted">مقدار (منفی = کسر)</label>
            <Input type="number" required value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} className="rounded-md" />
          </div>
          <Button type="submit">اعمال</Button>
        </form>
      </Card>

      <Card className="mb-6 p-5">
        <h3 className="mb-3 mt-0 text-[15px] font-bold text-gold">بازنشانی فصل (بایگانی + صفر کردن امتیاز فصلی)</h3>
        <form onSubmit={resetSeason} className="flex gap-2.5">
          <Input required placeholder="نام فصل، مثلاً 1405-Q3" value={seasonName} onChange={(e) => setSeasonName(e.target.value)} className="flex-1 rounded-md" />
          <Button variant="magenta" type="submit">
            بازنشانی فصل
          </Button>
        </form>
      </Card>

      {archive.length > 0 && (
        <Card className="overflow-hidden p-0">
          <h3 className="p-[18px] pb-0 text-[15px] font-bold text-gold">بایگانی فصل‌های قبلی</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>فصل</TableHead>
                <TableHead>امتیاز</TableHead>
                <TableHead>گرید</TableHead>
                <TableHead>برد/باخت/مساوی</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archive.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>#{row.user_id}</TableCell>
                  <TableCell>{row.season_name}</TableCell>
                  <TableCell>{row.season_points}</TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell>
                    {row.wins}/{row.losses}/{row.draws}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
