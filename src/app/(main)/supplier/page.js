'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar, DropdownAction } from '../../../components';
import DataTable from '../../../components/ui/DataTable/DataTable';
import styles from './page.module.scss';
import RightPanel from '../../../components/RightPanel/RightPanel';
import SupplierService from '../../../services/supplierService';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

// Data will be loaded from SupplierService

const ALL_COLUMNS = [
  {
    key: 'CompanyCode',
    header: 'CODE',
    sortable: true,
    align: 'start',
    render: (item) => (
      <span style={{ fontWeight: 'bold' }}>{item.CompanyCode}</span>
    ),
  },
  {
    key: 'Name',
    header: 'NAME',
    sortable: true,
  },
  {
    key: 'SupplierType',
    header: 'TYPE',
    sortable: true,
    render: (item) => <span>{item.SupplierType}</span>,
    align: 'start',
  },
  {
    key: 'Logo',
    header: 'LOGO',
    render: (item) =>
      item.Logo ? (
        <img
          src={item.Logo}
          alt="logo"
          style={{ width: 32, height: 32, display: 'block', margin: '0 auto' }}
        />
      ) : (
        ''
      ),
    align: 'start',
    sortable: false,
  },
  {
    key: 'Address',
    header: 'ADDRESS',
    sortable: true,
  },
  {
    key: 'Phone',
    header: 'PHONE',
    sortable: true,
    align: 'start',
  },
  {
    key: 'Fax',
    header: 'FAX',
    sortable: true,
    align: 'start',
  },
  {
    key: 'Email',
    header: 'EMAIL',
    sortable: true,
    render: (item) => <span>{item.Email}</span>,
  },
  {
    key: 'Website',
    header: 'WEBSITE',
    sortable: true,
    render: (item) => (
      <span style={{ fontSize: '0.95em' }}>{item.Website}</span>
    ),
  },
];

// --- Small Components ---
function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="156" label="Total Suppliers" change="+8" isPositive />
      <StatsCard number="142" label="Active Suppliers" change="+5" isPositive />
      <StatsCard
        number="₱2.4M"
        label="Total Value (YTD)"
        change="+12%"
        isPositive
      />
    </div>
  );
}

// ...existing code...

// --- Main Page ---
export default function SupplierPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState([
    'CompanyCode',
    'Name',
    'SupplierType',
    'Logo',
    'Address',
    'Phone',
    'Fax',
    'Email',
    'Website',
    'Actions',
  ]);
  // Add filter state
  const [filter, setFilter] = useState({ supplierType: '' });
  // Right panel collapsed state
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to redirect to quotation form
  const redirectToQuotationForm = useCallback(() => {
    router.push('/supplier/supplierform');
  }, [router]);

  // Memoize columns
  // columns will be computed after handlers are defined (see below)

  // Load suppliers from service
  useEffect(() => {
    let mounted = true;
    const svc = new SupplierService();
    setLoading(true);
    svc
      .getAllSuppliers()
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

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = items && Array.isArray(items) ? items : [];
    if (filter.supplierType && filter.supplierType !== '') {
      filtered = filtered.filter(
        (sup) => sup.SupplierType === filter.supplierType
      );
    }
    // basic search in Name and CompanyCode
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sup) =>
          (sup.Name && sup.Name.toLowerCase().includes(term)) ||
          (sup.CompanyCode && sup.CompanyCode.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [filter, items, searchTerm]);

  const sortedSuppliers = useMemo(() => {
    if (!sortConfig.key) return filteredSuppliers;
    const sorted = [...filteredSuppliers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [sortConfig, filteredSuppliers]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const handleRowClick = useCallback((supplier) => {
    console.log('Selected supplier:', supplier);
  }, []);

  const handleActionClick = useCallback((supplier) => {
    console.log('Action clicked for supplier:', supplier);
  }, []);

  const handleView = useCallback((supplier) => {
    if (supplier?.CompanyGuid) router.push(`/supplier/supplierform?id=${supplier.CompanyGuid}&mode=view`);
  }, [router]);

  const handleEdit = useCallback((supplier) => {
    if (supplier?.CompanyGuid) router.push(`/supplier/supplierform?id=${supplier.CompanyGuid}`);
  }, [router]);

  const handleDelete = useCallback((supplier) => {
    // optimistic local delete
    setItems((prev) => (prev || []).filter((it) => it.CompanyGuid !== supplier.CompanyGuid));
  }, []);

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
          const items = [
            { key: 'view', label: 'View', icon: <FiEye size={16} />, onClick: (it) => handleView(it) },
            { key: 'edit', label: 'Edit', icon: <FiEdit2 size={16} />, onClick: (it) => handleEdit(it) },
            { key: 'delete', label: 'Delete', destructive: true, icon: <FiTrash2 size={16} />, onClick: (it) => handleDelete(it) },
          ];
          return <DropdownAction item={item} items={items} />;
        },
      };
      return [...base, ACTION_COLUMN];
    }
    return base;
  }, [selectedColumns, handleView, handleEdit, handleDelete]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSearch = useCallback((value) => {
    console.log('Searching for:', value);
  }, []);

  const handleFilterClick = useCallback(() => {
    setIsRightPanelCollapsed(false);
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
            label: 'Supplier Type',
            key: 'supplierType',
            options: [
              { value: '', label: 'All' },
              { value: 'Local', label: 'Local' },
              { value: 'International', label: 'International' },
            ],
          }}
        />
      }>
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Suppliers</h1>
          <SearchBar
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            width="300px"
            showButton
            handleOnClick={redirectToQuotationForm}
          />
        </div>
        {loading ? (
          <div className={styles.loading}>Loading suppliers...</div>
        ) : error ? (
          <div className={styles.error}>Error loading suppliers: {error}</div>
        ) : (
          <DataTable
            data={sortedSuppliers}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            showActions={false}
            emptyMessage="No suppliers found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
