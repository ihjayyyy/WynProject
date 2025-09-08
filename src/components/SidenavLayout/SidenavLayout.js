'use client';

import styles from './SidenavLayout.module.scss';
import Link from 'next/link';
import { sidenavItems } from './sidenavData';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function SidenavLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const renderNavItem = (item) => {
    const isActive = pathname?.toLowerCase() === item.href.toLowerCase();
    
    return (
      <li key={item.label} className={styles.navItem}>
        <Link
          href={item.href}
          title={item.label}
          className={`${styles.navLink} ${isActive ? styles.active : ''}`}
        >
          <item.icon size={22} />
          {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded}`}>
        {/* Header Section */}
        <header className={styles.sidebarHeader}>
          <div className={styles.brandSection}>
            <div 
              className={`${styles.logoContainer} ${isCollapsed ? styles.collapsedLogo : ''}`}
              onClick={() => isCollapsed && setIsCollapsed(false)}
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              title={isCollapsed ? "Expand sidebar" : ""}
            >
              <Image
                src="/ODR-Logo.png"
                alt="ODR Logo"
                className={`${styles.brandLogo} ${isLogoHovered && isCollapsed ? styles.logoHovered : ''}`}
                width={40}
                height={40}
              />
              {isCollapsed && isLogoHovered && (
                <div className={styles.expandIcon}>
                  <FiChevronRight size={20} />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className={styles.brandInfo}>
                <h1 className={styles.brandTitle}>ODR Accounting</h1>
                <p className={styles.brandSubtitle}>AM System</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className={styles.collapseButton}
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
        </header>

        {/* Navigation Section */}
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {sidenavItems.map(renderNavItem)}
          </ul>
        </nav>

        {/* Footer Section */}
        <footer className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <Image 
              src="/ODR-Logo.png" 
              alt="User Avatar" 
              className={styles.userAvatar} 
              width={32} 
              height={32} 
            />
            {!isCollapsed && (
              <div className={styles.userDetails}>
                <span className={styles.userName}>Mia de Silva</span>
                <span className={styles.userEmail}>mia@untitledui.com</span>
              </div>
            )}
          </div>
        </footer>
      </aside>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
