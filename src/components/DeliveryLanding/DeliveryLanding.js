
"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./DeliveryLanding.module.scss";
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from "../../components";
import { FiEye } from 'react-icons/fi';
import DeliveryService from "../../services/deliveryService";

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

export default function DeliveryLanding() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to delivery form
  const redirectToDeliveryForm = useCallback(() => {
    router.push("/purchase/deliveryform");
  }, [router]);

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
        router.push(`/purchase/deliveryform?id=${delivery.Guid}`);
      }
    },
    [router]
  );

  const columns = useMemo(() => {
    const base = ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key));
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
  }, [selectedColumns, handleView]);

  // deliveries state loaded from service (start empty until fetched)
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // instantiate service once
  const deliveryService = useMemo(() => new DeliveryService(), []);

  // load deliveries from service on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await deliveryService.getAllDeliveries();
        if (mounted && Array.isArray(result)) setDeliveries(result);
      } catch (err) {
        console.error("Failed to load deliveries:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [deliveryService]);

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let data = deliveries;
    // Filter by purchaseType
    if (filter.purchaseType) {
      data = data.filter(
        (item) =>
          item.PurchaseType &&
          item.PurchaseType.toLowerCase().includes(filter.purchaseType.toLowerCase())
      );
    }
    // Filter by search term (searches in Description and PurchaseDeliveryNumber)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.PurchaseDeliveryNumber && item.PurchaseDeliveryNumber.toLowerCase().includes(term))
      );
    }
    return data;
  }, [filter, searchTerm, deliveries]);

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
          <h1 className={styles.title}>Deliveries</h1>
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
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          showActions={false}
          emptyMessage="No deliveries found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
