import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Search } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../components/ProtectedRoute.jsx';
import { Card } from '../../components/ui/card.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';

const roleVariant = { senior_admin: 'live', writer: 'waiting', match_expert: 'waiting', member: 'finished' };

const selectClass =
  'rounded-md border border-border bg-bg px-2.5 py-1.5 text-[13px] text-ink outline-none transition-colors focus-visible:border-gold disabled:opacity-50';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');

  function load(q) {
    api.get('/users', { params: q ? { query: q } : {} }).then(({ data }) => setUsers(data.users));
  }

  useEffect(() => load(), []);

  function handleSearch(e) {
    e.preventDefault();
    load(query);
  }

  async function changeRole(u, role) {
    await api.put(`/users/${u.id}/role`, { role });
    load(query);
  }

  async function handleDelete(id) {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    await api.delete(`/users/${id}`);
    load(query);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت کاربران</h1>
      </div>

      <form onSubmit={handleSearch} className="mb-[18px] flex max-w-[420px] gap-2.5">
        <Input
          placeholder="جستجو بر اساس نام، ایمیل یا fifa soul ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md"
        />
        <Button type="submit" size="icon">
          <Search size={16} />
        </Button>
      </form>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>ایمیل</TableHead>
              <TableHead>fifa soul ID</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>امتیاز</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Link to={`/u/${u.id}`} className="text-gold hover:underline">
                    {u.name}
                  </Link>
                  {u.is_guest ? ' \u{1F464}' : ''}
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell className="font-mono text-xs" dir="ltr">
                  {u.fifa_soul_id}
                </TableCell>
                <TableCell>
                  <Badge variant={roleVariant[u.role] || 'finished'}>{ROLE_LABELS[u.role] || u.role}</Badge>
                </TableCell>
                <TableCell>{u.points}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      disabled={u.id === me.id}
                      onChange={(e) => changeRole(u, e.target.value)}
                      className={selectClass}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {u.id !== me.id && (
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
