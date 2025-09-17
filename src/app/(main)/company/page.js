'use client';

import React, { useState, useMemo, useCallback } from 'react';
import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import DataTable from '../../../components/ui/DataTable/DataTable';
import styles from './page.module.scss';
import RightPanel from './RightPanel';

// --- Data & Configs ---
const COMPANIES = [
  {
    Guid: 'COMP001',
    CompanyCode: 'ACME',
    Name: 'Acme Corporation',
    Logo: '',
    Address: '123 Ayala Ave, Makati City',
    Phone: '+63 2 8123 4567',
    Fax: '+63 2 8123 4568',
    Email: 'john.smith@acme.com',
    Website: 'www.acme.com',
    TaxNumber: 'TX123456',
  },
  {
    Guid: 'COMP002',
    CompanyCode: 'GLOB',
    Name: 'Global Supplies Ltd',
    Logo: '',
    Address: '456 Ortigas Ave, Pasig City',
    Phone: '+63 2 8987 6543',
    Fax: '+63 2 8987 6544',
    Email: 'sarah.j@globalsupplies.com',
    Website: 'www.globalsupplies.com',
    TaxNumber: 'TX654321',
  },
];

const ALL_COLUMNS = [
  {
    key: 'CompanyCode',
    header: 'COMPANY CODE',
    sortable: true,
    align: 'start',
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
    align: 'start',
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
    align: 'start'
  },
  {
    key: 'Fax',
    header: 'FAX',
    sortable: true,
    align: 'start'
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
  },
  {
    key: 'TaxNumber',
    header: 'TAX NUMBER',
    sortable: true
  }
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number={COMPANIES.length.toString()} label="Total Companies" change="+0" isPositive />
      <StatsCard number={COMPANIES.length.toString()} label="Active Companies" change="+0" isPositive />
      <StatsCard number="0" label="Inactive Companies" change="0" isPositive={false} />
    </div>
  );
}

export default function CompanyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState([
    'CompanyCode', 'Name', 'Logo', 'Address', 'Phone', 'Fax', 'Email', 'Website', 'TaxNumber'
  ]);
  const [filter, setFilter] = useState({ companyCode: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter(col => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  const filteredCompanies = useMemo(() => {
    let filtered = COMPANIES;
    if (filter.companyCode) {
      filtered = filtered.filter(c =>
        c.CompanyCode.toLowerCase().includes(filter.companyCode.toLowerCase())
      );
    }
    return filtered;
  }, [filter]);

  const sortedCompanies = useMemo(() => {
    if (!sortConfig.key) return filteredCompanies;
    const sorted = [...filteredCompanies].sort((a, b) => {
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
  }, [sortConfig, filteredCompanies]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const handleRowClick = useCallback((company) => {
    console.log('Selected company:', company);
  }, []);

  const handleActionClick = useCallback((company) => {
    console.log('Action clicked for company:', company);
  }, []);

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
        />
      }
    >
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Companies</h1>
          <SearchBar
            placeholder="Search companies..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            width="300px"
          />
        </div>
        <DataTable
          data={sortedCompanies}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No companies found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
