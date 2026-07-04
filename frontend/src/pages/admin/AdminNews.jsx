import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

const emptyForm = { title: '', excerpt: '', body: '', category: 'newest' };

const categoryLabel = {
  active_games: 'بازی‌های فعال',
  popular: 'گیک‌ها',
  newest: 'جدیدترین‌ها',
  tutorial: 'آموزش‌ها',
  general: 'عمومی',
};

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function load() {
    api.get('/news').then(({ data }) => setNews(data.news));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(n) {
    setEditing(n);
    setForm({ ...n });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await api.put(`/news/${editing.id}`, form);
      } else {
        await api.post('/news', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره‌سازی');
    }
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این خبر مطمئن هستید؟')) return;
    await api.delete(`/news/${id}`);
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>مدیریت اخبار</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> خبر جدید
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>دسته</th>
              <th>تاریخ انتشار</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {news.map((n) => (
              <tr key={n.id}>
                <td>{n.title}</td>
                <td>{categoryLabel[n.category] || n.category}</td>
                <td>{n.published_at}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => openEdit(n)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(n.id)}>
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
            <h2>{editing ? 'ویرایش خبر' : 'خبر جدید'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>عنوان</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-field">
                <label>خلاصه</label>
                <textarea
                  rows={2}
                  value={form.excerpt || ''}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>متن کامل</label>
                <textarea
                  rows={5}
                  value={form.body || ''}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>دسته</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryLabel)
                    .filter(([k]) => k !== 'general')
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                </select>
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
