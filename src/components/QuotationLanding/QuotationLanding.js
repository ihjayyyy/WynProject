  'use client';

import { useRouter } from 'next/navigation';

import ThreeColumnLayout from '../ThreeColumnLayout/ThreeColumnLayout';
import RightPanel from '../RightPanel/RightPanel';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import QuotationService from '../../services/quotationService';
import styles from './QuotationLanding.module.scss';
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from '../../components';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

// Data will be loaded from QuotationService

const DEFAULT_COLUMNS = [
  { key: 'Guid', header: 'CODE', sortable: true, align: 'start', render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span> },
  { key: 'QuotationNumber', header: 'QUOTATION NO.', sortable: true },
  { key: 'Description', header: 'DESCRIPTION', sortable: true, render: (item) => <span>{item.Description}</span>, align: 'start' },
  // NOTE: the type column key can be overridden by passing `columns` prop or customize it in the wrapper
  { key: 'PurchaseType', header: 'TYPE', sortable: true, align: 'start' },
  { key: 'Date', header: 'DATE', sortable: true },
  { key: 'ValidUntil', header: 'VALID', sortable: true, align: 'start' },
  { key: 'Status', header: 'STATUS', sortable: true, align: 'start', render: (item) => <StatusBadge status={item.Status} /> },
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="15" label="Total Quotation" change="+8" isPositive />
      <StatsCard number="7" label="Valid" change="+8" isPositive />
      <StatsCard number="8" label="Expired" change="-8" isPositive={false} />
    </div>
  );
}
// Default service adapter at module scope to keep identity stable
const defaultServiceFactory = () => {
  return {
    subscribe: (cb) => QuotationService.subscribe(cb),
    setStatus: ({ Guid, Status }) => {
      const svc = new QuotationService();
      return svc.setQuotationStatus({ Guid, Status });
    },
  };
};
export default function QuotationLanding({ serviceFactory = null, formRoute = '/purchase/quotationform', title = 'Quotations', columns: overrideColumns = null, filterConfig = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Use a stable factory reference so effects don't re-run every render
  const svcFactory = React.useMemo(() => (serviceFactory || defaultServiceFactory), [serviceFactory]);

  // Function to redirect to quotation form
  const redirectToQuotationForm = useCallback(() => {
    router.push(formRoute);
  }, [router, formRoute]);

  const cols = overrideColumns || DEFAULT_COLUMNS;
  const defaultSelected = cols.map((c) => c.key).concat(['Actions']);
  const [selectedColumns, setSelectedColumns] = useState(defaultSelected);
  const [filter, setFilter] = useState({ supplierType: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const effectiveFilterConfig = filterConfig || {
    label: 'Purchase Type',
    key: 'supplierType',
    options: [
      { value: '', label: 'All' },
      { value: 'Inventory', label: 'Inventory' },
      { value: 'Service', label: 'Service' },
    ],
  };

  // Subscribe to service so landing reflects additions/updates in real-time (mock)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // subscribe returns an unsubscribe function
    const unsubscribe = svcFactory().subscribe((res) => {
      if (!mounted) return;
      setItems(res || []);
      setLoading(false);
    });
    return () => {
      mounted = false;
      try {
        unsubscribe && unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [svcFactory]);

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let filtered = items && Array.isArray(items) ? items : [];
    // Filter by supplierType (key in filterConfig)
    if (filter[effectiveFilterConfig.key]) {
      const f = filter[effectiveFilterConfig.key];
      filtered = filtered.filter((item) => {
        // find a matching property on the item (PurchaseType / SalesType)
        const typeVal = item.PurchaseType || item.SalesType || '';
        return typeVal && typeVal.toLowerCase().includes(f.toLowerCase());
      });
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.QuotationNumber && item.QuotationNumber.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [filter, searchTerm, items, effectiveFilterConfig.key]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSearch = useCallback((value) => {
    console.log('Searching for:', value);
  }, []);

  const handleFilterClick = useCallback(() => {
    setIsRightPanelCollapsed(false);
  }, []);

  //Handlers
  const handleRowClick = useCallback((quotation) => {
    console.log('Selected quotation:', quotation);
  }, []);

  const handleActionClick = useCallback((quotation) => {
    console.log('Action clicked for supplier:', quotation);
  }, []);

  // Action handlers used by DropdownAction
  const handleView = useCallback(
    (quotation) => {
      // navigate to the quotation form and open the requested quotation for viewing/editing
      if (quotation?.Guid) {
        router.push(`${formRoute}?id=${quotation.Guid}`);
      }
    },
    [router, formRoute]
  );

  const handleApprove = useCallback(
    (quotation) => {
      // call provided serviceFactory adapter to set status
      try {
        svcFactory().setStatus({ Guid: quotation.Guid, Status: 'Approved' }).catch((e) => {
          console.error('Failed to approve quotation', e);
        });
      } catch (e) {
        // fallback to optimistic local update
        setItems((prev) => prev.map((it) => (it.Guid === quotation.Guid ? { ...it, Status: 'Approved' } : it)));
      }
    },
    [svcFactory]
  );

  const handleCancel = useCallback(
    (quotation) => {
      try {
        svcFactory().setStatus({ Guid: quotation.Guid, Status: 'Cancelled' }).catch((e) => {
          console.error('Failed to cancel quotation', e);
        });
      } catch (e) {
        setItems((prev) => prev.map((it) => (it.Guid === quotation.Guid ? { ...it, Status: 'Cancelled' } : it)));
      }
    },
    [svcFactory]
  );

  // Compute columns after handlers are available
  const columns = useMemo(() => {
    const base = cols.filter((col) => selectedColumns.includes(col.key));
    // Actions column created here so it has access to component handlers
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
            { key: 'approve', label: 'Approve', icon: <FiCheck size={16} />, onClick: (it) => handleApprove(it), disabled: (it) => String(it?.Status || '').toUpperCase() === 'APPROVED', hidden: (it) => { const s = String(it?.Status || '').toUpperCase(); return s === 'APPROVED' || s === 'CANCELLED' || s === 'ORDERED'; } },
            { key: 'cancel', label: 'Cancel', icon: <FiX size={16} />, destructive: true, onClick: (it) => handleCancel(it), disabled: (it) => String(it?.Status || '').toUpperCase() === 'CANCELLED', hidden: (it) => { const s = String(it?.Status || '').toUpperCase(); return s === 'CANCELLED' || s === 'ORDERED'; } },
          ];

          return <DropdownAction item={item} items={itemsActions} />;
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
      rightPanel={<RightPanel allColumns={cols} selectedColumns={selectedColumns} setSelectedColumns={setSelectedColumns} filter={filter} onFilterChange={setFilter} filterConfig={effectiveFilterConfig} />}
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          <SearchBar placeholder="Search quotations..." value={searchTerm} onChange={handleSearchChange} onSearch={handleSearch} onFilterClick={handleFilterClick} showButton handleOnClick={redirectToQuotationForm} width="300px" />
        </div>
        {loading ? <div className={styles.loading}>Loading quotations...</div> : error ? <div className={styles.error}>Error loading quotations: {error}</div> : (
          <DataTable data={filteredData} columns={columns} onRowClick={handleRowClick} onActionClick={handleActionClick} showActions={false} emptyMessage="No quotations found" />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
