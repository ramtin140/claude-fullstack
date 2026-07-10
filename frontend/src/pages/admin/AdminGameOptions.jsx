import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

const categoryLabel = { console: 'کنسول', game_version: 'ورژن بازی' };
const emptyForm = { category: 'console', value: '', label: '', sort_order: 0 };

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت گزینه‌های بازی</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> گزینه جدید
        </Button>
      </div>
      <p className="mb-5 text-[13px] text-ink-muted">
        این گزینه‌ها در فرم ساخت مسابقات (کنسول، ورژن بازی) نمایش داده می‌شوند و بدون نیاز به تغییر کد قابل افزودن/حذف‌اند.
      </p>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>دسته</TableHead>
              <TableHead>مقدار</TableHead>
              <TableHead>برچسب</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{categoryLabel[o.category] || o.category}</TableCell>
                <TableCell>{o.value}</TableCell>
                <TableCell>{o.label}</TableCell>
                <TableCell>
                  <Badge variant={o.is_active ? 'live' : 'finished'}>{o.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleActive(o)} title="فعال/غیرفعال">
                      <Power size={15} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(o.id)}>
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
          <DialogTitle>گزینه جدید</DialogTitle>
          <form onSubmit={handleSubmit}>
            <FormField label="دسته">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldClass}>
                <option value="console">کنسول</option>
                <option value="game_version">ورژن بازی</option>
              </select>
            </FormField>
            <FormField label="مقدار (کد داخلی، مثلاً ps5)">
              <Input required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="برچسب نمایشی (مثلاً PlayStation 5)">
              <Input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-md" />
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
