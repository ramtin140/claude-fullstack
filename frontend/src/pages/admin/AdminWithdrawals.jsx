import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

const statusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const statusBadge = { pending: 'badge-waiting', paid: 'badge-live', rejected: 'badge-finished' };

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [rate, setRate] = useState(10000);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  function load() {
    api.get('/withdrawals/admin/all').then(({ data }) => setRequests(data.requests));
    api.get('/withdrawals/rate').then(({ data }) => setRate(data.rate));
  }

  useEffect(load, []);

  async function saveRate() {
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/ticket-to-toman-rate', { rate: Number(rate) });
      setMessage('نرخ تبدیل ذخیره شد.');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره نرخ');
    }
  }

  async function approve(id) {
    await api.post(`/withdrawals/${id}/approve`);
    load();
  }

  async function reject(id) {
    const notes = prompt('دلیل رد درخواست (اختیاری):') || '';
    await api.post(`/withdrawals/${id}/reject`, { admin_notes: notes });
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>درخواست‌های برداشت تیکت</h1>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-muted)' }}>نرخ تبدیل (تومان به ازای هر تیکت):</span>
        <input
          type="number"
          min={1}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          style={{ width: 140, padding: 10, borderRadius: 8, border: '1px solid var(--border-soft)', background: 'var(--bg-darker)', color: 'var(--text-light)' }}
        />
        <button className="btn btn-primary" onClick={saveRate}>
          ذخیره
        </button>
      </div>
      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {requests.length === 0 ? (
        <div className="empty-state">درخواستی ثبت نشده است.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>تیکت</th>
                <th>مبلغ (تومان)</th>
                <th>شماره شبا</th>
                <th>تاریخ</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name}</td>
                  <td>{r.ticket_amount}</td>
                  <td>{r.cash_amount.toLocaleString('fa-IR')}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', direction: 'ltr' }}>{r.iban}</td>
                  <td>{formatDateTime(r.created_at)}</td>
                  <td>
                    <span className={`badge ${statusBadge[r.status]}`}>{statusLabel[r.status]}</span>
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="row-actions">
                        <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => approve(r.id)}>
                          پرداخت شد
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => reject(r.id)}>
                          رد
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
