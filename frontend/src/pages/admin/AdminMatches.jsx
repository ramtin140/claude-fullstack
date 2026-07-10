import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت مسابقات</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> مسابقه جدید
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تیم میزبان</TableHead>
              <TableHead>تیم میهمان</TableHead>
              <TableHead>نتیجه</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>دسته</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.home_name || m.home_user_name || '؟'}</TableCell>
                <TableCell>{m.away_name || m.away_user_name || '؟'}</TableCell>
                <TableCell>{m.home_score != null ? `${m.home_score} - ${m.away_score}` : '-'}</TableCell>
                <TableCell>{m.status}</TableCell>
                <TableCell>{m.category === 'ro_dero' ? 'رو در رو' : 'پلی آف'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                      <Pencil size={15} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(m.id)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogTitle>{editing ? 'ویرایش مسابقه' : 'مسابقه جدید'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <FormField label="تورنمنت">
              <select
                value={form.tournament_id || ''}
                onChange={(e) => setForm({ ...form, tournament_id: e.target.value })}
                className={fieldClass}
              >
                <option value="">بدون تورنمنت</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="نام تیم میزبان">
              <Input required value={form.home_name || ''} onChange={(e) => setForm({ ...form, home_name: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="نام تیم میهمان">
              <Input value={form.away_name || ''} onChange={(e) => setForm({ ...form, away_name: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="امتیاز میزبان">
              <Input type="number" value={form.home_score ?? ''} onChange={(e) => setForm({ ...form, home_score: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="امتیاز میهمان">
              <Input type="number" value={form.away_score ?? ''} onChange={(e) => setForm({ ...form, away_score: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="وضعیت">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fieldClass}>
                <option value="waiting">در انتظار</option>
                <option value="in_progress">در حال اجرا</option>
                <option value="finished">پایان‌یافته</option>
              </select>
            </FormField>
            <FormField label="دسته">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldClass}>
                <option value="ro_dero">رو در رو</option>
                <option value="play_off">پلی آف</option>
              </select>
            </FormField>
            <FormField label="زمان‌بندی">
              <Input
                type="text"
                placeholder="1405-04-13 20:00"
                value={form.scheduled_at || ''}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="rounded-md"
              />
            </FormField>
            {error && <p className="mb-3.5 text-sm text-critical">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ذخیره</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
