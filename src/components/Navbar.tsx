'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.scss';

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null));
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
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
        <div className={styles.links}>
          {user ? (
            <div className={styles.userMenu}>
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
      </div>
    </nav>
  );
}
