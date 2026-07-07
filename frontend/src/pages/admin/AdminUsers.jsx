import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../components/ProtectedRoute.jsx';
import '../../styles/admin.css';

const roleBadge = {
  senior_admin: 'badge-live',
  writer: 'badge-waiting',
  match_expert: 'badge-waiting',
  member: 'badge-finished',
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);

  function load() {
    api.get('/users').then(({ data }) => setUsers(data.users));
  }

  useEffect(load, []);

  async function changeRole(u, role) {
    await api.put(`/users/${u.id}/role`, { role });
    load();
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <div>
      <div className="admin-header">
        <h1>مدیریت کاربران</h1>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>نام</th>
              <th>ایمیل</th>
              <th>fifa soul ID</th>
              <th>نقش</th>
              <th>امتیاز</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  {u.is_guest ? ' 👤' : ''}
                </td>
                <td>{u.email}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{u.fifa_soul_id}</td>
                <td>
                  <span className={`badge ${roleBadge[u.role] || 'badge-finished'}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td>{u.points}</td>
                <td>
                  <div className="row-actions">
                    <select
                      value={u.role}
                      disabled={u.id === me.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-darker)',
                        color: 'var(--text-light)',
                        border: '1px solid var(--border-soft)',
                      }}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {u.id !== me.id && (
                      <button className="icon-btn" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
