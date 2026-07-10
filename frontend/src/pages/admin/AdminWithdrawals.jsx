import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

const statusLabel = { pending: 'در انتظار بررسی', paid: 'پرداخت شد', rejected: 'رد شد' };
const statusVariant = { pending: 'waiting', paid: 'live', rejected: 'finished' };

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

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
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>{isReject ? 'رد درخواست برداشت' : 'تایید و پرداخت درخواست'}</DialogTitle>
        <p className="-mt-2 mb-3.5 text-[13px] text-ink-muted">
          {request.user_name} — {request.ticket_amount} تیکت ({request.cash_amount.toLocaleString('fa-IR')} تومان)
        </p>
        <form onSubmit={submit}>
          <div className="mb-3.5 flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-muted">{isReject ? 'دلیل رد (الزامی)' : 'توضیح مدیر (اختیاری)'}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
          </div>
          {!isReject && (
            <div className="mb-3.5 flex flex-col gap-1.5">
              <label className="text-[13px] text-ink-muted">فیش/رسید پرداخت (اختیاری)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} className="text-sm text-ink" />
            </div>
          )}
          {error && <p className="mb-3.5 text-sm text-critical">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" variant={isReject ? 'magenta' : 'primary'} disabled={submitting}>
              {submitting ? 'در حال ثبت...' : isReject ? 'رد درخواست' : 'تایید و پرداخت'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [rate, setRate] = useState(10000);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [review, setReview] = useState(null);

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">درخواست‌های برداشت تیکت</h1>
      </div>

      <Card className="mb-6 flex flex-wrap items-center gap-2.5 p-5">
        <span className="text-ink-muted">نرخ تبدیل (تومان به ازای هر تیکت):</span>
        <Input type="number" min={1} value={rate} onChange={(e) => setRate(e.target.value)} className="w-[140px] rounded-md" />
        <Button onClick={saveRate}>ذخیره</Button>
      </Card>
      {message && <p className="mb-4 text-sm text-success">{message}</p>}
      {error && <p className="mb-4 text-sm text-critical">{error}</p>}

      {requests.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">درخواستی ثبت نشده است.</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>تیکت</TableHead>
                <TableHead>مبلغ (تومان)</TableHead>
                <TableHead>شماره شبا</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>یادداشت مدیر</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.user_name}</TableCell>
                  <TableCell>{r.ticket_amount}</TableCell>
                  <TableCell>{r.cash_amount.toLocaleString('fa-IR')}</TableCell>
                  <TableCell className="font-mono text-xs" dir="ltr">
                    {r.iban}
                  </TableCell>
                  <TableCell>{formatDateTime(r.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    {r.admin_notes && <div className="text-[13px] text-ink-muted">{r.admin_notes}</div>}
                    {r.receipt_url && (
                      <a href={assetUrl(r.receipt_url)} target="_blank" rel="noreferrer" className="mt-1 inline-flex">
                        <Badge variant="waiting" className="gap-1">
                          <Paperclip size={12} /> مشاهده فیش
                        </Badge>
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setReview({ request: r, mode: 'approve' })}>
                          پرداخت شد
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setReview({ request: r, mode: 'reject' })}>
                          رد
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
