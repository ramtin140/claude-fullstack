import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Shuffle, Eye } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت تورنمنت‌ها</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> تورنمنت جدید
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان</TableHead>
              <TableHead>نوع</TableHead>
              <TableHead>شرکت‌کننده</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>برکت/جدول</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.title}</TableCell>
                <TableCell>
                  {typeLabel[t.type] || t.type}
                  {t.type === 'cup' && t.bracket_size ? ` (${t.bracket_size} نفره)` : ''}
                </TableCell>
                <TableCell>{t.participant_count}</TableCell>
                <TableCell>{t.status}</TableCell>
                <TableCell>
                  {t.bracket_generated ? (
                    <Badge variant="live">ساخته‌شده</Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleGenerate(t)}>
                      <Shuffle size={14} /> ساخت برکت/جدول
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8" title="مشاهده">
                      <Link to={`/tournaments/${t.id}`}>
                        <Eye size={15} />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                      <Pencil size={15} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
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
          <DialogTitle>{editing ? 'ویرایش تورنمنت' : 'تورنمنت جدید'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <FormField label="عنوان">
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="نوع">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={fieldClass}>
                <option value="league">لیگ (جدول امتیازات)</option>
                <option value="cup">کاپ (برکت حذفی)</option>
                <option value="playoff">پلی‌آف (قرعه‌کشی تصادفی)</option>
              </select>
            </FormField>
            {form.type === 'cup' && (
              <FormField label="اندازه کاپ">
                <select
                  value={form.bracket_size || 4}
                  onChange={(e) => setForm({ ...form, bracket_size: Number(e.target.value) })}
                  className={fieldClass}
                >
                  <option value={4}>۴ نفره</option>
                  <option value={8}>۸ نفره</option>
                  <option value={16}>۱۶ نفره</option>
                </select>
              </FormField>
            )}
            <FormField label="توضیحات">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={fieldClass}
              />
            </FormField>
            <FormField label="وضعیت">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={fieldClass}>
                <option value="upcoming">در انتظار شروع</option>
                <option value="in_progress">در حال اجرا</option>
                <option value="finished">پایان‌یافته</option>
              </select>
            </FormField>
            <FormField label="هزینه ورودی (تومان)">
              <Input
                type="number"
                min={0}
                value={form.entry_fee}
                onChange={(e) => setForm({ ...form, entry_fee: Number(e.target.value) })}
                className="rounded-md"
              />
            </FormField>
            <FormField label="حداکثر ظرفیت">
              <Input
                type="number"
                min={2}
                value={form.max_players}
                onChange={(e) => setForm({ ...form, max_players: Number(e.target.value) })}
                className="rounded-md"
              />
            </FormField>
            <FormField label="تاریخ شروع">
              <Input type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded-md" />
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
