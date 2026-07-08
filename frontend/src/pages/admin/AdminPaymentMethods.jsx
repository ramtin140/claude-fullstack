import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{method ? 'ویرایش روش پرداخت' : 'روش پرداخت جدید'}</h2>
        <form onSubmit={submit}>
          <div className="form-field">
            <label>نوع</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} disabled={!!method}>
              <option value="card_to_card">کارت به کارت</option>
              <option value="bank_account">واریز به حساب</option>
            </select>
          </div>
          <div className="form-field">
            <label>عنوان نمایشی</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>

          {form.type === 'card_to_card' ? (
            <>
              <div className="form-field">
                <label>شماره کارت</label>
                <input value={form.card_number || ''} onChange={(e) => set('card_number', e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} required />
              </div>
              <div className="form-field">
                <label>نام صاحب کارت</label>
                <input value={form.card_holder_name || ''} onChange={(e) => set('card_holder_name', e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <label>شماره شبا</label>
                <input value={form.iban || ''} onChange={(e) => set('iban', e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} required />
              </div>
              <div className="form-field">
                <label>نام صاحب حساب</label>
                <input value={form.account_holder_name || ''} onChange={(e) => set('account_holder_name', e.target.value)} />
              </div>
              <div className="form-field">
                <label>نام بانک</label>
                <input value={form.bank_name || ''} onChange={(e) => set('bank_name', e.target.value)} />
              </div>
            </>
          )}

          <div className="form-field">
            <label>توضیحات برای کاربر (اختیاری)</label>
            <textarea rows={2} value={form.instructions || ''} onChange={(e) => set('instructions', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label>کارمزد درصدی (%)</label>
              <input type="number" step="0.1" min={0} value={form.fee_percent} onChange={(e) => set('fee_percent', e.target.value)} />
            </div>
            <div className="form-field">
              <label>کارمزد ثابت (تومان)</label>
              <input type="number" min={0} value={form.fee_fixed} onChange={(e) => set('fee_fixed', e.target.value)} />
            </div>
            <div className="form-field">
              <label>حداقل مبلغ (تومان)</label>
              <input type="number" min={0} value={form.min_amount} onChange={(e) => set('min_amount', e.target.value)} />
            </div>
            <div className="form-field">
              <label>حداکثر مبلغ (تومان، اختیاری)</label>
              <input type="number" min={0} value={form.max_amount} onChange={(e) => set('max_amount', e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            فعال (برای کاربران نمایش داده شود)
          </label>

          {error && <p className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              انصراف
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      <div className="admin-header">
        <h1>روش‌های شارژ کیف پول</h1>
        <button className="btn btn-primary" onClick={() => setModalMethod(null)}>
          <Plus size={16} /> روش جدید
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      {methods.length === 0 ? (
        <div className="empty-state">هنوز روش پرداختی تعریف نشده است.</div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>عنوان</th>
                <th>نوع</th>
                <th>اطلاعات</th>
                <th>کارمزد</th>
                <th>محدوده مبلغ</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id}>
                  <td>{m.title}</td>
                  <td>{typeLabel[m.type]}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', direction: 'ltr', textAlign: 'left' }}>
                    {m.type === 'card_to_card' ? m.card_number : m.iban}
                  </td>
                  <td>
                    {m.fee_percent > 0 && `${m.fee_percent}%`}
                    {m.fee_percent > 0 && m.fee_fixed > 0 && ' + '}
                    {m.fee_fixed > 0 && `${m.fee_fixed.toLocaleString('fa-IR')} ت`}
                    {m.fee_percent === 0 && m.fee_fixed === 0 && 'بدون کارمزد'}
                  </td>
                  <td>
                    {m.min_amount.toLocaleString('fa-IR')} تا {m.max_amount ? m.max_amount.toLocaleString('fa-IR') : 'نامحدود'}
                  </td>
                  <td>
                    <button
                      className={`badge ${m.is_active ? 'badge-live' : 'badge-finished'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => toggleActive(m)}
                    >
                      {m.is_active ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => setModalMethod(m)}>
                        <Pencil size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => remove(m)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
