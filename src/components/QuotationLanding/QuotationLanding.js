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

const ALL_COLUMNS = [
  {
    key: 'Guid',
    header: 'CODE',
    sortable: true,
    align: 'start',
    render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span>,
  },
  {
    key: 'QuotationNumber',
    header: 'QUOTATION NO.',
    sortable: true,
  },
  {
    key: 'Description',
    header: 'DESCRIPTION',
    sortable: true,
    render: (item) => <span>{item.Description}</span>,
    align: 'start',
  },
  {
    key: 'PurchaseType',
    header: 'TYPE',
    sortable: true,
    align: 'start',
  },
  {
    key: 'Date',
    header: 'DATE',
    sortable: true,
  },
  {
    key: 'ValidUntil',
    header: 'VALID',
    sortable: true,
    align: 'start',
  },
  {
    key: 'Status',
    header: 'STATUS',
    sortable: true,
    align: 'start',
    render: (item) => <StatusBadge status={item.Status} />,
  },
  {
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
            return s === 'APPROVED' || s === 'CANCELLED';
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
            return s === 'CANCELLED';
          },
        },
      ];

    return <DropdownAction item={item} items={items} />;
    },
  },
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
export default function QuotationLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Function to redirect to quotation form
  const redirectToQuotationForm = useCallback(() => {
    router.push('/purchase/quotationform');
  }, [router]);
  const [selectedColumns, setSelectedColumns] = useState([
    'Guid',
    'QuotationNumber',
    'Description',
    'PurchaseType',
    'Date',
    'ValidUntil',
    'Status',
    'Actions',
  ]);
  const [filter, setFilter] = useState({ supplierType: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Load data from service
  useEffect(() => {
    let mounted = true;
    const svc = new QuotationService();
    setLoading(true);
    svc
      .getAllQuotations()
      .then((res) => {
        if (!mounted) return;
        setItems(res || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err && err.message ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let filtered = items && Array.isArray(items) ? items : [];
    // Filter by supplierType (PurchaseType)
    if (filter.supplierType) {
      filtered = filtered.filter(
        (item) =>
          item.PurchaseType &&
          item.PurchaseType.toLowerCase().includes(filter.supplierType.toLowerCase())
      );
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
  }, [filter, searchTerm, items]);

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
      // navigate to a quotation detail page (replace with correct route if different)
      if (quotation?.Guid) {
        router.push(`/purchase/quotation/${quotation.Guid}`);
      }
    },
    [router]
  );

  const handleApprove = useCallback(
    (quotation) => {
      // optimistic local update (mock service)
      setItems((prev) =>
        prev.map((it) => (it.Guid === quotation.Guid ? { ...it, Status: 'Approved' } : it))
      );
    },
    []
  );

  const handleCancel = useCallback(
    (quotation) => {
      setItems((prev) =>
        prev.map((it) => (it.Guid === quotation.Guid ? { ...it, Status: 'Cancelled' } : it))
      );
    },
    []
  );

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
            key: 'supplierType',
            options: [
              { value: '', label: 'All' },
              { value: 'Inventory', label: 'Inventory' },
              { value: 'Service', label: 'Service' },
            ],
          }}
        />
      }>
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Quotations</h1>
          <SearchBar
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToQuotationForm}
            width="300px"
          />
        </div>
        {loading ? (
          <div className={styles.loading}>Loading quotations...</div>
        ) : error ? (
          <div className={styles.error}>Error loading quotations: {error}</div>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            showActions={false}
            emptyMessage="No quotations found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
