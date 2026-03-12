import { FiBarChart, FiBox, FiFileText, FiMessageSquare, FiUsers, FiSettings, FiArchive, FiPackage, FiLayers, FiTool, FiDatabase, FiList, FiGrid, FiUser, FiShoppingCart, FiTruck, FiFile, FiCreditCard, FiUserCheck } from 'react-icons/fi';

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
    label: 'Suppliers',
    icon: FiUser,
    href: '/suppliers',
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
    label: 'Purchase',
    icon: FiShoppingCart,
    children: [
      {
        label: 'Orders',
        icon: FiList,
        href: '/purchase/orders',
      },
      {
        label: 'Deliveries',
        icon: FiTruck,
        href: '/purchase/deliveries',
      },
      {
        label: 'Invoices',
        icon: FiFile,
        href: '/purchase/invoices',
      },
      {
        label: 'Payments',
        icon: FiCreditCard,
        href: '/purchase/payments',
      },
    ],
  },
  {
    label: 'Storage',
    icon: FiSettings,
    children: [
      {
        label: 'Warehouse',
        icon: FiDatabase,
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
    label: 'Materials',
    icon: FiPackage,
    children: [
      {
        label: 'Materials',
        icon: FiBox,
        href: '/materialsSettings/materials',
      },
        {
          label: 'Tools & Equipment',
          icon: FiTool,
          href: '/materialsSettings/tools',
        },
      {
        label: 'Assembly',
        icon: FiFileText,
        href: '/materialsSettings/assembly',
      },
    ],
  },
  {
    label: 'Inventory',
    icon: FiArchive,
    children: [
      {
        label: 'Material Inventory',
        icon: FiGrid,
        href: '/inventory/material-inventory',
      },
      {
        label: 'Tools Inventory',
        icon: FiList,
        href: '/inventory/tools-inventory',
      },
    ],
  },
  {
    label: 'Employees',
    icon: FiUserCheck,
    href: '/employees',
  },
  {
    label: 'Maintenance',
    icon: FiTool,
    href: '/maintenance',
  },
];
