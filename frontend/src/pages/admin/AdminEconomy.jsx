import { useEffect, useState } from 'react';
import { adminEconomyApi } from '../../api/h2h.js';
import '../../styles/admin.css';
import '../../styles/h2h.css';

export default function AdminEconomy() {
  const [thresholds, setThresholds] = useState([]);
  const [archive, setArchive] = useState([]);
  const [walletForm, setWalletForm] = useState({ userId: '', currency: 'ticket', amount: 1, reason: 'admin_adjustment' });
  const [seasonName, setSeasonName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    Promise.allSettled([adminEconomyApi.gradeThresholds(), adminEconomyApi.seasonArchive()]).then(([g, a]) => {
      if (g.status === 'fulfilled') setThresholds(g.value.data.thresholds || []);
      if (a.status === 'fulfilled') setArchive(a.value.data.archive || []);
    });
  };

  useEffect(() => { load(); }, []);

  const setThreshold = (grade, key, value) => setThresholds((rows) => rows.map((r) => r.grade === grade ? { ...r, [key]: value } : r));

  const saveThreshold = async (row) => {
    setError(''); setMessage('');
    try {
      await adminEconomyApi.updateGradeThreshold(row.grade, {
        min_points: Number(row.min_points),
        max_points: row.max_points === '' || row.max_points === null ? null : Number(row.max_points),
      });
      setMessage(`گرید ${row.grade} ذخیره شد.`);
      load();
    } catch (err) { setError(err.response?.data?.error || 'ذخیره گرید ناموفق بود.'); }
  };

  const adjustWallet = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      await adminEconomyApi.adjustWallet(walletForm.userId, { currency: walletForm.currency, amount: Number(walletForm.amount), reason: walletForm.reason });
      setMessage('کیف پول کاربر با موفقیت تغییر کرد.');
      setWalletForm({ userId: '', currency: 'ticket', amount: 1, reason: 'admin_adjustment' });
    } catch (err) { setError(err.response?.data?.error || 'تغییر کیف پول ناموفق بود.'); }
  };

  const resetSeason = async (e) => {
    e.preventDefault(); setError(''); setMessage('');
    try {
      await adminEconomyApi.resetSeason({ season_name: seasonName });
      setMessage('فصل بایگانی شد و امتیازهای فصلی صفر شد.');
      setSeasonName('');
      load();
    } catch (err) { setError(err.response?.data?.error || 'بازنشانی فصل ناموفق بود.'); }
  };

  return (
    <div>
      <h1>اقتصاد بازی و گریدها</h1>
      <p className="h2h-muted">مدیریت تیکت، XP، گریدها و بایگانی فصل‌ها</p>
      {message && <div className="h2h-message success">{message}</div>}
      {error && <div className="h2h-message error">{error}</div>}

      <div className="h2h-grid">
        <div className="card">
          <h3>شارژ / کسر کیف پول کاربر</h3>
          <form className="h2h-form" onSubmit={adjustWallet}>
            <label>ID کاربر<input value={walletForm.userId} onChange={(e) => setWalletForm({ ...walletForm, userId: e.target.value })} /></label>
            <label>نوع<select value={walletForm.currency} onChange={(e) => setWalletForm({ ...walletForm, currency: e.target.value })}><option value="ticket">تیکت</option><option value="xp">XP</option></select></label>
            <label>مقدار<input type="number" value={walletForm.amount} onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })} /></label>
            <label>دلیل<input value={walletForm.reason} onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })} /></label>
            <button className="btn btn-primary">ثبت تغییر</button>
          </form>
        </div>

        <div className="card">
          <h3>بازنشانی فصل</h3>
          <form className="h2h-form" onSubmit={resetSeason}>
            <label>نام فصل برای آرشیو<input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} placeholder="مثلاً تابستان ۱۴۰۵" /></label>
            <button className="btn btn-outline">بایگانی و صفر کردن فصل</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>تنظیم گریدها</h3>
        <table className="h2h-table">
          <thead><tr><th>گرید</th><th>حداقل امتیاز</th><th>حداکثر امتیاز</th><th></th></tr></thead>
          <tbody>
            {thresholds.map((row) => (
              <tr key={row.grade}>
                <td>{row.grade}</td>
                <td><input type="number" value={row.min_points ?? ''} onChange={(e) => setThreshold(row.grade, 'min_points', e.target.value)} /></td>
                <td><input type="number" value={row.max_points ?? ''} onChange={(e) => setThreshold(row.grade, 'max_points', e.target.value)} /></td>
                <td><button className="btn btn-primary" onClick={() => saveThreshold(row)}>ذخیره</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>آرشیو فصل‌ها</h3>
        {archive.length === 0 ? <p>آرشیوی ثبت نشده است.</p> : (
          <table className="h2h-table"><thead><tr><th>فصل</th><th>کاربر</th><th>امتیاز</th><th>گرید</th><th>تاریخ</th></tr></thead><tbody>{archive.map((row) => <tr key={row.id}><td>{row.season_name}</td><td>{row.user_id}</td><td>{row.season_points}</td><td>{row.grade}</td><td>{row.archived_at}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
}
