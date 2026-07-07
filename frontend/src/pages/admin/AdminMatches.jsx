import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import '../../styles/admin.css';

const emptyForm = {
  tournament_id: '',
  home_name: '',
  away_name: '',
  home_score: '',
  away_score: '',
  status: 'waiting',
  category: 'ro_dero',
  scheduled_at: '',
};

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  function load() {
    api.get('/matches').then(({ data }) => setMatches(data.matches));
    api.get('/tournaments').then(({ data }) => setTournaments(data.tournaments));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(m) {
    setEditing(m);
    setForm({ ...emptyForm, ...m });
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      home_score: form.home_score === '' ? null : Number(form.home_score),
      away_score: form.away_score === '' ? null : Number(form.away_score),
      tournament_id: form.tournament_id || null,
    };
    try {
      if (editing) {
        await api.put(`/matches/${editing.id}`, payload);
      } else {
        await api.post('/matches', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره‌سازی');
    }
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این مسابقه مطمئن هستید؟')) return;
    await api.delete(`/matches/${id}`);
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>مدیریت مسابقات</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> مسابقه جدید
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>تیم میزبان</th>
              <th>تیم میهمان</th>
              <th>نتیجه</th>
              <th>وضعیت</th>
              <th>دسته</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td>{m.home_name || m.home_user_name || '؟'}</td>
                <td>{m.away_name || m.away_user_name || '؟'}</td>
                <td>{m.home_score != null ? `${m.home_score} - ${m.away_score}` : '-'}</td>
                <td>{m.status}</td>
                <td>{m.category === 'ro_dero' ? 'رو در رو' : 'پلی آف'}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => openEdit(m)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(m.id)}>
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
            <h2>{editing ? 'ویرایش مسابقه' : 'مسابقه جدید'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>تورنمنت</label>
                <select
                  value={form.tournament_id || ''}
                  onChange={(e) => setForm({ ...form, tournament_id: e.target.value })}
                >
                  <option value="">بدون تورنمنت</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>نام تیم میزبان</label>
                <input
                  required
                  value={form.home_name || ''}
                  onChange={(e) => setForm({ ...form, home_name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>نام تیم میهمان</label>
                <input
                  value={form.away_name || ''}
                  onChange={(e) => setForm({ ...form, away_name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>امتیاز میزبان</label>
                <input
                  type="number"
                  value={form.home_score ?? ''}
                  onChange={(e) => setForm({ ...form, home_score: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>امتیاز میهمان</label>
                <input
                  type="number"
                  value={form.away_score ?? ''}
                  onChange={(e) => setForm({ ...form, away_score: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>وضعیت</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="waiting">در انتظار</option>
                  <option value="in_progress">در حال اجرا</option>
                  <option value="finished">پایان‌یافته</option>
                </select>
              </div>
              <div className="form-field">
                <label>دسته</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="ro_dero">رو در رو</option>
                  <option value="play_off">پلی آف</option>
                </select>
              </div>
              <div className="form-field">
                <label>زمان‌بندی</label>
                <input
                  type="text"
                  placeholder="1405-04-13 20:00"
                  value={form.scheduled_at || ''}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
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
