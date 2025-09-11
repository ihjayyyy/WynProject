import { 
  FiUsers, 
  FiSettings, 
  FiDatabase, 
  FiFileText,
  FiCreditCard,
  FiTrendingUp,
  FiBarChart,
} from 'react-icons/fi';

export const sidenavItems = [
  // Item with children
  {
    label: 'Supplier',
    icon: FiUsers,
    href: '/supplier',
  },
  
  // Simple item without children
  {
    label: 'Dashboard',
    icon: FiBarChart,
    href: '/dashboard'
  },
  
  // Another parent with children
  {
    label: 'Financial Reports',
    icon: FiFileText,
    children: [
      { label: 'Income Statement', icon: FiTrendingUp, href: '/reports/income' },
      { label: 'Balance Sheet', icon: FiDatabase, href: '/reports/balance' },
      { label: 'Cash Flow', icon: FiCreditCard, href: '/reports/cashflow' }
    ]
  },
  
  // Parent that also has its own href (clickable parent)
  {
    label: 'Settings',
    icon: FiSettings,
    href: '/settings',
    children: [
      { label: 'User Management', icon: FiUsers, href: '/settings/users' },
      { label: 'System Config', icon: FiDatabase, href: '/settings/system' }
    ]
  }
];