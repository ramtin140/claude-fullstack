import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import '../../styles/admin.css';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusBadge = { pending: 'badge-waiting', approved: 'badge-live', rejected: 'badge-finished' };
const typeLabel = { card_to_card: 'کارت به کارت', bank_account: 'واریز به حساب' };

function ReviewModal({ request, mode, onClose, onDone }) {
  const [notes, setNotes] = useState('');
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
      await api.post(`/deposits/${request.id}/${isReject ? 'reject' : 'approve'}`, formData);
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
        <h2>{isReject ? 'رد درخواست شارژ' : 'تایید شارژ کیف پول'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: -8 }}>
          {request.user_name} — {request.cash_amount.toLocaleString('fa-IR')} تومان ({typeLabel[request.method_type]}) → {request.ticket_amount} تیکت
        </p>
        <a href={assetUrl(request.receipt_url)} target="_blank" rel="noreferrer" className="badge badge-waiting" style={{ display: 'inline-flex', gap: 4, marginBottom: 12 }}>
          <Paperclip size={12} /> مشاهده رسید واریز کاربر
        </a>
        <form onSubmit={submit}>
          <div className="form-field">
            <label>{isReject ? 'دلیل رد (الزامی)' : 'توضیح مدیر (اختیاری)'}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className={isReject ? 'btn btn-magenta' : 'btn btn-primary'} disabled={submitting}>
              {submitting ? 'در حال ثبت...' : isReject ? 'رد درخواست' : `تایید و شارژ ${request.ticket_amount} تیکت`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDeposits() {
  const [requests, setRequests] = useState([]);
  const [review, setReview] = useState(null);

  function load() {
    api.get('/deposits/admin/all').then(({ data }) => setRequests(data.requests));
  }

  useEffect(load, []);

  return (
    <div>
      <div className="admin-header">
        <h1>درخواست‌های شارژ کیف پول</h1>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">درخواستی ثبت نشده است.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>روش</th>
                <th>مبلغ (تومان)</th>
                <th>کارمزد</th>
                <th>تیکت</th>
                <th>رسید</th>
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
                  <td>{typeLabel[r.method_type]} ({r.method_title})</td>
                  <td>{r.cash_amount.toLocaleString('fa-IR')}</td>
                  <td>{r.fee_amount.toLocaleString('fa-IR')}</td>
                  <td>{r.ticket_amount}</td>
                  <td>
                    <a href={assetUrl(r.receipt_url)} target="_blank" rel="noreferrer" className="badge badge-waiting" style={{ gap: 4 }}>
                      <Paperclip size={12} /> مشاهده
                    </a>
                  </td>
                  <td>{formatDateTime(r.created_at)}</td>
                  <td>
                    <span className={`badge ${statusBadge[r.status]}`}>{statusLabel[r.status]}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 180 }}>{r.admin_notes}</td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="row-actions">
                        <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => setReview({ request: r, mode: 'approve' })}>
                          تایید
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
