import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/admin.css';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);

  function load() {
    api.get('/users').then(({ data }) => setUsers(data.users));
  }

  useEffect(load, []);

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'member' : 'admin';
    await api.put(`/users/${u.id}/role`, { role: newRole });
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
              <th>نقش</th>
              <th>امتیاز</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-live' : 'badge-waiting'}`}>
                    {u.role === 'admin' ? 'مدیر' : 'عضو'}
                  </span>
                </td>
                <td>{u.points}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-outline" style={{ padding: '6px 14px' }} onClick={() => toggleRole(u)}>
                      {u.role === 'admin' ? 'تنزل به عضو' : 'ارتقا به مدیر'}
                    </button>
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
