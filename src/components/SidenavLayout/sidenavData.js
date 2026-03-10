import { FiBarChart, FiBox, FiFileText, FiMessageSquare, FiUsers, FiSettings, FiArchive, FiLayers } from 'react-icons/fi';

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
    label: 'Storage Settings',
    icon: FiSettings,
    children: [
      {
        label: 'Warehouse',
        icon: FiArchive,
        href: '/storagesettings/warehouse',
      },
      {
        label: 'Rack',
        icon: FiLayers,
        href: '/storagesettings/rack',
      },
    ],
  },
  {
    label: 'Material Inventory',
    icon: FiBox,
    href: '/materialinventory',
  },
];
