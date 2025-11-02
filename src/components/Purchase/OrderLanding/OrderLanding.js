"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./OrderLanding.module.scss";
import OrderService from "../../../services/orderService";
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from "../..";
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

// --- Data & Configs ---

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

// Default service adapter at module scope to keep identity stable
const defaultServiceFactory = () => {
  return {
    subscribe: (cb) => OrderService.subscribe(cb),
    setStatus: ({ Guid, Status }) => {
      const svc = new OrderService();
      return svc.setOrderStatus({ Guid, Status });
    },
  };
};

export default function OrderLanding({ serviceFactory = null, formRoute = '/purchase/orderform', title = 'Orders', columns: overrideColumns = null, filterConfig = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Use a stable factory reference so effects don't re-run every render
  const svcFactory = React.useMemo(() => (serviceFactory || defaultServiceFactory), [serviceFactory]);

  // Function to redirect to order form
  const redirectToOrderForm = useCallback(() => {
    router.push(formRoute);
  }, [router, formRoute]);

  const cols = overrideColumns || ALL_COLUMNS;
  const defaultSelected = cols.map((c) => c.key).concat(['Actions']);
  const [selectedColumns, setSelectedColumns] = useState(defaultSelected);
  const effectiveFilterConfig = filterConfig || {
    label: 'Purchase Type',
    key: 'purchaseType',
    options: [
      { value: '', label: 'All' },
      { value: 'Inventory', label: 'Inventory' },
      { value: 'Service', label: 'Service' },
    ],
  };
  const [filter, setFilter] = useState({ [effectiveFilterConfig.key]: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  // items === null -> not loaded yet; [] -> loaded but empty
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // columns will be computed after handlers are defined
  let columns;

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    // Use only the items provided by the service. Default to [] so empty results show empty state.
    let data = Array.isArray(items) ? items : [];
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

  // Subscribe to service so landing reflects additions/updates in real-time
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const unsubscribe = svcFactory().subscribe((res) => {
      if (!mounted) return;
      setItems(res || []);
      setLoading(false);
    });
    return () => {
      mounted = false;
      try {
        unsubscribe && unsubscribe();
      } catch (e) {}
    };
  }, [svcFactory]);

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
      router.push(`${formRoute}?id=${order.Guid}`);
    }
  }, [router, formRoute]);

  const handleApprove = useCallback((order) => {
    try {
      svcFactory().setStatus({ Guid: order.Guid, Status: 'Approved' }).catch((e) => {
        console.error('Failed to approve order', e);
      });
    } catch (e) {
      setItems((prev) => prev.map((it) => (it.Guid === order.Guid ? { ...it, Status: 'Approved' } : it)));
    }
  }, [svcFactory]);

  const handleCancel = useCallback((order) => {
    try {
      svcFactory().setStatus({ Guid: order.Guid, Status: 'Cancelled' }).catch((e) => {
        console.error('Failed to cancel order', e);
      });
    } catch (e) {
      setItems((prev) => prev.map((it) => (it.Guid === order.Guid ? { ...it, Status: 'Cancelled' } : it)));
    }
  }, [svcFactory]);

  // Compute columns after handlers are available
  columns = useMemo(() => {
    const base = cols.filter((col) => selectedColumns.includes(col.key));
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
  }, [cols, selectedColumns, handleView, handleApprove, handleCancel]);

    return (
    <ThreeColumnLayout
      isRightPanelCollapsed={isRightPanelCollapsed}
      setIsRightPanelCollapsed={setIsRightPanelCollapsed}
      rightPanel={
        <RightPanel
          allColumns={cols}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          filter={filter}
          onFilterChange={setFilter}
          filterConfig={effectiveFilterConfig}
        />
      }
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
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
