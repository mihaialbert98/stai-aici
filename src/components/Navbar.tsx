'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, Menu, X } from 'lucide-react';
import styles from './Navbar.module.scss';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null));
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const dashboardLink = user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : user?.role === 'HOST'
      ? '/dashboard/host'
      : '/dashboard/guest/bookings';

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>StaiAici</Link>

        {/* Desktop links */}
        <div className={styles.desktopLinks}>
          {user ? (
            <div className={styles.userMenu}>
              {user.role === 'HOST' && (
                pathname.startsWith('/dashboard/host')
                  ? <button onClick={() => router.push('/')} className={styles.modeToggle}>
                      <ArrowLeftRight size={14} /> Explorează
                    </button>
                  : <button onClick={() => router.push('/dashboard/host')} className={styles.modeToggle}>
                      <ArrowLeftRight size={14} /> Mod gazdă
                    </button>
              )}
              <Link href={dashboardLink} className={styles.link}>Dashboard</Link>
              <span className={styles.userName}>{user.name}</span>
              <button onClick={logout} className="btn-secondary text-sm !py-1 !px-3">Ieși</button>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary text-sm !py-1 !px-3">Intră în cont</Link>
              <Link href="/auth/register" className="btn-primary text-sm !py-1 !px-3">Înregistrare</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Meniu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {user ? (
            <>
              <p className={styles.mobileUserName}>{user.name}</p>
              {user.role === 'HOST' && (
                pathname.startsWith('/dashboard/host')
                  ? <button onClick={() => { router.push('/'); setMenuOpen(false); }} className={styles.mobileLink}>
                      <ArrowLeftRight size={16} /> Explorează
                    </button>
                  : <button onClick={() => { router.push('/dashboard/host'); setMenuOpen(false); }} className={styles.mobileLink}>
                      <ArrowLeftRight size={16} /> Mod gazdă
                    </button>
              )}
              <Link href={dashboardLink} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={logout} className={styles.mobileLink}>Ieși din cont</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Intră în cont</Link>
              <Link href="/auth/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Înregistrare</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
