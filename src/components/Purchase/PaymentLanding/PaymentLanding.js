
"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo } from "react";
import styles from "./PaymentLanding.module.scss";
import { StatsCard, SearchBar, DataTable } from "../..";

// --- Data & Configs ---
const TABLE_DATA = [
  {
    Guid: "PAY-001",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1001-xxxx-yyyy-zzzz11112222",
    SupplierOR: "OR-2025-0001",
    TotalAmount: 15000.0,
    CheckNumber: "CHK-0001",
    Description: "Payment for grooming supplies",
    PaymentDate: "2025-10-05",
    Status: "prepared",
    PreparedBy: "Juan Dela Cruz",
    ApprovedBy: "Maria Santos",
  },
  {
    Guid: "PAY-002",
    CompanyGuid: "c0mp-0001-aaaa-bbbb-ccccdddd1111",
    SupplierGuid: "sup-1002-aaaa-bbbb-cccc22223333",
    SupplierOR: "OR-2025-0002",
    TotalAmount: 5000.0,
    CheckNumber: "CHK-0002",
    Description: "Payment for massage service order",
    PaymentDate: "2025-10-06",
    Status: "paid",
    PreparedBy: "Carlo Mendoza",
    ApprovedBy: "Andrea Lopez",
  },
  {
    Guid: "PAY-003",
    CompanyGuid: "c0mp-0002-eeee-ffff-gggghhhh2222",
    SupplierGuid: "sup-1003-pppp-qqqq-rrrr33334444",
    SupplierOR: "OR-2025-0003",
    TotalAmount: 8000.0,
    CheckNumber: "CHK-0003",
    Description: "Payment for extra service order",
    PaymentDate: "2025-10-07",
    Status: "prepared",
    PreparedBy: "Maria Santos",
    ApprovedBy: "Juan Dela Cruz",
  },
];

const ALL_COLUMNS = [
  {
    key: "Guid",
    header: "PAYMENT CODE",
    sortable: true,
    align: "start",
    render: (item) => <span style={{ fontWeight: "bold" }}>{item.Guid}</span>,
  },
  {
    key: "SupplierOR",
    header: "SUPPLIER OR",
    sortable: true,
    render: (item) => <span>{item.SupplierOR}</span>,
  },
  {
    key: "CheckNumber",
    header: "CHECK NUMBER",
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
    key: "PaymentDate",
    header: "PAYMENT DATE",
    sortable: true,
  },
  {
    key: "TotalAmount",
    header: "AMOUNT",
    sortable: true,
    render: (item) => <span>₱{item.TotalAmount.toLocaleString()}</span>,
    align: "end",
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
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="8" label="Total Payments" change="+2" isPositive />
      <StatsCard number="5" label="Prepared" change="+1" isPositive />
      <StatsCard number="3" label="Paid" change="+1" isPositive />
    </div>
  );
}

export default function PaymentLanding() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to payment form
  const redirectToPaymentForm = useCallback(() => {
    router.push("/purchase/paymentform");
  }, [router]);

  const [selectedColumns, setSelectedColumns] = useState([
    "Guid",
    "SupplierOR",
    "CheckNumber",
    "Description",
    "PaymentDate",
    "TotalAmount",
  ]);
  const [filter, setFilter] = useState({ status: "" });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let data = TABLE_DATA;
    // Filter by status
    if (filter.status) {
      data = data.filter(
        (item) =>
          item.Status &&
          item.Status.toLowerCase().includes(filter.status.toLowerCase())
      );
    }
    // Filter by search term (searches in Description and SupplierOR)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.SupplierOR && item.SupplierOR.toLowerCase().includes(term))
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
  const handleRowClick = useCallback((payment) => {
    console.log("Selected payment:", payment);
  }, []);

  const handleActionClick = useCallback((payment) => {
    console.log("Action clicked for payment:", payment);
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
            label: 'Status',
            key: 'status',
            options: [
              { value: '', label: 'All' },
              { value: 'prepared', label: 'Prepared' },
              { value: 'paid', label: 'Paid' },
            ],
          }}
        />
      }
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Payments</h1>
          <SearchBar
            placeholder="Search payments..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToPaymentForm}
            width="300px"
          />
        </div>
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No payments found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
