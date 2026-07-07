import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

const categoryLabel = { console: 'کنسول', game_version: 'ورژن بازی' };
const emptyForm = { category: 'console', value: '', label: '', sort_order: 0 };

export default function AdminGameOptions() {
  const [options, setOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function load() {
    api.get('/game-options/admin').then(({ data }) => setOptions(data.options));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/game-options', form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره‌سازی');
    }
  }

  async function toggleActive(opt) {
    await api.put(`/game-options/${opt.id}`, { is_active: !opt.is_active });
    load();
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این گزینه مطمئن هستید؟')) return;
    await api.delete(`/game-options/${id}`);
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>مدیریت گزینه‌های بازی</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> گزینه جدید
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', marginTop: -12, marginBottom: 20, fontSize: '0.85rem' }}>
        این گزینه‌ها در فرم ساخت مسابقات (کنسول، ورژن بازی) نمایش داده می‌شوند و بدون نیاز به تغییر کد قابل افزودن/حذف‌اند.
      </p>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>دسته</th>
              <th>مقدار</th>
              <th>برچسب</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.id}>
                <td>{categoryLabel[o.category] || o.category}</td>
                <td>{o.value}</td>
                <td>{o.label}</td>
                <td>
                  <span className={`badge ${o.is_active ? 'badge-live' : 'badge-finished'}`}>
                    {o.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => toggleActive(o)} title="فعال/غیرفعال">
                      <Power size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(o.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>گزینه جدید</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>دسته</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="console">کنسول</option>
                  <option value="game_version">ورژن بازی</option>
                </select>
              </div>
              <div className="form-field">
                <label>مقدار (کد داخلی، مثلاً ps5)</label>
                <input required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div className="form-field">
                <label>برچسب نمایشی (مثلاً PlayStation 5)</label>
                <input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                  انصراف
                </button>
                <button type="submit" className="btn btn-primary">
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
