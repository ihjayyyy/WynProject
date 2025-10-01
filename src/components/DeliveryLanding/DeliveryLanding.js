
"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "./RightPanel";
import React, { useState, useCallback, useMemo } from "react";
import styles from "./DeliveryLanding.module.scss";
import { StatsCard, SearchBar, DataTable } from "../../components";

// --- Data & Configs ---
const TABLE_DATA = [
  {
    Guid: "DEL-001",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1001-xxxx-yyyy-zzzz11112222",
    OrderGuid: "ORD-001",
    PurchaseDeliveryNumber: "DEL-2025-0001",
    Date: "2025-10-01",
    Description: "Bulk delivery for grooming supplies",
    PurchaseType: "Inventory",
    PreparedBy: "Juan Dela Cruz",
    AcceptedBy: "Maria Santos",
    Status: "prepared",
    SupplierPO: "SUP-PO-001",
  },
  {
    Guid: "DEL-002",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1002-aaaa-bbbb-cccc22223333",
    OrderGuid: "ORD-002",
    PurchaseDeliveryNumber: "DEL-2025-0002",
    Date: "2025-10-02",
    Description: "Massage service delivery",
    PurchaseType: "Service",
    PreparedBy: "Carlo Mendoza",
    AcceptedBy: "Andrea Lopez",
    Status: "partial",
    SupplierPO: "SUP-PO-002",
  },
  {
    Guid: "DEL-003",
    CompanyGuid: "c0mp-0002-eeee-ffff-gggghhhh2222",
    SupplierGuid: "sup-1003-pppp-qqqq-rrrr33334444",
    OrderGuid: "ORD-003",
    PurchaseDeliveryNumber: "DEL-2025-0003",
    Date: "2025-10-03",
    Description: "Extra service delivery",
    PurchaseType: "Service",
    PreparedBy: "Maria Santos",
    AcceptedBy: "Juan Dela Cruz",
    Status: "delivered",
    SupplierPO: "SUP-PO-003",
  },
];

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
    render: (item) => <span style={{ textTransform: "capitalize" }}>{item.Status}</span>,
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
  ]);
  const [filter, setFilter] = useState({ purchaseType: "" });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let data = TABLE_DATA;
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
  }, [filter, searchTerm]);

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
          emptyMessage="No deliveries found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
