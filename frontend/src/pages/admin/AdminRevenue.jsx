import { useEffect, useState } from 'react';
import { Coins, TrendingUp, Swords } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [feePercent, setFeePercent] = useState(30);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/admin/revenue').then(({ data }) => {
      setData(data);
      setFeePercent(data.fee_percent);
    });
  }

  useEffect(load, []);

  async function saveFeePercent() {
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/h2h-fee-percent', { fee_percent: Number(feePercent) });
      setMessage('درصد کارمزد ذخیره شد.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره کارمزد');
    }
  }

  if (!data) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  return (
    <div>
      <div className="admin-header">
        <h1>درآمد و بازی‌ها</h1>
      </div>

      <div className="admin-kpis">
        <div className="card admin-kpi">
          <Coins color="var(--gold)" />
          <div className="value">{data.total_revenue.toLocaleString('fa-IR')}</div>
          <div className="label">مجموع کارمزد (تیکت)</div>
        </div>
        <div className="card admin-kpi">
          <TrendingUp color="var(--gold)" />
          <div className="value">{data.total_pot.toLocaleString('fa-IR')}</div>
          <div className="label">مجموع مبلغ در گردش (تیکت)</div>
        </div>
        <div className="card admin-kpi">
          <Swords color="var(--gold)" />
          <div className="value">{data.decided_matches.toLocaleString('fa-IR')}</div>
          <div className="label">مسابقات دارای برنده</div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          کارمزد سایت از هر مسابقه (٪ از مجموع مبلغ دو طرف، معادل نیمی از این عدد از هر بازیکن):
        </span>
        <input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
          style={{ width: 100, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
        />
        <button className="btn btn-primary" onClick={saveFeePercent}>
          ذخیره
        </button>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {data.matches.length === 0 ? (
        <div className="empty-state">هنوز مسابقه‌ای با برنده ثبت نشده است.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>بازیکنان</th>
                <th>برنده</th>
                <th>استیک هر نفر</th>
                <th>کارمزد سایت</th>
                <th>تاریخ پایان</th>
              </tr>
            </thead>
            <tbody>
              {data.matches.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.creator_name} vs {m.opponent_name || '؟'}
                  </td>
                  <td style={{ color: 'var(--gold)' }}>{m.winner_name}</td>
                  <td>{m.stake_amount}</td>
                  <td>
                    {m.platform_fee_amount === null ? (
                      <span className="badge badge-finished">بدون کارمزد (قدیمی)</span>
                    ) : (
                      `${m.platform_fee_amount} تیکت`
                    )}
                  </td>
                  <td>{formatDateTime(m.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
