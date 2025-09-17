'use client';

import React, { useState, useMemo, useCallback } from 'react';
import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import DataTable from '../../../components/ui/DataTable/DataTable';
import styles from './page.module.scss';
import RightPanel from './RightPanel';

// --- Data & Configs ---
const USERS = [
  {
    Guid: 'USR001',
    Username: 'jdoe',
    Firstname: 'John',
    Middlename: 'A.',
    Lastname: 'Doe',
    Phone: '+63 912 345 6789',
    Email: 'jdoe@email.com',
    Photo: '',
  },
  {
    Guid: 'USR002',
    Username: 'asmith',
    Firstname: 'Alice',
    Middlename: 'B.',
    Lastname: 'Smith',
    Phone: '+63 923 456 7890',
    Email: 'asmith@email.com',
    Photo: '',
  },
  {
    Guid: 'USR003',
    Username: 'bchan',
    Firstname: 'Bob',
    Middlename: '',
    Lastname: 'Chan',
    Phone: '+63 934 567 8901',
    Email: 'bchan@email.com',
    Photo: '',
  }
];

const ALL_COLUMNS = [
  {
    key: 'Name',
    header: 'NAME',
    sortable: true,
    render: (item) => {
      const names = [item.Firstname, item.Middlename, item.Lastname].filter(Boolean).join(' ');
      return <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{names}</span>;
    }
  },
  {
    key: 'Username',
    header: 'USERNAME',
    sortable: true,
    align: 'start',
    render: (item) => <span style={{ fontSize: '1rem' }}>{item.Username}</span>
  },
  {
    key: 'Phone',
    header: 'PHONE',
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
    key: 'Photo',
    header: 'PHOTO',
    render: (item) => item.Photo ? <img src={item.Photo} alt="photo" style={{ width: 32, height: 32, display: 'block', margin: '0 auto', borderRadius: '50%' }} /> : '',
    align: 'start',
    sortable: false
  }
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="3" label="Total Users" change="+0" isPositive />
      <StatsCard number="3" label="Active Users" change="+0" isPositive />
      <StatsCard number="0" label="Inactive Users" change="0" isPositive={false} />
    </div>
  );
}

export default function UserPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState(['Name', 'Username', 'Phone', 'Email', 'Photo']);
  const [filter, setFilter] = useState({ username: '' });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const columns = useMemo(
    () => ALL_COLUMNS.filter(col => selectedColumns.includes(col.key)),
    [selectedColumns]
  );

  const filteredUsers = useMemo(() => {
    let filtered = USERS;
    if (filter.username) {
      filtered = filtered.filter(u =>
        u.Username.toLowerCase().includes(filter.username.toLowerCase())
      );
    }
    return filtered;
  }, [filter]);

  const sortedUsers = useMemo(() => {
    if (!sortConfig.key) return filteredUsers;
    const sorted = [...filteredUsers].sort((a, b) => {
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
  }, [sortConfig, filteredUsers]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const handleRowClick = useCallback((user) => {
    console.log('Selected user:', user);
  }, []);

  const handleActionClick = useCallback((user) => {
    console.log('Action clicked for user:', user);
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
          <h1 className={styles.title}>Users</h1>
          <SearchBar
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            onFilterClick={handleFilterClick}
            width="300px"
          />
        </div>
        <DataTable
          data={sortedUsers}
          columns={columns}
          onRowClick={handleRowClick}
          onActionClick={handleActionClick}
          emptyMessage="No users found"
        />
      </div>
    </ThreeColumnLayout>
  );
}
