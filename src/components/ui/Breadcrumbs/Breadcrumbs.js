import React from 'react';
import { useRouter } from 'next/navigation';
import { FiHome, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import styles from './Breadcrumbs.module.scss';

/**
 * Breadcrumbs component
 * @param {Object} props
 * @param {Array<{ label: string, href?: string, onClick?: () => void }>} props.items - Breadcrumb items
 * @param {boolean} [props.showBack] - Show a back button as the first breadcrumb
 * @param {React.ReactNode} [props.backIcon] - Custom icon for the back button
 * @param {string} [props.backLabel] - Custom label for the back button
 * @param {string} [props.backHref] - Optional fixed route for back button
 */

export default function Breadcrumbs({ items = [], showBack = false, backIcon, backLabel, backHref }) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  };

  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumbs}>
      {showBack ? (
        <button
          type="button"
          className={styles.crumbLink}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={handleBack}
          aria-label={backLabel || 'Back'}
        >
          {backIcon ? backIcon : <FiChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />}
        </button>
      ) : (
        <Link
          href="/"
          className={styles.crumbLink}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          aria-label="Home"
        >
          <FiHome size={18} />
        </Link>
      )}
      {items.length > 0 && (
        <FiChevronRight size={16} style={{ color: '#888', margin: '0 4px' }} />
      )}
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.href ? (
            <a
              href={item.href}
              className={styles.crumbLink}
              onClick={e => {
                e.preventDefault();
                if (item.onClick) item.onClick();
                else router.push(item.href);
              }}
            >
              {item.label}
            </a>
          ) : (
            <span className={styles.crumbCurrent}>{item.label}</span>
          )}
          {idx < items.length - 1 && (
            <FiChevronRight size={16} style={{ color: '#888', margin: '0 4px' }} />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
