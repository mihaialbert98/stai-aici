'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/useLang';
import { dashboardT } from '@/lib/i18n';

export default function SettingsPage() {
  const lang = useLang();
  const t = dashboardT[lang].settings;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setName(d.user.name);
          setPhone(d.user.phone || '');
          setEmail(d.user.email);
        }
        setLoading(false);
      });
  }, []);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error); return; }
    setSuccess(t.profileSaved);
    router.refresh();
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) { setPwError(t.passwordMin); return; }
    if (newPassword !== confirmPassword) { setPwError(t.passwordMismatch); return; }

    setPwSaving(true);
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);

    if (!res.ok) { setPwError(data.error); return; }
    setPwSuccess(t.passwordChanged);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePassword }),
    });
    setDeleting(false);
    if (!res.ok) { setDeleteError(t.deleteError); return; }
    router.push('/');
  };

  if (loading) return <p className="text-gray-500">{t.loading}</p>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t.profileTitle}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={email} disabled />
            <p className="text-xs text-gray-400 mt-1">{t.emailNote}</p>
          </div>
          <div>
            <label className="label">{t.name}</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="label">{t.phone}</label>
            <input className="input" placeholder={t.phonePh} value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t.passwordTitle}</h2>
        {pwError && <p className="text-red-600 text-sm mb-3">{pwError}</p>}
        {pwSuccess && <p className="text-green-600 text-sm mb-3">{pwSuccess}</p>}
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">{t.currentPassword}</label>
            <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t.newPassword}</label>
            <input type="password" className="input" placeholder={t.newPasswordPh} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t.confirmPassword}</label>
            <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={pwSaving}>
            {pwSaving ? t.changingPassword : t.changePassword}
          </button>
        </form>
      </div>

      <div className="border border-red-200 rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-semibold text-red-700">{t.dangerZoneTitle}</h2>
        <p className="text-sm text-gray-600">{t.dangerZoneDesc}</p>
        <button
          type="button"
          className="border border-red-300 text-red-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors"
          onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }}
        >
          {t.deleteAccount}
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{t.deleteAccountConfirmTitle}</h3>
            <p className="text-sm text-gray-600">{t.deleteAccountConfirmDesc}</p>
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="label">{t.deleteAccountPassword}</label>
                <input
                  type="password"
                  className="input"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {deleteError && <p className="text-red-600 text-sm">{deleteError}</p>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  {lang === 'ro' ? 'Anulează' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  disabled={deleting || !deletePassword}
                >
                  {deleting ? t.deleting : t.deleteAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
