import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

const typeLabel = { card_to_card: 'کارت به کارت', bank_account: 'واریز به حساب' };

const emptyForm = {
  type: 'card_to_card',
  title: '',
  card_number: '',
  card_holder_name: '',
  iban: '',
  account_holder_name: '',
  bank_name: '',
  instructions: '',
  fee_percent: 0,
  fee_fixed: 0,
  min_amount: 0,
  max_amount: '',
  is_active: true,
  sort_order: 0,
};

const fieldClass =
  'w-full rounded-md border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus-visible:border-gold';

function FormField({ label, children }) {
  return (
    <div className="mb-3.5 flex flex-col gap-1.5">
      <label className="text-[13px] text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

function MethodModal({ method, onClose, onDone }) {
  const [form, setForm] = useState(method ? { ...emptyForm, ...method, max_amount: method.max_amount ?? '' } : emptyForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...form, max_amount: form.max_amount === '' ? null : Number(form.max_amount) };
      if (method) await api.put(`/payment-methods/${method.id}`, payload);
      else await api.post('/payment-methods', payload);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره روش پرداخت');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>{method ? 'ویرایش روش پرداخت' : 'روش پرداخت جدید'}</DialogTitle>
        <form onSubmit={submit}>
          <FormField label="نوع">
            <select value={form.type} onChange={(e) => set('type', e.target.value)} disabled={!!method} className={fieldClass}>
              <option value="card_to_card">کارت به کارت</option>
              <option value="bank_account">واریز به حساب</option>
            </select>
          </FormField>
          <FormField label="عنوان نمایشی">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required className="rounded-md" />
          </FormField>

          {form.type === 'card_to_card' ? (
            <>
              <FormField label="شماره کارت">
                <Input value={form.card_number || ''} onChange={(e) => set('card_number', e.target.value)} dir="ltr" required className="rounded-md text-start" />
              </FormField>
              <FormField label="نام صاحب کارت">
                <Input value={form.card_holder_name || ''} onChange={(e) => set('card_holder_name', e.target.value)} className="rounded-md" />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="شماره شبا">
                <Input value={form.iban || ''} onChange={(e) => set('iban', e.target.value)} dir="ltr" required className="rounded-md text-start" />
              </FormField>
              <FormField label="نام صاحب حساب">
                <Input value={form.account_holder_name || ''} onChange={(e) => set('account_holder_name', e.target.value)} className="rounded-md" />
              </FormField>
              <FormField label="نام بانک">
                <Input value={form.bank_name || ''} onChange={(e) => set('bank_name', e.target.value)} className="rounded-md" />
              </FormField>
            </>
          )}

          <FormField label="توضیحات برای کاربر (اختیاری)">
            <textarea rows={2} value={form.instructions || ''} onChange={(e) => set('instructions', e.target.value)} className={fieldClass} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="کارمزد درصدی (%)">
              <Input type="number" step="0.1" min={0} value={form.fee_percent} onChange={(e) => set('fee_percent', e.target.value)} className="rounded-md" />
            </FormField>
            <FormField label="کارمزد ثابت (تومان)">
              <Input type="number" min={0} value={form.fee_fixed} onChange={(e) => set('fee_fixed', e.target.value)} className="rounded-md" />
            </FormField>
            <FormField label="حداقل مبلغ (تومان)">
              <Input type="number" min={0} value={form.min_amount} onChange={(e) => set('min_amount', e.target.value)} className="rounded-md" />
            </FormField>
            <FormField label="حداکثر مبلغ (تومان، اختیاری)">
              <Input type="number" min={0} value={form.max_amount} onChange={(e) => set('max_amount', e.target.value)} className="rounded-md" />
            </FormField>
          </div>

          <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 accent-gold" />
            فعال (برای کاربران نمایش داده شود)
          </label>

          {error && <p className="mb-3.5 text-sm text-critical">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [modalMethod, setModalMethod] = useState(undefined); // undefined = closed, null = new, object = edit
  const [error, setError] = useState(null);

  function load() {
    api.get('/payment-methods/admin/all').then(({ data }) => setMethods(data.methods));
  }

  useEffect(load, []);

  async function toggleActive(m) {
    await api.put(`/payment-methods/${m.id}`, { is_active: !m.is_active });
    load();
  }

  async function remove(m) {
    if (!confirm(`آیا از حذف «${m.title}» مطمئن هستید؟`)) return;
    setError(null);
    try {
      await api.delete(`/payment-methods/${m.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در حذف روش پرداخت');
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">روش‌های شارژ کیف پول</h1>
        <Button onClick={() => setModalMethod(null)}>
          <Plus size={16} /> روش جدید
        </Button>
      </div>
      {error && <p className="mb-4 text-sm text-critical">{error}</p>}

      {methods.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">هنوز روش پرداختی تعریف نشده است.</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>عنوان</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>اطلاعات</TableHead>
                <TableHead>کارمزد</TableHead>
                <TableHead>محدوده مبلغ</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>{typeLabel[m.type]}</TableCell>
                  <TableCell className="font-mono text-xs" dir="ltr">
                    {m.type === 'card_to_card' ? m.card_number : m.iban}
                  </TableCell>
                  <TableCell>
                    {m.fee_percent > 0 && `${m.fee_percent}%`}
                    {m.fee_percent > 0 && m.fee_fixed > 0 && ' + '}
                    {m.fee_fixed > 0 && `${m.fee_fixed.toLocaleString('fa-IR')} ت`}
                    {m.fee_percent === 0 && m.fee_fixed === 0 && 'بدون کارمزد'}
                  </TableCell>
                  <TableCell>
                    {m.min_amount.toLocaleString('fa-IR')} تا {m.max_amount ? m.max_amount.toLocaleString('fa-IR') : 'نامحدود'}
                  </TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggleActive(m)} className="cursor-pointer bg-transparent">
                      <Badge variant={m.is_active ? 'live' : 'finished'}>{m.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setModalMethod(m)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => remove(m)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {modalMethod !== undefined && (
        <MethodModal
          method={modalMethod}
          onClose={() => setModalMethod(undefined)}
          onDone={() => {
            setModalMethod(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}
