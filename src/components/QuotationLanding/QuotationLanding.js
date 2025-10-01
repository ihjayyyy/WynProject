  'use client';

import { useRouter } from 'next/navigation';

import ThreeColumnLayout from '../ThreeColumnLayout/ThreeColumnLayout';
import RightPanel from '../RightPanel/RightPanel';
import React, { useState, useCallback, useMemo } from 'react';
import styles from './QuotationLanding.module.scss';
import { StatsCard, SearchBar, DataTable } from '../../components';

// --- Data & Configs ---
const TABLE_DATA = [
  {
    Guid: 'ID123',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'sup-1001-xxxx-yyyy-zzzz11112222',
    QuotationNumber: 'QTN-2025-0001',
    Date: '2025-10-01',
    Description: 'Haircut and grooming supplies',
    PurchaseType: 'Inventory',
    ValidUntil: '2025-10-15',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: 'Maria Santos',
    Status: 'Pending',
    SupplierContactPerson: 'Jose Ramirez',
    SupplierContactNumber: '+63 917 123 4567',
  },
  {
    Guid: 'ID456',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'sup-1002-aaaa-bbbb-cccc22223333',
    QuotationNumber: 'QTN-2025-0002',
    Date: '2025-10-01',
    Description: 'Massage',
    PurchaseType: 'Service',
    ValidUntil: '2025-10-10',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: 'Maria Santos',
    Status: 'Approved',
    SupplierContactPerson: 'Ana Cruz',
    SupplierContactNumber: '+63 918 654 3210',
  },
  {
    Guid: 'ID789',
    CompanyGuid: 'c0mp-0002-eeee-ffff-gggghhhh2222',
    SupplierGuid: 'sup-1003-pppp-qqqq-rrrr33334444',
    QuotationNumber: 'QTN-2025-0003',
    Date: '2025-10-01',
    Description: 'Extra Service',
    PurchaseType: 'Service',
    ValidUntil: '2025-11-01',
    PreparedBy: 'Carlo Mendoza',
    ApprovedBy: 'Andrea Lopez',
    Status: 'Rejected',
    SupplierContactPerson: 'Mark Villanueva',
    SupplierContactNumber: '+63 920 888 7777',
  },
];

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
  ]);
  const [filter, setFilter] = useState({ supplierType: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Filtered data based on filter and search
  const filteredData = useMemo(() => {
    let data = TABLE_DATA;
    // Filter by supplierType (PurchaseType)
    if (filter.supplierType) {
      data = data.filter(
        (item) =>
          item.PurchaseType &&
          item.PurchaseType.toLowerCase().includes(filter.supplierType.toLowerCase())
      );
    }
    // Filter by search term (searches in Description and QuotationNumber)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(term)) ||
          (item.QuotationNumber && item.QuotationNumber.toLowerCase().includes(term))
      );
    }
    return data;
  }, [filter, searchTerm]);

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
        <DataTable
          data={filteredData}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No suppliers found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
