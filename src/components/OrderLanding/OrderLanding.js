"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./OrderLanding.module.scss";
import OrderService from "../../services/orderService";
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from "../../components";
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

// --- Data & Configs ---
const TABLE_DATA = [
  {
    Guid: "ORD-001",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1001-xxxx-yyyy-zzzz11112222",
    QuotationGuid: "QTN-2025-0001",
    QuotationNumber: "QTN-2025-0001",
    PurchaseOrderNumber: "PO-2025-0001",
    Date: "2025-10-01",
    Description: "Bulk order for grooming supplies",
    PurchaseType: "Inventory",
    ValidUntil: "2025-10-15",
    PreparedBy: "Juan Dela Cruz",
    ApprovedBy: "Maria Santos",
    Status: "draft",
    SupplierPO: "SUP-PO-001",
    OrderAmount: 15000.0,
  },
  {
    Guid: "ORD-002",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1002-aaaa-bbbb-cccc22223333",
    QuotationGuid: "QTN-2025-0002",
    QuotationNumber: "QTN-2025-0002",
    PurchaseOrderNumber: "PO-2025-0002",
    Date: "2025-10-02",
    Description: "Massage service order",
    PurchaseType: "Service",
    ValidUntil: "2025-10-20",
    PreparedBy: "Carlo Mendoza",
    ApprovedBy: "Andrea Lopez",
    Status: "approved",
    SupplierPO: "SUP-PO-002",
    OrderAmount: 5000.0,
  },
  {
    Guid: "ORD-003",
    CompanyGuid: "c0mp-0002-eeee-ffff-gggghhhh2222",
    SupplierGuid: "sup-1003-pppp-qqqq-rrrr33334444",
    QuotationGuid: "QTN-2025-0003",
    QuotationNumber: "QTN-2025-0003",
    PurchaseOrderNumber: "PO-2025-0003",
    Date: "2025-10-03",
    Description: "Extra service order",
    PurchaseType: "Service",
    ValidUntil: "2025-11-01",
    PreparedBy: "Maria Santos",
    ApprovedBy: "Juan Dela Cruz",
    Status: "closed",
    SupplierPO: "SUP-PO-003",
    OrderAmount: 8000.0,
  },
];

const ALL_COLUMNS = [
  {
    key: "Guid",
    header: "CODE",
    sortable: true,
    align: "start",
    render: (item) => <span style={{ fontWeight: "bold" }}>{item.Guid}</span>,
  },
  {
    key: "PurchaseOrderNumber",
    header: "REF NO.",
    sortable: true,
    render: (item) => <span>{item.PurchaseOrderNumber}</span>,
  },
  {
    key: "QuotationNumber",
    header: "QUOTATION NO.",
    sortable: true,
  },
  {
    key: "Description",
    header: "DESCRIPTION",
    sortable: true,
    render: (item) => <span>{item.Description}</span>,
    align: "start",
  },
  {
    key: "PurchaseType",
    header: "TYPE",
    sortable: true,
    align: "start",
  },
  {
    key: "Date",
    header: "DATE",
    sortable: true,
  },
  {
    key: "ValidUntil",
    header: "VALID UNTIL",
    sortable: true,
    align: "start",
  },
  {
    key: "PreparedBy",
    header: "PREPARED BY",
    sortable: true,
  },
  {
    key: "ApprovedBy",
    header: "APPROVED BY",
    sortable: true,
  },
  {
    key: "Status",
    header: "STATUS",
    sortable: true,
    render: (item) => <StatusBadge status={item.Status} />,
  },
  {
    key: "SupplierPO",
    header: "SUPPLIER PO",
    sortable: true,
  },
  {
    key: "OrderAmount",
    header: "AMOUNT",
    sortable: true,
    render: (item) => <span>₱{item.OrderAmount.toLocaleString()}</span>,
    align: "end",
  },
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="10" label="Total Orders" change="+2" isPositive />
      <StatsCard number="3" label="Draft" change="+1" isPositive />
      <StatsCard number="5" label="Approved" change="+1" isPositive />
      <StatsCard number="2" label="Closed" change="0" isPositive={false} />
    </div>
  );
}

export default function OrderLanding() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to order form
  const redirectToOrderForm = useCallback(() => {
    router.push("/purchase/orderform");
  }, [router]);

  const [selectedColumns, setSelectedColumns] = useState([
    "Guid",
    "PurchaseOrderNumber",
    "QuotationNumber",
    "Description",
    "Status",
    "PurchaseType",
    "OrderAmount",
    "Actions",
  ]);
  const [filter, setFilter] = useState({ purchaseType: "" });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  // items === null -> not loaded yet; [] -> loaded but empty
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // columns will be computed after handlers are defined
  let columns;

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    // If items is a non-empty array use it, otherwise fall back to TABLE_DATA
    let data = items && Array.isArray(items) && items.length > 0 ? items : TABLE_DATA;
    // Filter by purchaseType
    if (filter.purchaseType) {
      data = data.filter(
        (item) =>
          item.PurchaseType &&
          item.PurchaseType.toLowerCase().includes(filter.purchaseType.toLowerCase())
      );
    }
    // Filter by search term (searches in Description and PurchaseOrderNumber)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.PurchaseOrderNumber && item.PurchaseOrderNumber.toLowerCase().includes(term))
      );
    }
    return data;
  }, [filter, searchTerm, items]);

  // SearchBar handlers
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSearch = useCallback((value) => {
    console.log("Searching for:", value);
  }, []);

  // Subscribe to OrderService - set items to array when service returns
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const unsubscribe = OrderService.subscribe((res) => {
      if (!mounted) return;
      setItems(Array.isArray(res) ? res : []);
      setLoading(false);
    });
    return () => {
      mounted = false;
      try {
        unsubscribe && unsubscribe();
      } catch (e) {}
    };
  }, []);

  const handleFilterClick = useCallback(() => {
    setIsRightPanelCollapsed(false);
  }, []);

  // Handlers
  const handleRowClick = useCallback((order) => {
    console.log("Selected order:", order);
  }, []);

  const handleActionClick = useCallback((order) => {
    console.log("Action clicked for order:", order);
  }, []);

  const handleView = useCallback((order) => {
    if (order?.Guid) {
      router.push(`/purchase/orderform?id=${order.Guid}`);
    }
  }, [router]);

  const handleApprove = useCallback((order) => {
    try {
      const svc = new OrderService();
      svc.setOrderStatus({ Guid: order.Guid, Status: 'Approved' }).catch((e) => {
        console.error('Failed to approve order', e);
      });
    } catch (e) {
      setItems((prev) => prev.map((it) => (it.Guid === order.Guid ? { ...it, Status: 'Approved' } : it)));
    }
  }, []);

  const handleCancel = useCallback((order) => {
    try {
      const svc = new OrderService();
      svc.setOrderStatus({ Guid: order.Guid, Status: 'Cancelled' }).catch((e) => {
        console.error('Failed to cancel order', e);
      });
    } catch (e) {
      setItems((prev) => prev.map((it) => (it.Guid === order.Guid ? { ...it, Status: 'Cancelled' } : it)));
    }
  }, []);

  // Compute columns after handlers are available
  columns = useMemo(() => {
    const base = ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key));
    if (selectedColumns.includes('Actions')) {
      const ACTION_COLUMN = {
        key: 'Actions',
        header: '',
        sortable: false,
        align: 'end',
        width: '48px',
        render: (item) => {
          const items = [
            {
              key: 'view',
              label: 'View',
              icon: <FiEye size={16} />,
              onClick: (it) => handleView(it),
            },
            {
              key: 'approve',
              label: 'Approve',
              icon: <FiCheck size={16} />,
              onClick: (it) => handleApprove(it),
              disabled: (it) => String(it?.Status || '').toUpperCase() === 'APPROVED',
              hidden: (it) => {
                const s = String(it?.Status || '').toUpperCase();
                return s === 'APPROVED' || s === 'CANCELLED' || s === 'ORDERED';
              },
            },
            {
              key: 'cancel',
              label: 'Cancel',
              icon: <FiX size={16} />,
              destructive: true,
              onClick: (it) => handleCancel(it),
              disabled: (it) => String(it?.Status || '').toUpperCase() === 'CANCELLED',
              hidden: (it) => {
                const s = String(it?.Status || '').toUpperCase();
                return s === 'CANCELLED' || s === 'ORDERED';
              },
            },
          ];

          return <DropdownAction item={item} items={items} />;
        },
      };
      return [...base, ACTION_COLUMN];
    }
    return base;
  }, [selectedColumns, handleView, handleApprove, handleCancel]);

  return (
    <ThreeColumnLayout
      isRightPanelCollapsed={isRightPanelCollapsed}
      setIsRightPanelCollapsed={setIsRightPanelCollapsed}
      rightPanel={
        <RightPanel
          allColumns={ALL_COLUMNS}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          filter={filter}
          onFilterChange={setFilter}
          filterConfig={{
            label: 'Purchase Type',
            key: 'purchaseType',
            options: [
              { value: '', label: 'All' },
              { value: 'Inventory', label: 'Inventory' },
              { value: 'Service', label: 'Service' },
            ],
          }}
        />
      }
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Orders</h1>
          <SearchBar
            placeholder="Search orders..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToOrderForm}
            width="300px"
          />
        </div>
        {loading ? (
          <div className={styles.loading}>Loading orders...</div>
        ) : error ? (
          <div className={styles.error}>Error loading orders: {String(error)}</div>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            showActions={false}
            emptyMessage="No orders found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
