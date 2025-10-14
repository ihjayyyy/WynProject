'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import DataTable from '../../../components/ui/DataTable/DataTable';
import styles from './page.module.scss';
import RightPanel from '../../../components/RightPanel/RightPanel';
import { InventoryService } from '@/services/inventoryService';

// --- Data & Configs ---
const ALL_COLUMNS = [
  {
    key: 'ProductCode',
    header: 'CODE',
    sortable: true,
    align: 'start',
    render: (item) => (
      <span style={{ fontWeight: 'bold' }}>{item.ProductCode}</span>
    ),
  },
  {
    key: 'Name',
    header: 'NAME',
    sortable: true,
  },
  {
    key: 'ProductType',
    header: 'TYPE',
    sortable: true,
    render: (item) => <span>{item.ProductType}</span>,
    align: 'start',
  },
  {
    key: 'Description',
    header: 'DESCRIPTION',
    render: (item) => (
      <span style={{ fontSize: '0.95em' }}>{item.Description}</span>
    ),
    align: 'start',
    sortable: false,
  },
  // Keep other columns minimal for product inventory mock
];

// --- Small Components ---
function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard
        number="156"
        label="Total Inventories"
        change="+8"
        isPositive
      />
      <StatsCard
        number="142"
        label="Active Inventories"
        change="+5"
        isPositive
      />
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
export default function InventoryPage() {
  //service
  // Instantiate the service once per component lifecycle
  const inventoryService = useMemo(() => new InventoryService(), []);
  const router = useRouter();
  const redirectToInventoryForm = useCallback(() => {
    router.push('/inventory/inventoryform');
  }, [router]);

  const [inventories, setInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState([
    'ProductCode',
    'Name',
    'ProductType',
    'Description',
  ]);
  // Add filter state (filter by ProductType from mock)
  const [filter, setFilter] = useState({ productType: '' });
  // Right panel collapsed state
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // Memoize columns
  const columns = useMemo(
    () => ALL_COLUMNS.filter((col) => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  // Filter and sort inventories
  const filteredInventories = useMemo(() => {
    let filtered = inventories || [];
    if (filter.productType && filter.productType !== '') {
      filtered = filtered.filter(
        (item) => item.ProductType === filter.productType
      );
    }
    return filtered;
  }, [filter, inventories]);

  const sortedInventories = useMemo(() => {
    if (!sortConfig.key) return filteredInventories;
    const sorted = [...filteredInventories].sort((a, b) => {
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
  }, [sortConfig, filteredInventories]);

  //Fetch
  const getAllInventories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getAllInventories();
      if (data) setInventories(data || []);
      console.log('Fetched Inventories (raw):', data);
    } catch (err) {
      console.error('Error fetching inventories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [inventoryService]);

  useEffect(() => {
    // Fetch inventories using supplierService
    getAllInventories();
  }, [getAllInventories]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const handleRowClick = useCallback((inventory) => {
    console.log('Selected inventory:', inventory);
  }, []);

  const handleActionClick = useCallback((inventory) => {
    console.log('Action clicked for inventory:', inventory);
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
          filterConfig={{
            label: 'Product Type',
            key: 'productType',
            options: [
              { value: '', label: 'All' },
              { value: 'Raw Material', label: 'Raw Material' },
              { value: 'Finished Goods', label: 'Finished Goods' },
              { value: 'Consumable', label: 'Consumable' },
            ],
          }}
        />
      }>
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Inventories</h1>
          <SearchBar
            placeholder="Search inventories..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            showButton
            handleOnClick={redirectToInventoryForm}
            width="300px"
          />
        </div>
        {isLoading ? (
          <div style={{ padding: 20 }}>Loading inventories...</div>
        ) : (
          <DataTable
            data={sortedInventories}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            emptyMessage="No inventories found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
