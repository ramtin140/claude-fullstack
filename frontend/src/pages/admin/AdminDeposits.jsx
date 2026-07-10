import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { api, assetUrl } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

const statusLabel = { pending: 'در انتظار بررسی', approved: 'تایید شد', rejected: 'رد شد' };
const statusVariant = { pending: 'waiting', approved: 'live', rejected: 'finished' };
const typeLabel = { card_to_card: 'کارت به کارت', bank_account: 'واریز به حساب' };

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

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
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>{isReject ? 'رد درخواست شارژ' : 'تایید شارژ کیف پول'}</DialogTitle>
        <p className="-mt-2 mb-3.5 text-[13px] text-ink-muted">
          {request.user_name} — {request.cash_amount.toLocaleString('fa-IR')} تومان ({typeLabel[request.method_type]}) → {request.ticket_amount} تیکت
        </p>
        <a href={assetUrl(request.receipt_url)} target="_blank" rel="noreferrer" className="mb-3.5 inline-flex">
          <Badge variant="waiting" className="gap-1">
            <Paperclip size={12} /> مشاهده رسید واریز کاربر
          </Badge>
        </a>
        <form onSubmit={submit}>
          <div className="mb-3.5 flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-muted">{isReject ? 'دلیل رد (الزامی)' : 'توضیح مدیر (اختیاری)'}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
          </div>
          {error && <p className="mb-3.5 text-sm text-critical">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" variant={isReject ? 'magenta' : 'primary'} disabled={submitting}>
              {submitting ? 'در حال ثبت...' : isReject ? 'رد درخواست' : `تایید و شارژ ${request.ticket_amount} تیکت`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">درخواست‌های شارژ کیف پول</h1>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">درخواستی ثبت نشده است.</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر</TableHead>
                <TableHead>روش</TableHead>
                <TableHead>مبلغ (تومان)</TableHead>
                <TableHead>کارمزد</TableHead>
                <TableHead>تیکت</TableHead>
                <TableHead>رسید</TableHead>
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
                  <TableCell>
                    {typeLabel[r.method_type]} ({r.method_title})
                  </TableCell>
                  <TableCell>{r.cash_amount.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{r.fee_amount.toLocaleString('fa-IR')}</TableCell>
                  <TableCell>{r.ticket_amount}</TableCell>
                  <TableCell>
                    <a href={assetUrl(r.receipt_url)} target="_blank" rel="noreferrer" className="inline-flex">
                      <Badge variant="waiting" className="gap-1">
                        <Paperclip size={12} /> مشاهده
                      </Badge>
                    </a>
                  </TableCell>
                  <TableCell>{formatDateTime(r.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] text-[13px] text-ink-muted">{r.admin_notes}</TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setReview({ request: r, mode: 'approve' })}>
                          تایید
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
