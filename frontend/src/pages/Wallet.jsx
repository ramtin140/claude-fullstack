import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { walletApi } from '../api/h2h.js';
import '../styles/pages.css';
import '../styles/h2h.css';

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    walletApi.me()
      .then(({ data }) => {
        setWallet(data.wallet || {});
        setTransactions(data.transactions || []);
      })
      .catch((err) => setError(err.response?.data?.error || 'خطا در دریافت اطلاعات کیف پول'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>کیف پول و امتیازها</h1>
        <p>موجودی تیکت، XP، امتیاز فصلی، گرید و گردش تراکنش‌ها</p>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        {error && <div className="h2h-message error">{error}</div>}
        {loading ? (
          <div className="card">در حال بارگذاری...</div>
        ) : (
          <>
            <div className="dashboard-grid">
              <div className="card dashboard-stat"><div className="value">{wallet?.ticket_balance ?? 0}</div><div className="label">تیکت</div></div>
              <div className="card dashboard-stat"><div className="value">{wallet?.xp ?? 0}</div><div className="label">XP</div></div>
              <div className="card dashboard-stat"><div className="value">{wallet?.season_points ?? 0}</div><div className="label">امتیاز فصل</div></div>
              <div className="card dashboard-stat"><div className="value">{wallet?.grade || 'D'}</div><div className="label">گرید</div></div>
            </div>

            <div className="h2h-actions" style={{ margin: '18px 0' }}>
              <Link className="btn btn-primary" to="/h2h">بازی رو-در-رو</Link>
              <Link className="btn btn-outline" to="/dashboard">بازگشت به پیشخوان</Link>
            </div>

            <div className="card">
              <div className="h2h-section-title"><h3>گردش حساب</h3></div>
              {transactions.length === 0 ? (
                <p className="h2h-muted">هنوز تراکنشی ثبت نشده است.</p>
              ) : (
                <table className="h2h-table">
                  <thead>
                    <tr><th>نوع</th><th>مقدار</th><th>دلیل</th><th>تاریخ</th></tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.currency === 'ticket' ? 'تیکت' : 'XP'}</td>
                        <td>{tx.amount}</td>
                        <td>{tx.reason}</td>
                        <td>{tx.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
