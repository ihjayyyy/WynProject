"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "./RightPanel";
import React, { useState, useCallback, useMemo } from "react";
import styles from "./OrderLanding.module.scss";
import { StatsCard, SearchBar, DataTable } from "../../components";

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
    header: "ORDER CODE",
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
    render: (item) => <span style={{ textTransform: "capitalize" }}>{item.Status}</span>,
  },
  {
    key: "SupplierPO",
    header: "SUPPLIER PO",
    sortable: true,
  },
  {
    key: "OrderAmount",
    header: "ORDER AMOUNT",
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
    "PurchaseType",
    "Date",
    "OrderAmount",
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
  const handleRowClick = useCallback((order) => {
    console.log("Selected order:", order);
  }, []);

  const handleActionClick = useCallback((order) => {
    console.log("Action clicked for order:", order);
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
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No orders found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
