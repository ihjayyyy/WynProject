"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./InvoiceLanding.module.scss";
import { StatsCard, SearchBar, DataTable, DropdownAction } from "../../components";
import StatusBadge from "../ui/StatusBadge/StatusBadge";
import { FiEye } from 'react-icons/fi';
import PurchaseInvoiceService from '../../services/purchaseInvoiceService.js';

const ALL_COLUMNS = [
  {
    key: "Guid",
    header: "CODE",
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
    render: (item) => <StatusBadge status={item.Status} />,
  },
  {
    key: "SupplierPO",
    header: "SUPPLIER PO",
    sortable: true,
  },
  {
    key: "InvoiceAmount",
    header: "AMOUNT",
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
    "Status",
    "Actions",
  ]);
  const [filter, setFilter] = useState({ purchaseType: "" });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // items state loaded from service
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // compute columns and append an Actions column when selected
  const handleView = useCallback(
    (invoice) => {
      if (invoice?.Guid) {
        router.push(`/purchase/invoiceform?id=${invoice.Guid}`);
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

  // Use service-provided items and apply filtering/search
  const filteredData = useMemo(() => {
    let data = Array.isArray(items) ? items : [];
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

  // Default service adapter at module scope to keep identity stable
  const defaultServiceFactory = () => {
    return {
      subscribe: (cb) => PurchaseInvoiceService.subscribe(cb),
      setStatus: ({ Guid, Status, ApprovedBy }) => {
        const svc = new PurchaseInvoiceService();
        return svc.setInvoiceStatus({ Guid, Status, ApprovedBy });
      },
    };
  };

  const svcFactory = React.useMemo(() => defaultServiceFactory, []);

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
        {loading ? (
          <div className={styles.loading}>Loading invoices...</div>
        ) : error ? (
          <div className={styles.error}>Error loading invoices: {String(error)}</div>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            showActions={false}
            emptyMessage="No invoices found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
