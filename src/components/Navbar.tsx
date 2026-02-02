'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Menu, X, LayoutDashboard, LogOut, ChevronDown, Heart } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user || null));
  }, [pathname]);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    setProfileOpen(false);
    router.push('/');
    router.refresh();
  };

  const isHostMode = pathname.startsWith('/dashboard/host');
  const isGuestMode = pathname.startsWith('/dashboard/guest');

  const dashboardLink = user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : user?.role === 'HOST'
      ? (isGuestMode ? '/dashboard/guest/profile' : '/dashboard/host')
      : '/dashboard/guest/profile';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Left: logo + mode toggle */}
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>StaiAici</Link>
          {user?.role === 'HOST' && (
            <button
              onClick={() => router.push(isHostMode ? '/dashboard/guest/profile' : '/dashboard/host')}
              className={styles.modeToggle}
            >
              <ArrowLeftRight size={14} />
              <span>{isHostMode ? 'Mod oaspete' : 'Mod gazdă'}</span>
            </button>
          )}
        </div>

        {/* Right desktop: bell + profile dropdown */}
        <div className={styles.desktopRight}>
          {user ? (
            <>
              <NotificationBell />
              <div className={styles.profileDropdown} ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  className={styles.profileButton}
                >
                  <span className={styles.avatar}>{initials}</span>
                  <ChevronDown size={14} className={`${styles.chevron} ${profileOpen ? styles.chevronOpen : ''}`} />
                </button>

                {profileOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user.name}</p>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link
                      href={dashboardLink}
                      className={styles.dropdownItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/guest/favorites"
                      className={styles.dropdownItem}
                      onClick={() => setProfileOpen(false)}
                    >
                      <Heart size={16} />
                      Favorite
                    </Link>
                    <button onClick={logout} className={styles.dropdownItem}>
                      <LogOut size={16} />
                      Ieși din cont
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login" className={styles.loginBtn}>Intră în cont</Link>
              <Link href="/auth/register" className={styles.registerBtn}>Înregistrare</Link>
            </div>
          )}
        </div>

        {/* Mobile: bell + hamburger */}
        <div className={styles.mobileActions}>
          {user && <NotificationBell />}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Meniu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {user ? (
            <>
              <div className={styles.mobileHeader}>
                <span className={styles.mobileAvatar}>{initials}</span>
                <div>
                  <p className={styles.mobileUserName}>{user.name}</p>
                  <p className={styles.mobileUserEmail}>{user.email}</p>
                </div>
              </div>
              <div className={styles.mobileDivider} />
              {user.role === 'HOST' && (
                <button
                  onClick={() => { router.push(isHostMode ? '/dashboard/guest/profile' : '/dashboard/host'); setMenuOpen(false); }}
                  className={styles.mobileLink}
                >
                  <ArrowLeftRight size={16} />
                  {isHostMode ? 'Mod oaspete' : 'Mod gazdă'}
                </button>
              )}
              <Link href={dashboardLink} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link href="/dashboard/guest/favorites" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <Heart size={16} />
                Favorite
              </Link>
              <div className={styles.mobileDivider} />
              <button onClick={logout} className={`${styles.mobileLink} ${styles.mobileLinkDanger}`}>
                <LogOut size={16} />
                Ieși din cont
              </button>
            </>
          ) : (
            <div className={styles.mobileAuthButtons}>
              <Link href="/auth/login" className={styles.mobileLoginBtn} onClick={() => setMenuOpen(false)}>
                Intră în cont
              </Link>
              <Link href="/auth/register" className={styles.mobileRegisterBtn} onClick={() => setMenuOpen(false)}>
                Înregistrare
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
