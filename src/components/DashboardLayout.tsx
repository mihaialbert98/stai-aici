'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import styles from './DashboardLayout.module.scss';

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  title: string;
  items: NavItem[];
  children: React.ReactNode;
}

export function DashboardLayout({ title, items, children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className={styles.wrapper}>
      {/* Mobile top bar */}
      <div className={styles.mobileBar}>
        <button onClick={() => setSidebarOpen(true)} className={styles.menuBtn} aria-label="Meniu">
          <Menu size={20} />
        </button>
        <span className={styles.mobileTitle}>{title}</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop always visible, mobile as drawer */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarTitle}>{title}</p>
          <button onClick={() => setSidebarOpen(false)} className={styles.closeBtn} aria-label="Închide">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? styles.navItemActive : styles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
