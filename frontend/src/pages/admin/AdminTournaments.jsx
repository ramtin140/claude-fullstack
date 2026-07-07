import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Shuffle, Eye } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

const emptyForm = {
  title: '',
  type: 'league',
  description: '',
  status: 'upcoming',
  entry_fee: 0,
  max_players: 16,
  start_date: '',
  bracket_size: 4,
};

const typeLabel = { league: 'لیگ', cup: 'کاپ', playoff: 'پلی‌آف' };

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function load() {
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ ...t });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await api.put(`/tournaments/${editing.id}`, form);
      } else {
        await api.post('/tournaments', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره‌سازی');
    }
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این تورنمنت مطمئن هستید؟')) return;
    await api.delete(`/tournaments/${id}`);
    load();
  }

  async function handleGenerate(t) {
    try {
      await api.post(`/tournaments/${t.id}/generate-bracket`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'خطا در ساخت برکت/جدول');
    }
  }

  return (
    <div>
      <div className="admin-header">
        <h1>مدیریت تورنمنت‌ها</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> تورنمنت جدید
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>نوع</th>
              <th>شرکت‌کننده</th>
              <th>وضعیت</th>
              <th>برکت/جدول</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>
                  {typeLabel[t.type] || t.type}
                  {t.type === 'cup' && t.bracket_size ? ` (${t.bracket_size} نفره)` : ''}
                </td>
                <td>{t.participant_count}</td>
                <td>{t.status}</td>
                <td>
                  {t.bracket_generated ? (
                    <span className="badge badge-live">ساخته‌شده</span>
                  ) : (
                    <button className="btn btn-outline" style={{ padding: '6px 14px' }} onClick={() => handleGenerate(t)}>
                      <Shuffle size={14} /> ساخت برکت/جدول
                    </button>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <Link to={`/tournaments/${t.id}`} className="icon-btn" title="مشاهده">
                      <Eye size={15} />
                    </Link>
                    <button className="icon-btn" onClick={() => openEdit(t)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(t.id)}>
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
            <h2>{editing ? 'ویرایش تورنمنت' : 'تورنمنت جدید'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>عنوان</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-field">
                <label>نوع</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="league">لیگ (جدول امتیازات)</option>
                  <option value="cup">کاپ (برکت حذفی)</option>
                  <option value="playoff">پلی‌آف (قرعه‌کشی تصادفی)</option>
                </select>
              </div>
              {form.type === 'cup' && (
                <div className="form-field">
                  <label>اندازه کاپ</label>
                  <select
                    value={form.bracket_size || 4}
                    onChange={(e) => setForm({ ...form, bracket_size: Number(e.target.value) })}
                  >
                    <option value={4}>۴ نفره</option>
                    <option value={8}>۸ نفره</option>
                    <option value={16}>۱۶ نفره</option>
                  </select>
                </div>
              )}
              <div className="form-field">
                <label>توضیحات</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>وضعیت</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="upcoming">در انتظار شروع</option>
                  <option value="in_progress">در حال اجرا</option>
                  <option value="finished">پایان‌یافته</option>
                </select>
              </div>
              <div className="form-field">
                <label>هزینه ورودی (تومان)</label>
                <input
                  type="number"
                  min={0}
                  value={form.entry_fee}
                  onChange={(e) => setForm({ ...form, entry_fee: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label>حداکثر ظرفیت</label>
                <input
                  type="number"
                  min={2}
                  value={form.max_players}
                  onChange={(e) => setForm({ ...form, max_players: Number(e.target.value) })}
                />
              </div>
              <div className="form-field">
                <label>تاریخ شروع</label>
                <input
                  type="date"
                  value={form.start_date || ''}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
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
