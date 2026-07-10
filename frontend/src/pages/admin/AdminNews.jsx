import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '../../components/ui/dialog.jsx';

const emptyForm = { title: '', excerpt: '', body: '', category: 'newest' };

const categoryLabel = {
  active_games: 'بازی‌های فعال',
  popular: 'گیک‌ها',
  newest: 'جدیدترین‌ها',
  tutorial: 'آموزش‌ها',
  general: 'عمومی',
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">مدیریت اخبار</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> خبر جدید
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>عنوان</TableHead>
              <TableHead>دسته</TableHead>
              <TableHead>تاریخ انتشار</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((n) => (
              <TableRow key={n.id}>
                <TableCell>{n.title}</TableCell>
                <TableCell>{categoryLabel[n.category] || n.category}</TableCell>
                <TableCell>{n.published_at}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}>
                      <Pencil size={15} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(n.id)}>
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
          <DialogTitle>{editing ? 'ویرایش خبر' : 'خبر جدید'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <FormField label="عنوان">
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-md" />
            </FormField>
            <FormField label="خلاصه">
              <textarea rows={2} value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className={fieldClass} />
            </FormField>
            <FormField label="متن کامل">
              <textarea rows={5} value={form.body || ''} onChange={(e) => setForm({ ...form, body: e.target.value })} className={fieldClass} />
            </FormField>
            <FormField label="دسته">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldClass}>
                {Object.entries(categoryLabel)
                  .filter(([k]) => k !== 'general')
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
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
