import { FiBarChart, FiBox, FiFileText, FiMessageSquare, FiUsers } from 'react-icons/fi';

export const sidenavItems = [
  {
    label: 'Dashboard',
    icon: FiBarChart,
    href: '/dashboard',
  },
  {
    label: 'Customers',
    icon: FiUsers,
    href: '/customers',
  },
  {
    label: 'Inquiry',
    icon: FiMessageSquare,
    href: '/inquiry',
  },
  {
    label: 'Proposal',
    icon: FiFileText,
    href: '/proposal',
  },
  {
    label: 'Material Inventory',
    icon: FiBox,
    href: '/materialinventory',
  },
];
