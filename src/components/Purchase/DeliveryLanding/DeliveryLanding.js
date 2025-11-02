
"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./DeliveryLanding.module.scss";
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from "../..";
import { FiEye } from 'react-icons/fi';
import DeliveryService from "../../../services/deliveryService";

// Data & configs are provided by the DeliveryService

const ALL_COLUMNS = [
  {
    key: "Guid",
    header: "DELIVERY CODE",
    sortable: true,
    align: "start",
    render: (item) => <span style={{ fontWeight: "bold" }}>{item.Guid}</span>,
  },
  {
    key: "PurchaseDeliveryNumber",
    header: "REF NO.",
    sortable: true,
    render: (item) => <span>{item.PurchaseDeliveryNumber}</span>,
  },
  {
    key: "OrderGuid",
    header: "ORDER NO.",
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
    key: "PreparedBy",
    header: "PREPARED BY",
    sortable: true,
  },
  {
    key: "AcceptedBy",
    header: "ACCEPTED BY",
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
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="8" label="Total Deliveries" change="+2" isPositive />
      <StatsCard number="3" label="Prepared" change="+1" isPositive />
      <StatsCard number="2" label="Partial" change="0" isPositive={false} />
      <StatsCard number="3" label="Delivered" change="+1" isPositive />
    </div>
  );
}

export default function DeliveryLanding({ serviceFactory = null, formRoute = '/purchase/deliveryform', title = 'Deliveries', columns: overrideColumns = null, filterConfig = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to delivery form
  const redirectToDeliveryForm = useCallback(() => {
    router.push(formRoute);
  }, [router, formRoute]);

  const [selectedColumns, setSelectedColumns] = useState([
    "Guid",
    "PurchaseDeliveryNumber",
    "OrderGuid",
    "Description",
    "PurchaseType",
    "Date",
    "Status",
    "Actions",
  ]);
  const [filter, setFilter] = useState({ purchaseType: "" });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // compute columns and append an Actions column when selected
  const handleView = useCallback(
    (delivery) => {
      if (delivery?.Guid) {
        router.push(`${formRoute}?id=${delivery.Guid}`);
      }
    },
    [router, formRoute]
  );

  const columns = useMemo(() => {
    const cols = overrideColumns || ALL_COLUMNS;
    const base = cols.filter((col) => selectedColumns.includes(col.key));
    if (selectedColumns.includes('Actions')) {
      const ACTION_COLUMN = {
        key: 'Actions',
        header: '',
        sortable: false,
        align: 'end',
        width: '48px',
        render: (item) => {
          const itemsActions = [
            { key: 'view', label: 'View', icon: <FiEye size={16} />, onClick: (it) => handleView(it) },
          ];

          return <DropdownAction item={item} items={itemsActions} />;
        },
      };
      return [...base, ACTION_COLUMN];
    }
    return base;
  }, [selectedColumns, handleView, overrideColumns]);

  // items state loaded from service (start empty until fetched)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default service adapter at module scope to keep identity stable
  const defaultServiceFactory = () => {
    return {
      subscribe: (cb) => DeliveryService.subscribe(cb),
      setStatus: ({ Guid, Status }) => {
        const svc = new DeliveryService();
        return svc.setDeliveryStatus({ Guid, Status });
      },
    };
  };

  // Use a stable factory reference so effects don't re-run every render
  const svcFactory = React.useMemo(() => (serviceFactory || defaultServiceFactory), [serviceFactory]);

  const effectiveFilterConfig = filterConfig || {
    label: 'Purchase Type',
    key: 'purchaseType',
    options: [
      { value: '', label: 'All' },
      { value: 'Inventory', label: 'Inventory' },
      { value: 'Service', label: 'Service' },
    ],
  };

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

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    // Use only the items provided by the service. Default to [] so empty results show empty state.
    let data = Array.isArray(items) ? items : [];
    // Filter by purchaseType (also accept SalesType for sales deliveries)
    if (filter.purchaseType) {
      data = data.filter((item) => {
        const typeVal = (item.PurchaseType || item.SalesType || '');
        return typeVal && typeVal.toLowerCase().includes(filter.purchaseType.toLowerCase());
      });
    }
    // Filter by search term (searches in Description and delivery number fields)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((item) => {
        const descMatch = item.Description && item.Description.toLowerCase().includes(term);
        const numberVal = (item.PurchaseDeliveryNumber || item.SalesDeliveryNumber || '');
        const numMatch = numberVal && numberVal.toLowerCase().includes(term);
        return descMatch || numMatch;
      });
    }
    return data;
  }, [filter, searchTerm, items]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSearch = useCallback((value) => {
    console.log("Searching for:", value);
  }, []);

  const handleFilterClick = useCallback(() => {
    setIsRightPanelCollapsed(false);
  }, []);

  //Handlers
  const handleRowClick = useCallback((delivery) => {
    console.log("Selected delivery:", delivery);
  }, []);

  const handleActionClick = useCallback((delivery) => {
    console.log("Action clicked for delivery:", delivery);
  }, []);

  return (
    <ThreeColumnLayout
      isRightPanelCollapsed={isRightPanelCollapsed}
      setIsRightPanelCollapsed={setIsRightPanelCollapsed}
      rightPanel={
        <RightPanel
          allColumns={overrideColumns || ALL_COLUMNS}
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
            placeholder="Search deliveries..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToDeliveryForm}
            width="300px"
          />
        </div>
        {loading ? (
          <div className={styles.loading}>Loading deliveries...</div>
        ) : error ? (
          <div className={styles.error}>Error loading deliveries: {String(error)}</div>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            showActions={false}
            emptyMessage="No deliveries found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
