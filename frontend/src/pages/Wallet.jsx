import { useEffect, useState } from 'react';
import { Coins, Zap } from 'lucide-react';
import { api } from '../api/client.js';
import '../styles/pages.css';

const reasonLabel = {
  match_stake: 'شرط‌بندی مسابقه',
  match_refund: 'بازگشت شرط (تساوی)',
  match_reward: 'جایزه برد',
  admin_adjustment: 'تنظیم توسط ادمین',
};

export default function Wallet() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/wallet/me').then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  const { wallet, transactions } = data;

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>کیف پول من</h1>
        <p>موجودی تیکت، اکسپرینس و تاریخچه تراکنش‌ها</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="dashboard-grid">
          <div className="card dashboard-stat">
            <Coins color="var(--gold)" />
            <div className="value">{wallet.ticket_balance}</div>
            <div className="label">موجودی تیکت</div>
          </div>
          <div className="card dashboard-stat">
            <Zap color="var(--gold)" />
            <div className="value">{wallet.xp}</div>
            <div className="label">اکسپرینس (XP)</div>
          </div>
          <div className="card dashboard-stat">
            <div className="value" style={{ color: 'var(--gold)' }}>{wallet.grade}</div>
            <div className="label">گرید فصلی ({wallet.season_points} امتیاز)</div>
          </div>
        </div>

        <h3 style={{ color: 'var(--gold)' }}>تراکنش‌های اخیر</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">هنوز تراکنشی ثبت نشده است.</div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ارز</th>
                  <th>مقدار</th>
                  <th>دلیل</th>
                  <th>موجودی پس از تراکنش</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.currency === 'ticket' ? 'تیکت' : 'XP'}</td>
                    <td style={{ color: t.amount >= 0 ? '#4ade80' : '#ff6b81' }}>
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                    </td>
                    <td>{reasonLabel[t.reason] || t.reason}</td>
                    <td>{t.balance_after}</td>
                    <td>{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
