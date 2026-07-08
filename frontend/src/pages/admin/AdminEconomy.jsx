import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

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
      <div className="admin-header">
        <h1>مدیریت اقتصاد و گریدبندی</h1>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>آستانه اکسپرینس برای عضویت VIP</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="number"
            min={0}
            value={vipThreshold}
            onChange={(e) => setVipThreshold(e.target.value)}
            style={{ width: 140, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
          />
          <button className="btn btn-primary" onClick={saveVipThreshold}>
            ذخیره
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 4, color: 'var(--gold)' }}>پیام‌رسانی بین کاربران</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            در صورت غیرفعال بودن، کاربران نمی‌توانند از طریق جستجوی کاربران به هم پیام بدهند.
          </p>
        </div>
        <button className={`btn ${messagingEnabled ? 'btn-magenta' : 'btn-primary'}`} onClick={toggleMessaging}>
          {messagingEnabled ? 'غیرفعال کردن' : 'فعال کردن'}
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>گرید</th>
              <th>حداقل امتیاز</th>
              <th>حداکثر امتیاز</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map((row) => (
              <tr key={row.grade}>
                <td>{row.grade}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={row.min_points}
                    onChange={(e) => (row.min_points = e.target.value)}
                    style={{ width: 90, padding: 6, borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={row.max_points ?? ''}
                    placeholder="نامحدود"
                    onChange={(e) => (row.max_points = e.target.value)}
                    style={{ width: 90, padding: 6, borderRadius: 6, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
                  />
                </td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '6px 14px' }} onClick={() => saveThreshold(row)}>
                    ذخیره
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>شارژ دستی کیف پول</h3>

        {selectedUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-darker)' }}>
            <span>
              کاربر انتخاب‌شده: <strong>{selectedUser.name}</strong>{' '}
              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{selectedUser.fifa_soul_id}</span>
            </span>
            <button
              type="button"
              className="icon-btn"
              style={{ marginRight: 'auto' }}
              onClick={() => {
                setSelectedUser(null);
                setUserResults([]);
                setUserQuery('');
              }}
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <form onSubmit={searchUsers} style={{ display: 'flex', gap: 10, maxWidth: 420 }}>
              <input
                placeholder="جستجو بر اساس نام، ایمیل یا fifa soul ID..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
              />
              <button className="btn btn-outline" type="submit">
                <Search size={16} />
              </button>
            </form>
            {userResults.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', textAlign: 'right' }}
                    onClick={() => {
                      setSelectedUser(u);
                      setUserResults([]);
                    }}
                  >
                    {u.name} — <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{u.fifa_soul_id}</span> ({u.email})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={adjustWallet} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>ارز</label>
            <select value={walletForm.currency} onChange={(e) => setWalletForm({ ...walletForm, currency: e.target.value })}>
              <option value="ticket">تیکت</option>
              <option value="xp">XP</option>
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>مقدار (منفی = کسر)</label>
            <input type="number" required value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">
            اعمال
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>بازنشانی فصل (بایگانی + صفر کردن امتیاز فصلی)</h3>
        <form onSubmit={resetSeason} style={{ display: 'flex', gap: 10 }}>
          <input
            required
            placeholder="نام فصل، مثلاً 1405-Q3"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
          />
          <button className="btn btn-magenta" type="submit">
            بازنشانی فصل
          </button>
        </form>
      </div>

      {archive.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ padding: '18px 18px 0', color: 'var(--gold)' }}>بایگانی فصل‌های قبلی</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>فصل</th>
                <th>امتیاز</th>
                <th>گرید</th>
                <th>برد/باخت/مساوی</th>
              </tr>
            </thead>
            <tbody>
              {archive.map((row) => (
                <tr key={row.id}>
                  <td>#{row.user_id}</td>
                  <td>{row.season_name}</td>
                  <td>{row.season_points}</td>
                  <td>{row.grade}</td>
                  <td>{row.wins}/{row.losses}/{row.draws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
