'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { NestlyLogo } from '@/components/NestlyLogo';
import { setLangCookie } from '@/lib/i18n';
import { useLang, dispatchLangChange } from '@/lib/useLang';
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
  const lang = useLang();
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const toggleLang = () => {
    const next = lang === 'ro' ? 'en' : 'ro';
    setLangCookie(next);
    dispatchLangChange(next);
    router.refresh(); // refresh server components (landing page etc.)
  };

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

  // Hide navbar on public-facing form pages (no auth context needed)
  if (
    pathname.startsWith('/register/') ||
    pathname.startsWith('/form/') ||
    pathname.startsWith('/checkin/')
  ) return null;

  const dashboardLink = user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : '/dashboard/host';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Left: logo */}
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}><NestlyLogo /></Link>
        </div>

        {/* Right desktop: lang toggle + bell + profile dropdown */}
        <div className={styles.desktopRight}>
          <button
            onClick={toggleLang}
            className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          >
            {lang === 'ro' ? 'EN' : 'RO'}
          </button>
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
          <div className="px-4 pt-3 pb-1">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              {lang === 'ro' ? 'EN' : 'RO'}
            </button>
          </div>
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
              <Link href={dashboardLink} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                <LayoutDashboard size={16} />
                Dashboard
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
