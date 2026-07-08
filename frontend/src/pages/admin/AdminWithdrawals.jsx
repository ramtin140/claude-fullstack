import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

const statusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const statusBadge = { pending: 'badge-waiting', paid: 'badge-live', rejected: 'badge-finished' };

function ReviewModal({ request, mode, onClose, onDone }) {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isReject = mode === 'reject';

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (isReject && !notes.trim()) {
      setError('نوشتن دلیل رد الزامی است.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('admin_notes', notes.trim());
      if (file) formData.append('receipt_file', file);
      await api.post(`/withdrawals/${request.id}/${isReject ? 'reject' : 'approve'}`, formData);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ثبت تصمیم.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{isReject ? 'رد درخواست برداشت' : 'تایید و پرداخت درخواست'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: -8 }}>
          {request.user_name} — {request.ticket_amount} تیکت ({request.cash_amount.toLocaleString('fa-IR')} تومان)
        </p>
        <form onSubmit={submit}>
          <div className="form-field">
            <label>{isReject ? 'دلیل رد (الزامی)' : 'توضیح مدیر (اختیاری)'}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {!isReject && (
            <div className="form-field">
              <label>فیش/رسید پرداخت (اختیاری)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className={isReject ? 'btn btn-magenta' : 'btn btn-primary'} disabled={submitting}>
              {submitting ? 'در حال ثبت...' : isReject ? 'رد درخواست' : 'تایید و پرداخت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [rate, setRate] = useState(10000);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [review, setReview] = useState(null); // { request, mode }

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
                <th>یادداشت مدیر</th>
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
                  <td style={{ maxWidth: 220 }}>
                    {r.admin_notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.admin_notes}</div>}
                    {r.receipt_url && (
                      <a href={assetUrl(r.receipt_url)} target="_blank" rel="noreferrer" className="badge badge-waiting" style={{ marginTop: 4, gap: 4 }}>
                        <Paperclip size={12} /> مشاهده فیش
                      </a>
                    )}
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="row-actions">
                        <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => setReview({ request: r, mode: 'approve' })}>
                          پرداخت شد
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setReview({ request: r, mode: 'reject' })}>
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

      {review && (
        <ReviewModal
          request={review.request}
          mode={review.mode}
          onClose={() => setReview(null)}
          onDone={() => {
            setReview(null);
            load();
          }}
        />
      )}
    </div>
  );
}
