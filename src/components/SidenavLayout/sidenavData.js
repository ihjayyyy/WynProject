import {
  FiUsers,
  FiSettings,
  FiDatabase,
  FiFileText,
  FiBarChart,
  FiShoppingCart,
  FiFile,
  FiClipboard,
  FiDollarSign,
  FiBarChart2,
  FiShoppingBag, // Added for Purchasing
  FiCreditCard, // Added for Sales
} from "react-icons/fi";

export const sidenavItems = [
  // Dashboard
  {
    label: "Dashboard",
    icon: FiBarChart,
    href: "/dashboard",
  },

  // Item with children
  {
    label: "Supplier",
    icon: FiUsers,
    href: "/supplier",
  },

  // Parent with children

  // Purchasing Module
  {
    label: "Purchasing",
    icon: FiShoppingBag, // changed to shopping bag for business context
    children: [
      { label: "Quotation", icon: FiFileText, href: "/purchase/quotation" },
      { label: "Purchase Order", icon: FiClipboard, href: "/purchase/order" },
      {
        label: "Invoice",
        icon: FiFile,
        href: "/purchase/invoice",
      },
      { label: "Payment", icon: FiDollarSign, href: "/purchase/payment" },
    ],
  },

  // Sales Module
  {
    label: "Sales",
    icon: FiCreditCard, // changed to credit card for business context
    children: [
      { label: "Quotation", icon: FiFileText, href: "/sales/quotation" },
      { label: "Sales Order", icon: FiClipboard, href: "/sales/order" },
      {
        label: "Invoice",
        icon: FiFile,
        href: "/sales/invoice",
      },
      { label: "Payment", icon: FiDollarSign, href: "/sales/payment" },
    ],
  },

  // Parent that also has its own href (clickable parent)
  {
    label: "Settings",
    icon: FiSettings,
    href: "/settings",
    children: [
      { label: "User Management", icon: FiUsers, href: "/settings/users" },
      { label: "System Config", icon: FiDatabase, href: "/settings/system" },
    ],
  },
];
