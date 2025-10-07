'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';

import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import DataTable from '../../../components/ui/DataTable/DataTable';
import styles from './page.module.scss';
import RightPanel from '../../../components/RightPanel/RightPanel';
import { ServiceService } from '@/services/serviceService';

// --- Data & Configs ---
const ALL_COLUMNS = [
  {
    key: 'ServiceCode',
    header: 'CODE',
    sortable: true,
    align: 'start',
    render: (item) => (
      <span style={{ fontWeight: 'bold' }}>{item.ServiceCode}</span>
    ),
  },
  {
    key: 'Name',
    header: 'NAME',
    sortable: true,
  },
  {
    key: 'ServiceType',
    header: 'TYPE',
    sortable: true,
    render: (item) => <span>{item.ServiceType}</span>,
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
];

// --- Small Components ---
function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="156" label="Total Services" change="+8" isPositive />
      <StatsCard number="142" label="Active Services" change="+5" isPositive />
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
export default function ServicePage() {
  //service
  // Instantiate the service once per component lifecycle
  const serviceService = useMemo(() => new ServiceService(), []);

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState([
    'ServiceCode',
    'Name',
    'ServiceType',
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

  // Filter and sort services
  const filteredServices = useMemo(() => {
    let filtered = services || [];
    if (filter.serviceType && filter.serviceType !== '') {
      filtered = filtered.filter(
        (item) => item.ServiceType === filter.serviceType
      );
    }
    return filtered;
  }, [filter, services]);

  const sortedServices = useMemo(() => {
    if (!sortConfig.key) return filteredServices;
    const sorted = [...filteredServices].sort((a, b) => {
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
  }, [sortConfig, filteredServices]);

  //Fetch
  const getAllServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await serviceService.getAllServices();
      if (data) setServices(data || []);
      console.log('Fetched Services (raw):', data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceService]);

  useEffect(() => {
    // Fetch inventories using supplierService
    getAllServices();
  }, [getAllServices]);

  // Handlers
  const handleSort = useCallback((key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const handleRowClick = useCallback((service) => {
    console.log('Selected service:', service);
  }, []);

  const handleActionClick = useCallback((service) => {
    console.log('Action clicked for service:', service);
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
            label: 'Service Type',
            key: 'serviceType',
            options: [
              { value: '', label: 'All' },
              { value: 'Maintenance', label: 'Maintenance' },
              { value: 'Installation', label: 'Installation' },
              { value: 'Cleaning', label: 'Cleaning' },
            ],
          }}
        />
      }>
      <div className={styles.container}>
        <StatsSection />
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Services</h1>
          <SearchBar
            placeholder="Search services..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            width="300px"
          />
        </div>
        {isLoading ? (
          <div style={{ padding: 20 }}>Loading services...</div>
        ) : (
          <DataTable
            data={sortedServices}
            columns={columns}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
            emptyMessage="No services found"
          />
        )}
      </div>
    </ThreeColumnLayout>
  );
}
