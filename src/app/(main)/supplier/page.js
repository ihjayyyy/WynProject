'use client';

import React, { useState, useMemo, useCallback } from 'react';

import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import SupplierTable from '../../../components/SupplierTable/SupplierTable';
import styles from './page.module.scss';


// --- Data & Configs ---
const SUPPLIERS = [
  {
    CompanyGuid: 'COMP001',
    CompanyCode: 'ACME',
    Name: 'Acme Corporation',
    Logo: '',
    Address: '123 Ayala Ave, Makati City',
    Phone: '+63 2 8123 4567',
    Fax: '+63 2 8123 4568',
    Email: 'john.smith@acme.com',
    Website: 'www.acme.com',
    TaxNumber: 'TX123456',
    ContactPerson: 'John Smith',
    ContactNumber: '+63 917 111 2222',
    PaymentTerms: 30,
    Status: 'ACTIVE'
  },
  {
    CompanyGuid: 'COMP002',
    CompanyCode: 'GLOB',
    Name: 'Global Supplies Ltd',
    Logo: '',
    Address: '456 Ortigas Ave, Pasig City',
    Phone: '+63 2 8987 6543',
    Fax: '+63 2 8987 6544',
    Email: 'sarah.j@globalsupplies.com',
    Website: 'www.globalsupplies.com',
    TaxNumber: 'TX654321',
    ContactPerson: 'Sarah Johnson',
    ContactNumber: '+63 918 333 4444',
    PaymentTerms: 45,
    Status: 'ACTIVE'
  },
  {
    CompanyGuid: 'COMP003',
    CompanyCode: 'TECH',
    Name: 'Tech Solutions Inc',
    Logo: '',
    Address: '789 IT Park, Cebu City',
    Phone: '+63 32 456 7890',
    Fax: '+63 32 456 7891',
    Email: 'mbrown@techsolutions.com',
    Website: 'www.techsolutions.com',
    TaxNumber: 'TX789123',
    ContactPerson: 'Michael Brown',
    ContactNumber: '+63 919 555 6666',
    PaymentTerms: 60,
    Status: 'PENDING'
  }
];

const ALL_COLUMNS = [
  {
    key: 'CompanyCode',
    header: 'COMPANY CODE',
    sortable: true,
    align: 'center',
    render: (item) => <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{item.CompanyCode}</span>
  },
  {
    key: 'Name',
    header: 'NAME',
    sortable: true
  },
  {
    key: 'Logo',
    header: 'LOGO',
    render: (item) => item.Logo ? <img src={item.Logo} alt="logo" style={{ width: 32, height: 32, display: 'block', margin: '0 auto' }} /> : '',
    align: 'center',
    sortable: false
  },
  {
    key: 'Address',
    header: 'ADDRESS',
    sortable: true
  },
  {
    key: 'Phone',
    header: 'PHONE',
    sortable: true,
    align: 'center'
  },
  {
    key: 'Fax',
    header: 'FAX',
    sortable: true,
    align: 'center'
  },
  {
    key: 'Email',
    header: 'EMAIL',
    sortable: true,
    render: (item) => <span style={{ fontSize: '0.95em' }}>{item.Email}</span>
  },
  {
    key: 'Website',
    header: 'WEBSITE',
    sortable: true,
    render: (item) => <span style={{ fontSize: '0.95em' }}>{item.Website}</span>
  }
];

// --- Small Components ---
function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="156" label="Total Suppliers" change="+8" isPositive />
      <StatsCard number="142" label="Active Suppliers" change="+5" isPositive />
      <StatsCard number="₱2.4M" label="Total Value (YTD)" change="+12%" isPositive />
    </div>
  );
}

function RightPanel({ allColumns, selectedColumns, setSelectedColumns }) {
  return (
    <div style={{ padding: '2rem', minWidth: 220 }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1em' }}>Show Columns</h3>
      <form>
        {allColumns.map(col => (
          <div key={col.key} style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedColumns(prev => [...prev, col.key]);
                  } else {
                    setSelectedColumns(prev => prev.filter(k => k !== col.key));
                  }
                }}
              />
              {col.header}
            </label>
          </div>
        ))}
      </form>
    </div>
  );
}

// --- Main Page ---
export default function SupplierPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState([
    'CompanyCode', 'Name', 'Logo', 'Address', 'Phone', 'Fax', 'Email', 'Website'
  ]);

  // Memoize columns
  const columns = useMemo(
    () => ALL_COLUMNS.filter(col => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Sorting logic
  const sortedSuppliers = useMemo(() => {
    if (!sortConfig.key) return SUPPLIERS;
    const sorted = [...SUPPLIERS].sort((a, b) => {
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
  }, [sortConfig]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig(prev =>
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

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleSearch = useCallback((value) => {
    console.log('Searching for:', value);
  }, []);

  const handleFilterClick = useCallback(() => {
    console.log('Filter clicked');
  }, []);

  return (
    <ThreeColumnLayout
      rightPanel={
        <RightPanel
          allColumns={ALL_COLUMNS}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
        />
      }
    >
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
          />
        </div>
        <SupplierTable
          suppliers={sortedSuppliers}
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No suppliers found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
