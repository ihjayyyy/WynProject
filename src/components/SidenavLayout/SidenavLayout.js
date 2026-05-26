'use client';
import styles from './SidenavLayout.module.scss';
import Link from 'next/link';
import { sidenavItems } from './sidenavData';
import Image from 'next/image';
import Button from '../ui/Button/Button';
import { useState, useContext, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AccessContext } from '@/app/contextProviders/accessContext';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { clearAuthData } from '@/services/Auth';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';

import Logo from '@/assets/logo.jpg';

export default function SidenavLayout({ children }) {
  const router = useRouter();
  const { user, getAccess } = useContext(AccessContext);
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [expandedParents, setExpandedParents] = useState(new Set());
  const pathname = usePathname();
  const pathLower = pathname?.toLowerCase();
  const footerRef = useRef(null);
  const footerDropdownRef = useRef(null);

  const handleLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
    clearAuthData();
    router.push('/login');
  }, [router]);

  const cancelLogout = useCallback(() => {
    setLogoutConfirmOpen(false);
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view-profile',
        label: 'View Profile',
        icon: <FiUser size={14} />,
        onClick: () => router.push('/userprofile'),
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: <FiLogOut size={14} />,
        onClick: handleLogout,
        destructive: true,
      },
    ],
    [router, handleLogout],
  );

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const toggleParentExpansion = (parentLabel) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentLabel)) {
      newExpanded.delete(parentLabel);
    } else {
      newExpanded.add(parentLabel);
    }
    setExpandedParents(newExpanded);
  };

  // Helper: for payment landing, also match /purchase/payment and /purchase/paymentform
  const isPaymentLandingPath = (path) => {
    const paymentLandingPaths = [
      '/purchase/paymentlanding',
      '/purchase/payment',
      '/purchase/paymentform',
    ];
    return paymentLandingPaths.includes(path?.toLowerCase());
  };

  // Helper: for delivery landing (purchase), also match /purchase/delivery and /purchase/deliveryform
  const isDeliveryLandingPath = (path) => {
    const deliveryPaths = [
      '/purchase/deliverylanding',
      '/purchase/delivery',
      '/purchase/deliveryform',
    ];
    return deliveryPaths.includes(path?.toLowerCase());
  };

  // Helper: for sales delivery, match /sales/deliverylanding and /sales/deliveryform
  const isSalesDeliveryPath = (path) => {
    const salesDeliveryPaths = [
      '/sales/deliverylanding',
      '/sales/delivery',
      '/sales/deliveryform',
    ];
    return salesDeliveryPaths.includes(path?.toLowerCase());
  };

  // Helper: for invoice landing, also match /purchase/invoice and /purchase/invoiceform
  const isInvoiceLandingPath = (path) => {
    const invoiceLandingPaths = [
      '/purchase/invoicelanding',
      '/purchase/invoice',
      '/purchase/invoiceform',
    ];
    return invoiceLandingPaths.includes(path?.toLowerCase());
  };

  // Helper: for sales quotation landing, match /sales/quotationlanding and /sales/quotationform
  const isSalesQuotationPath = (path) => {
    const salesQuotationPaths = [
      '/sales/quotationlanding',
      '/sales/quotation',
      '/sales/quotationform',
    ];
    return salesQuotationPaths.includes(path?.toLowerCase());
  };

  // Helper: for sales order, match /sales/order and /sales/orderform
  const isSalesOrderPath = (path) => {
    const salesOrderPaths = [
      '/sales/orderlanding',
      '/sales/order',
      '/sales/orderform',
    ];
    return salesOrderPaths.includes(path?.toLowerCase());
  };

  // Helper: for order landing, also match /purchase/order and /purchase/orderform
  const isOrderLandingPath = (path) => {
    const orderLandingPaths = [
      '/purchase/orderlanding',
      '/purchase/order',
      '/purchase/orderform',
    ];
    return orderLandingPaths.includes(path?.toLowerCase());
  };

  // Helper: for quotation landing, also match /purchase/quotation, /purchase/quotationform, /purchase/quotationlanding
  const isQuotationLandingPath = (path) => {
    const quotationLandingPaths = [
      '/purchase/quotationlanding',
      '/purchase/quotation',
      '/purchase/quotationform',
    ];
    return quotationLandingPaths.includes(path?.toLowerCase());
  };

  const isParentActive = (item) => {
    // normalize once
    const itemHrefLower = item.href?.toLowerCase();
    if (
      item.href &&
      (pathLower === itemHrefLower ||
        pathLower?.startsWith(itemHrefLower + '/'))
    ) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => {
        // Special case for Purchase Order
        if (child.href === '/purchase/orderlanding') {
          return isOrderLandingPath(pathname);
        }
        // Special case for Delivery (purchase)
        if (child.href === '/purchase/deliverylanding') {
          return isDeliveryLandingPath(pathname);
        }
        // Special case for Sales Order
        if (child.href === '/sales/orderlanding') {
          return isSalesOrderPath(pathname);
        }
        // Special case for Sales Delivery
        if (child.href === '/sales/deliverylanding') {
          return isSalesDeliveryPath(pathname);
        }
        // Special case for Invoice
        if (child.href === '/purchase/invoicelanding') {
          return isInvoiceLandingPath(pathname);
        }
        // Special case for Payment
        if (child.href === '/purchase/paymentlanding') {
          return isPaymentLandingPath(pathname);
        }
        // Special case for Quotation
        if (child.href === '/purchase/quotationlanding') {
          return isQuotationLandingPath(pathname);
        }
        // Special case for Sales Quotation
        if (child.href === '/sales/quotationlanding') {
          return isSalesQuotationPath(pathname);
        }
        // also treat child href as active when the current path is under the child's route
        return (
          pathLower === child.href.toLowerCase() ||
          pathLower?.startsWith(child.href.toLowerCase() + '/')
        );
      });
    }
    return false;
  };

  const isChildActive = (child) => {
    // Special case for Purchase Order
    if (child.href === '/purchase/orderlanding') {
      return isOrderLandingPath(pathname);
    }
    // Special case for Delivery (purchase)
    if (child.href === '/purchase/deliverylanding') {
      return isDeliveryLandingPath(pathname);
    }
    // Special case for Sales Order
    if (child.href === '/sales/orderlanding') {
      return isSalesOrderPath(pathname);
    }
    // Special case for Sales Delivery
    if (child.href === '/sales/deliverylanding') {
      return isSalesDeliveryPath(pathname);
    }
    // Special case for Quotation
    if (child.href === '/purchase/quotationlanding') {
      return isQuotationLandingPath(pathname);
    }
    // Special case for Sales Quotation
    if (child.href === '/sales/quotationlanding') {
      return isSalesQuotationPath(pathname);
    }
    // Special case for Invoice
    if (child.href === '/purchase/invoicelanding') {
      return isInvoiceLandingPath(pathname);
    }
    // Special case for Payment
    if (child.href === '/purchase/paymentlanding') {
      return isPaymentLandingPath(pathname);
    }
    // Also consider child active for nested routes under the child's href
    return (
      pathLower === child.href.toLowerCase() ||
      pathLower?.startsWith(child.href.toLowerCase() + '/')
    );
  };

  const renderNavItem = (item) => {
    const pageaccess = getAccess(item.name);

    if (pageaccess.access === 'n') {
      return null;
    }
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedParents.has(item.label);
    const isActive = isParentActive(item);

    // Helper to render icon safely
    const renderIcon = (IconComponent, size = 18) => {
      if (!IconComponent) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`SidenavLayout: Icon for '${item.label}' is undefined.`);
        }
        return <span style={{ width: size, display: 'inline-block' }} />;
      }
      return <IconComponent size={size} />;
    };

    // If no children, render as before
    if (!hasChildren) {
      return (
        <li key={item.label} className={styles.navItem}>
          <Link
            href={item.href}
            title={item.label}
            className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
            {renderIcon(item.icon, 18)}
            {!isCollapsed && (
              <span className={styles.navLabel}>{item.label}</span>
            )}
          </Link>
        </li>
      );
    }

    // Parent with children
    return (
      <li key={item.label} className={styles.navItem}>
        <div className={styles.parentItem}>
          <button
            className={`${styles.navLink} ${styles.parentNavLink} ${
              isActive ? styles.parentActive : ''
            }`}
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setExpandedParents(new Set([item.label]));
              } else {
                toggleParentExpansion(item.label);
              }
            }}
            title={item.label}>
            {renderIcon(item.icon, 18)}
            {!isCollapsed && (
              <>
                <span className={styles.navLabel}>{item.label}</span>
                <span className={styles.chevronIcon}>
                  {isExpanded ? (
                    <FiChevronUp size={14} />
                  ) : (
                    <FiChevronDown size={14} />
                  )}
                </span>
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <ul className={styles.childNavList}>
              {item.children.map(
                (child) =>
                  getAccess(child.name).access !== 'n' && (
                    <li key={child.label} className={styles.childNavItem}>
                      <Link
                        href={child.href}
                        title={child.label}
                        className={`${styles.navLink} ${styles.childNavLink} ${
                          isChildActive(child) ? styles.childActive : ''
                        }`}>
                        {renderIcon(child.icon, 16)}
                        <span className={styles.navLabel}>{child.label}</span>
                      </Link>
                    </li>
                  ),
              )}
            </ul>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className={styles.layout}>
      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.collapsed : styles.expanded
        }`}>
        {/* Header Section - Unchanged */}
        <header className={styles.sidebarHeader}>
          <div className={styles.brandSection}>
            <div
              className={`${styles.logoContainer} ${
                isCollapsed ? styles.collapsedLogo : ''
              }`}
              onClick={() => isCollapsed && setIsCollapsed(false)}
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              title={isCollapsed ? 'Expand sidebar' : ''}>
              <Image
                src={Logo}
                alt="Wyn Logo"
                className={`${styles.brandLogo} ${
                  isLogoHovered && isCollapsed ? styles.logoHovered : ''
                }`}
                width={32}
                height={32}
              />
              {isCollapsed && isLogoHovered && (
                <div className={styles.expandIcon}>
                  <FiChevronRight size={16} />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className={styles.brandInfo}>
                <h1 className={styles.brandTitle}>WynProject</h1>
                <p className={styles.brandSubtitle}>AM System</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className={styles.collapseButton}
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              title="Collapse sidebar">
              <FiChevronLeft size={16} />
            </button>
          )}
        </header>

        {/* Navigation Section */}
        <nav className={styles.navigation}>
          <ul className={styles.navList}>{sidenavItems.map(renderNavItem)}</ul>
        </nav>

        {/* Footer Section */}
        <footer className={styles.sidebarFooter} ref={footerRef}>
          <div
            className={styles.userProfile}
            onClick={(e) => {
              if (isCollapsed) return;
              // if click is already on the dropdown trigger/menu, let it handle itself
              if (
                footerDropdownRef.current &&
                footerDropdownRef.current.contains(e.target)
              )
                return;
              // open/toggle the dropdown by clicking its trigger button;
              // containsRef on DropdownAction ensures the original click doesn't cause onDoc to close it
              const btn = footerDropdownRef.current?.querySelector('button');
              if (btn) btn.click();
            }}
            style={{ cursor: isCollapsed ? 'default' : 'pointer' }}>
            <Image
              src={Logo}
              alt="User Avatar"
              className={styles.userAvatar}
              width={28}
              height={28}
            />
            {!isCollapsed && (
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.name}</span>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
            )}

            {!isCollapsed && (
              <div ref={footerDropdownRef}>
                <DropdownAction items={actionItems} containsRef={footerRef} />
              </div>
            )}
          </div>
        </footer>
      </aside>

      <main className={styles.mainContent}>{children}</main>
      <ConfirmModal
        open={isLogoutConfirmOpen}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        confirmVariant="danger"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
}
