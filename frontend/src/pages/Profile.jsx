import { useEffect, useRef, useState } from 'react';
import { Camera, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PlayerAvatarIcon from '../components/PlayerAvatarIcon.jsx';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Button } from '../components/ui/button.jsx';

function FormField({ label, children }) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label className="text-[13px] text-ink-muted">{label}</label>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ psn_id: '', xbox_id: '', steam_id: '', iban: '', card_number: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/users/me/profile').then(({ data }) => {
      setForm({
        psn_id: data.user.psn_id || '',
        xbox_id: data.user.xbox_id || '',
        steam_id: data.user.steam_id || '',
        iban: data.user.iban || '',
        card_number: data.user.card_number || '',
      });
      setAvatarUrl(data.user.avatar_url);
    });
  }

  useEffect(load, []);

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.append('avatar_file', file);
    try {
      const { data } = await api.post('/users/me/avatar', formData);
      setAvatarUrl(data.avatar_url);
      refreshUser();
      setMessage('عکس پروفایل به‌روزرسانی شد.');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در آپلود عکس');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await api.put('/users/me/profile', form);
      refreshUser();
      setMessage('پروفایل با موفقیت ذخیره شد.');
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره پروفایل');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <div className="px-4 pb-5 pt-10 text-center md:px-6">
        <h1 className="mb-2 text-2xl font-bold text-gold">پروفایل من</h1>
        <p className="text-ink-muted">اطلاعات حساب کاربری، شناسه‌های کنسول و اطلاعات بانکی برای برداشت تیکت</p>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-16 pt-4 md:px-6">
        <Card className="mb-6 flex flex-col items-center p-6 text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="تغییر عکس پروفایل"
            className="group relative rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <Avatar className="h-24 w-24 border-2 border-gold">
              {avatarUrl ? <AvatarImage src={assetUrl(avatarUrl)} alt={user.name} /> : null}
              <AvatarFallback>
                <PlayerAvatarIcon seed={user.id} size={36} />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -start-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[#241102] shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
              <Camera size={14} />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatarChange} />
          <h2 className="mb-0.5 mt-3 text-lg font-bold text-ink">{user.name}</h2>
          <p className="font-mono text-[13px] text-ink-muted">fifa soul ID: {user.fifa_soul_id}</p>
        </Card>

        {message && (
          <p className="mb-4 flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 size={15} /> {message}
          </p>
        )}
        {error && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-critical">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <Card className="p-6">
        <form onSubmit={handleSave}>
          <h3 className="mb-4 text-base font-bold text-gold">شناسه‌های کنسول</h3>
          <FormField label="PSN ID">
            <Input value={form.psn_id} onChange={(e) => setForm({ ...form, psn_id: e.target.value })} className="rounded-md" />
          </FormField>
          <FormField label="XBOX ID">
            <Input value={form.xbox_id} onChange={(e) => setForm({ ...form, xbox_id: e.target.value })} className="rounded-md" />
          </FormField>
          <FormField label="Steam ID">
            <Input value={form.steam_id} onChange={(e) => setForm({ ...form, steam_id: e.target.value })} className="rounded-md" />
          </FormField>

          <h3 className="mb-4 mt-2 flex items-center gap-2 text-base font-bold text-gold">
            <CreditCard size={18} /> اطلاعات بانکی (برای برداشت تیکت به وجه نقد)
          </h3>
          <FormField label="شماره شبا (IBAN)">
            <Input
              placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              dir="ltr"
              className="rounded-md text-start"
            />
          </FormField>
          <FormField label="شماره کارت (۱۶ رقم)">
            <Input
              placeholder="6037xxxxxxxxxxxx"
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              dir="ltr"
              className="rounded-md text-start"
            />
          </FormField>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'در حال ذخیره...' : 'ذخیره پروفایل'}
          </Button>
        </form>
        </Card>
      </div>
    </div>
  );
}
