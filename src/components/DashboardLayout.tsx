'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>{title}</p>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? styles.navItemActive : styles.navItem}
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
