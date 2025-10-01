"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo } from "react";
import styles from "./InvoiceLanding.module.scss";
import { StatsCard, SearchBar, DataTable } from "../../components";

// --- Data & Configs ---
const TABLE_DATA = [
  {
    Guid: "INV-001",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1001-xxxx-yyyy-zzzz11112222",
    DeliveryGuid: "DEL-2025-0001",
    OrderGuid: "ORD-001",
    PurchaseOrderNumber: "PO-2025-0001",
    PurchaseInvoiceNumber: "INV-2025-0001",
    Date: "2025-10-01",
    Description: "Bulk order for grooming supplies",
    PurchaseType: "Inventory",
    PreparedBy: "Juan Dela Cruz",
    ApprovedBy: "Maria Santos",
    Status: "draft",
    SupplierPO: "SUP-PO-001",
    DueDate: "2025-10-30",
    InvoiceAmount: 15000.0,
  },
  {
    Guid: "INV-002",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1002-aaaa-bbbb-cccc22223333",
    DeliveryGuid: "DEL-2025-0002",
    OrderGuid: "ORD-002",
    PurchaseOrderNumber: "PO-2025-0002",
    PurchaseInvoiceNumber: "INV-2025-0002",
    Date: "2025-10-02",
    Description: "Massage service order",
    PurchaseType: "Service",
    PreparedBy: "Carlo Mendoza",
    ApprovedBy: "Andrea Lopez",
    Status: "approved",
    SupplierPO: "SUP-PO-002",
    DueDate: "2025-10-31",
    InvoiceAmount: 5000.0,
  },
  {
    Guid: "INV-003",
    CompanyGuid: "c0mp-0002-eeee-ffff-gggghhhh2222",
    SupplierGuid: "sup-1003-pppp-qqqq-rrrr33334444",
    DeliveryGuid: "DEL-2025-0003",
    OrderGuid: "ORD-003",
    PurchaseOrderNumber: "PO-2025-0003",
    PurchaseInvoiceNumber: "INV-2025-0003",
    Date: "2025-10-03",
    Description: "Extra service order",
    PurchaseType: "Service",
    PreparedBy: "Maria Santos",
    ApprovedBy: "Juan Dela Cruz",
    Status: "closed",
    SupplierPO: "SUP-PO-003",
    DueDate: "2025-11-15",
    InvoiceAmount: 8000.0,
  },
];

const ALL_COLUMNS = [
  {
    key: "Guid",
    header: "INVOICE CODE",
    sortable: true,
    align: "start",
    render: (item) => <span style={{ fontWeight: "bold" }}>{item.Guid}</span>,
  },
  {
    key: "PurchaseInvoiceNumber",
    header: "REF NO.",
    sortable: true,
    render: (item) => <span>{item.PurchaseInvoiceNumber}</span>,
  },
  {
    key: "PurchaseOrderNumber",
    header: "PO NUMBER",
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
    key: "DueDate",
    header: "DUE DATE",
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
    key: "InvoiceAmount",
    header: "INVOICE AMOUNT",
    sortable: true,
    render: (item) => <span>₱{item.InvoiceAmount.toLocaleString()}</span>,
    align: "end",
  },
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="12" label="Total Invoices" change="+3" isPositive />
      <StatsCard number="4" label="Draft" change="+1" isPositive />
      <StatsCard number="5" label="Approved" change="+1" isPositive />
      <StatsCard number="3" label="Closed" change="0" isPositive={false} />
    </div>
  );
}

export default function InvoiceLanding() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to invoice form
  const redirectToInvoiceForm = useCallback(() => {
    router.push("/purchase/invoiceform");
  }, [router]);

  const [selectedColumns, setSelectedColumns] = useState([
    "Guid",
    "PurchaseInvoiceNumber",
    "PurchaseOrderNumber",
    "Description",
    "PurchaseType",
    "Date",
    "InvoiceAmount",
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
    // Filter by search term (searches in Description and PurchaseInvoiceNumber)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.PurchaseInvoiceNumber && item.PurchaseInvoiceNumber.toLowerCase().includes(term))
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
  const handleRowClick = useCallback((invoice) => {
    console.log("Selected invoice:", invoice);
  }, []);

  const handleActionClick = useCallback((invoice) => {
    console.log("Action clicked for invoice:", invoice);
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
          <h1 className={styles.title}>Invoices</h1>
          <SearchBar
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToInvoiceForm}
            width="300px"
          />
        </div>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No invoices found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
