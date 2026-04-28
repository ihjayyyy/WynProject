import { FiBarChart, FiBox, FiFileText, FiMessageSquare, FiUsers, FiSettings, FiArchive, FiPackage, FiLayers, FiTool, FiDatabase, FiList, FiGrid, FiUser, FiShoppingCart, FiTruck, FiFile, FiCreditCard, FiUserCheck, FiBriefcase, FiClipboard, FiDollarSign, FiFolder } from 'react-icons/fi';

export const sidenavItems = [
  {
    label: 'Dashboard',
    icon: FiBarChart,
    href: '/dashboard',
    name: 'Dashboard',
  },
  {
    label: 'Customers',
    icon: FiUsers,
    href: '/customers',
    name: 'Customers',
  },
  {
    label: 'Suppliers',
    icon: FiUser,
    href: '/suppliers',
    name: 'Suppliers',
  },
  {
    label: 'Inquiry',
    icon: FiMessageSquare,
    href: '/inquiry',
    name: 'Inquiry',
  },
  {
    label: 'Projects',
    icon: FiLayers,
    name: 'Projects',
    children: [
      {
        label: 'Proposal',
        icon: FiFileText,
        href: '/projects/proposal',
        name: 'Projects.Proposal',
      },
      {
        label: 'Projects',
        icon: FiBriefcase,
        href: '/projects/project',
        name: 'Projects.Projects',
      },
      {
        label: 'Billings',
        icon: FiDollarSign,
        href: '/projects/billings',
        name: 'Projects.Billings',
      },
      {
        label: 'Collections',
        icon: FiFolder,
        href: '/projects/collections',
        name: 'Projects.Collections',
      },
    ],
  },
  {
    label: 'Purchase',
    icon: FiShoppingCart,
    name: 'Purchase',
    children: [
      {
        label: 'Request',
        icon: FiList,
        href: '/purchase/requests',
        name: 'Purchase.Requests',

      },
      {
        label: 'Orders',
        icon: FiList,
        href: '/purchase/orders',
        name: 'Purchase.Orders',

      },
      {
        label: 'Deliveries',
        icon: FiTruck,
        href: '/purchase/deliveries',
        name: 'Purchase.Deliveries',
      },
      {
        label: 'Invoices',
        icon: FiFile,
        href: '/purchase/invoices',
        name: 'Purchase.Invoices',
      },
      {
        label: 'Payments',
        icon: FiCreditCard,
        href: '/purchase/payments',
        name: 'Purchase.Payments',
      },
    ],
  },
  {label: 'Finance',
   icon: FiCreditCard,
   name: 'Finance',
   children: [
      {
        label: 'Project Billings',
        icon: FiDatabase,
        href: '/finance/billings',
        name: 'Finance.Billings',
      },
      {
        label: 'Purchase Billing',
        icon: FiFile,
        href: '/finance/invoice',
        name: 'Finance.Invoices',
      },
      {
        label: 'Collections',
        icon: FiFolder,
        href: '/finance/collections',
        name: 'Finance.Collections',
      },
      {
        label: 'Payment',
        icon: FiCreditCard,
        href: '/finance/payment',
        name: 'Finance.Payments',
      },

    ]
  },
  {
    label: 'Storage',
    icon: FiSettings,
    name: 'Storage',
    children: [
      {
        label: 'Warehouse',
        icon: FiDatabase,
        href: '/storagesettings/warehouse',
        name: 'Storage.Warehouse',
      },
      {
        label: 'Rack',
        icon: FiLayers,
        href: '/storagesettings/rack',
        name: 'Storage.Rack',
      },
    ],
  },
  {
    label: 'Materials',
    icon: FiPackage,
    name: 'Materials',
    children: [
      {
        label: 'Materials',
        icon: FiBox,
        href: '/materialsSettings/materials',
        name: 'Materials.Materials',
      },
        {
          label: 'Tools & Equipment',
          icon: FiTool,
          href: '/materialsSettings/tools',
          name: 'Materials.ToolsEquipment',
        },
      {
        label: 'Assembly',
        icon: FiFileText,
        href: '/materialsSettings/assembly',
        name: 'Materials.Assembly',
      },
    ],
  },
  {
    label: 'Inventory',
    icon: FiArchive,
    name: 'Inventory',
    children: [
      {
        label: 'Material Inventory',
        icon: FiGrid,
        href: '/inventory/material-inventory',
        name: 'Inventory.MaterialInventory',
      },
      {
        label: 'Tools Inventory',
        icon: FiList,
        href: '/inventory/tools-inventory',
        name: 'Inventory.ToolsInventory',
      },
      {
        label: 'Material Requests',
        icon: FiList,
        href: '/inventory/material-request',
        name: 'Inventory.MaterialRequests',
      },
    ],
  },
  {
    label: 'Employees',
    icon: FiUserCheck,
    href: '/employees',
    name: 'Employees.Employees',
  },
  {
    label: 'Staff',
    icon: FiUsers,
    href: '/staff',
    name: 'Staff',
  },
  {
    label: 'Maintenance',
    icon: FiTool,
    name: 'Maintenance',
    children: [
      {
        label: 'Unit of Measure',
        icon: FiList,
        href: '/maintainance/UOM',
        name: 'Maintenance.UOM',
      },
      {
        label: 'UOM Conversion',
        icon: FiList,
        href: '/maintainance/UOMConvertion',
        name: 'Maintenance.UOMConversion',
      },
      // ...add more maintenance items here if needed
    ],
  },
];

