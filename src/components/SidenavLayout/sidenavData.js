import {
  FiUsers,
  FiDatabase,
  FiFileText,
  FiBarChart,
  FiFile,
  FiClipboard,
  FiDollarSign,
  FiShoppingBag, // Added for Purchasing
  FiCreditCard, // Added for Sales
  FiTruck, // Added for Supplier
  FiBriefcase,
  FiUserCheck, // Added for Company
} from 'react-icons/fi';
import { GrUserSettings } from 'react-icons/gr';

export const sidenavItems = [
  // Dashboard
  {
    label: 'Dashboard',
    icon: FiBarChart,
    href: '/dashboard',
  },

  // Item with children
  {
    label: 'Supplier',
    icon: FiTruck,
    href: '/supplier',
  },

  // Parent with children

  // Purchasing Module
  {
    label: 'Purchasing',
    icon: FiShoppingBag, // changed to shopping bag for business context
    children: [
      {
        label: 'Quotation',
        icon: FiFileText,
        href: '/purchase/quotationLanding',
      },
      { label: 'Purchase Order', icon: FiClipboard, href: '/purchase/order' },
      {
        label: 'Invoice',
        icon: FiFile,
        href: '/purchase/invoice',
      },
      { label: 'Payment', icon: FiDollarSign, href: '/purchase/payment' },
    ],
  },

  // Sales Module
  {
    label: 'Sales',
    icon: FiCreditCard, // changed to credit card for business context
    children: [
      { label: 'Quotation', icon: FiFileText, href: '/sales/quotation' },
      { label: 'Sales Order', icon: FiClipboard, href: '/sales/order' },
      {
        label: 'Invoice',
        icon: FiFile,
        href: '/sales/invoice',
      },
      { label: 'Payment', icon: FiDollarSign, href: '/sales/payment' },
    ],
  },

  // Parent that also has its own href (clickable parent)
  {
    label: 'User Settings',
    icon: GrUserSettings,
    href: '/usersettings',
    children: [
      {
        label: 'System Config',
        icon: FiDatabase,
        href: '/usersettings/systemsettings',
      },
      { label: 'Company', icon: FiBriefcase, href: '/usersettings/company' },
    ],
  },

  {
    label: 'Admin',
    icon: FiUserCheck,
    children: [{ label: 'Users', icon: FiUsers, href: '/admin/users' }],
  },
];
