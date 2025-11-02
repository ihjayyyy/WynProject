"use client";

import { useRouter } from "next/navigation";
import ThreeColumnLayout from "../../ThreeColumnLayout/ThreeColumnLayout";
import RightPanel from "../../RightPanel/RightPanel";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import styles from "./InvoiceLanding.module.scss";
import { StatsCard, SearchBar, DataTable, DropdownAction } from "../..";
import StatusBadge from "../../ui/StatusBadge/StatusBadge";
import ConfirmModal from "../../ui/ConfirmModal/ConfirmModal";
import { FiEye, FiCheck, FiX } from 'react-icons/fi';
import PurchaseInvoiceService from '../../../services/purchaseInvoiceService.js';

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

export default function InvoiceLanding({ serviceFactory = null, formRoute = '/purchase/invoiceform', title = 'Invoices', columns: overrideColumns = null, filterConfig = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Function to redirect to invoice form (uses provided formRoute)
  const redirectToInvoiceForm = useCallback(() => {
    router.push(formRoute);
  }, [router, formRoute]);

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
        router.push(`${formRoute}?id=${invoice.Guid}`);
      }
    },
    [router, formRoute]
  );

  // Use service-provided items and apply filtering/search
  const filteredData = useMemo(() => {
    let data = Array.isArray(items) ? items : [];
    // Filter by purchaseType
    if (filter.purchaseType) {
      data = data.filter(
        (item) => {
          const typeVal = (item.PurchaseType || item.SalesType || '');
          return typeVal && typeVal.toLowerCase().includes(filter.purchaseType.toLowerCase());
        }
      );
    }
    // Filter by search term (searches in Description and PurchaseInvoiceNumber)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          ((item.PurchaseInvoiceNumber || item.SalesInvoiceNumber || '').toLowerCase().includes(term))
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

  // Allow caller to provide a serviceFactory (SalesInvoiceLanding passes one). Use provided or default.
  const svcFactory = React.useMemo(() => (serviceFactory || defaultServiceFactory), [serviceFactory]);

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

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({ open: false, type: null, invoice: null });

  const openConfirm = useCallback((type, invoice) => {
    setConfirmState({ open: true, type, invoice });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState({ open: false, type: null, invoice: null });
  }, []);

  // Action executors (no UI confirmations here)
  const doApprove = useCallback(async (invoice) => {
    if (!invoice || !invoice.Guid) return;
    try {
      await svcFactory().setStatus({ Guid: invoice.Guid, Status: 'approved', ApprovedBy: 'Admin' });
      console.log('Invoice approved by Admin', invoice?.Guid);
    } catch (e) {
      console.error('Approve failed', e);
      // no UI alert - operation failed
    }
  }, [svcFactory]);

  // Close (finalize) invoice
  const doClose = useCallback(async (invoice) => {
    if (!invoice || !invoice.Guid) return;
    try {
      await svcFactory().setStatus({ Guid: invoice.Guid, Status: 'closed' });
      console.log('Invoice closed', invoice?.Guid);
    } catch (e) {
      console.error('Close failed', e);
      // no UI alert - operation failed
    }
  }, [svcFactory]);

  // Cancel action (set invoice to 'cancelled')
  const doCancel = useCallback(async (invoice) => {
    if (!invoice || !invoice.Guid) return;
    try {
      await svcFactory().setStatus({ Guid: invoice.Guid, Status: 'cancelled' });
      console.log('Invoice cancelled', invoice?.Guid);
    } catch (e) {
      console.error('Cancel failed', e);
      // no UI alert - operation failed
    }
  }, [svcFactory]);

  // Called when user confirms in modal
  const handleConfirm = useCallback(async () => {
    const { type, invoice } = confirmState;
    if (!type || !invoice) {
      closeConfirm();
      return;
    }
    try {
      if (type === 'approve') await doApprove(invoice);
      else if (type === 'close') await doClose(invoice);
      else if (type === 'cancel') await doCancel(invoice);
    } finally {
      closeConfirm();
    }
  }, [confirmState, closeConfirm, doApprove, doClose, doCancel]);

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
            const status = (item?.Status || '').toLowerCase();

            // Visibility rules (per request):
            // - draft: show view, approve, cancel, close
            // - approved: show view, close, cancel
            // - cancelled: show view, close
            // For safety: hide approve when not draft; hide cancel unless draft or approved; hide close when already closed
            const itemsActions = [
              { key: 'view', label: 'View', icon: <FiEye size={16} />, onClick: (it) => handleView(it) },
              {
                key: 'approve',
                label: 'Approve',
                icon: <FiCheck size={14} />,
                onClick: (it) => openConfirm('approve', it),
                hidden: (it) => (it?.Status || '').toLowerCase() !== 'draft',
              },
              {
                key: 'cancel',
                label: 'Cancel',
                icon: <FiX size={14} />,
                destructive: true,
                onClick: (it) => openConfirm('cancel', it),
                hidden: (it) => !['draft', 'approved'].includes((it?.Status || '').toLowerCase()),
              },
              {
                key: 'close',
                label: 'Close',
                icon: <FiCheck size={14} />,
                onClick: (it) => openConfirm('close', it),
                hidden: (it) => (it?.Status || '').toLowerCase() === 'closed',
              },
            ];

            return <DropdownAction item={item} items={itemsActions} />;
          },
        };
        return [...base, ACTION_COLUMN];
      }
    return base;
  }, [selectedColumns, handleView, openConfirm, overrideColumns]);

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
          filterConfig={
            filterConfig || {
              label: 'Purchase Type',
              key: 'purchaseType',
              options: [
                { value: '', label: 'All' },
                { value: 'Inventory', label: 'Inventory' },
                { value: 'Service', label: 'Service' },
              ],
            }
          }
        />
      }
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
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
        {/* Confirmation modal for status actions */}
          <ConfirmModal
          open={confirmState.open}
          title={
            confirmState.type === 'approve'
              ? 'Approve Invoice'
              : confirmState.type === 'close'
              ? 'Close Invoice'
              : confirmState.type === 'cancel'
              ? 'Cancel Invoice'
              : ''
          }
          message={
            confirmState.type === 'approve'
              ? `Approve invoice ${confirmState.invoice?.PurchaseInvoiceNumber || confirmState.invoice?.SalesInvoiceNumber || confirmState.invoice?.Guid}?`
              : confirmState.type === 'close'
              ? `Close invoice ${confirmState.invoice?.PurchaseInvoiceNumber || confirmState.invoice?.SalesInvoiceNumber || confirmState.invoice?.Guid}? This will mark the invoice as final.`
              : confirmState.type === 'cancel'
              ? `Cancel invoice ${confirmState.invoice?.PurchaseInvoiceNumber || confirmState.invoice?.SalesInvoiceNumber || confirmState.invoice?.Guid}?`
              : ''
          }
          confirmText={
            confirmState.type === 'approve'
              ? 'Approve'
              : confirmState.type === 'close'
              ? 'Close'
              : confirmState.type === 'cancel'
              ? 'Cancel'
              : 'Confirm'
          }
          cancelText="Cancel"
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      </div>
    </ThreeColumnLayout>
  );
}
