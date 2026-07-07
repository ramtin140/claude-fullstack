import { useEffect, useRef, useState } from 'react';
import { User, Camera, CreditCard } from 'lucide-react';
import { api, assetUrl } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/pages.css';

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
    <div className="page-wrap">
      <div className="page-header">
        <h1>پروفایل من</h1>
        <p>اطلاعات حساب کاربری، شناسه‌های کنسول و اطلاعات بانکی برای برداشت تیکت</p>
      </div>

      <div className="container" style={{ paddingBottom: 60, maxWidth: 640 }}>
        <div className="card" style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <div
            className="profile-avatar-wrap"
            onClick={() => fileInputRef.current?.click()}
            title="تغییر عکس پروفایل"
          >
            {avatarUrl ? (
              <img src={assetUrl(avatarUrl)} alt={user.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">
                <User size={36} />
              </div>
            )}
            <span className="profile-avatar-edit">
              <Camera size={14} />
            </span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatarChange} />
          <h2 style={{ margin: '12px 0 2px' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            fifa soul ID: {user.fifa_soul_id}
          </p>
        </div>

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <form className="card" style={{ padding: 24 }} onSubmit={handleSave}>
          <h3 style={{ marginTop: 0, color: 'var(--gold)' }}>شناسه‌های کنسول</h3>
          <div className="form-field">
            <label>PSN ID</label>
            <input value={form.psn_id} onChange={(e) => setForm({ ...form, psn_id: e.target.value })} />
          </div>
          <div className="form-field">
            <label>XBOX ID</label>
            <input value={form.xbox_id} onChange={(e) => setForm({ ...form, xbox_id: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Steam ID</label>
            <input value={form.steam_id} onChange={(e) => setForm({ ...form, steam_id: e.target.value })} />
          </div>

          <h3 style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={18} /> اطلاعات بانکی (برای برداشت تیکت به وجه نقد)
          </h3>
          <div className="form-field">
            <label>شماره شبا (IBAN)</label>
            <input
              placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
          <div className="form-field">
            <label>شماره کارت (۱۶ رقم)</label>
            <input
              placeholder="6037xxxxxxxxxxxx"
              value={form.card_number}
              onChange={(e) => setForm({ ...form, card_number: e.target.value })}
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'در حال ذخیره...' : 'ذخیره پروفایل'}
          </button>
        </form>
      </div>
    </div>
  );
}
