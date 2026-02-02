'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
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
    setSuccess('Profilul a fost actualizat!');
    router.refresh();
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) { setPwError('Parola nouă trebuie să aibă minim 6 caractere'); return; }
    if (newPassword !== confirmPassword) { setPwError('Parolele nu coincid'); return; }

    setPwSaving(true);
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);

    if (!res.ok) { setPwError(data.error); return; }
    setPwSuccess('Parola a fost schimbată!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (loading) return <p className="text-gray-500">Se încarcă...</p>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-bold">Setări cont</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Informații profil</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={email} disabled />
            <p className="text-xs text-gray-400 mt-1">Emailul nu poate fi modificat</p>
          </div>
          <div>
            <label className="label">Nume</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" placeholder="ex. 0721 234 567" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Se salvează...' : 'Salvează'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Schimbă parola</h2>
        {pwError && <p className="text-red-600 text-sm mb-3">{pwError}</p>}
        {pwSuccess && <p className="text-green-600 text-sm mb-3">{pwSuccess}</p>}
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Parola curentă</label>
            <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Parola nouă</label>
            <input type="password" className="input" placeholder="Minim 6 caractere" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Confirmă parola nouă</label>
            <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={pwSaving}>
            {pwSaving ? 'Se salvează...' : 'Schimbă parola'}
          </button>
        </form>
      </div>
    </div>
  );
}
