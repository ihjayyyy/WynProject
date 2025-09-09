'use client';

import React, { useState } from 'react';
import ThreeColumnLayout from '../../../components/ThreeColumnLayout/ThreeColumnLayout';
import { StatsCard, SearchBar } from '../../../components';
import styles from './page.module.scss';
import { FiMoreVertical } from 'react-icons/fi';

export default function SupplierPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample supplier data
  const suppliers = [
    {
      id: 'SUP001',
      name: 'Acme Corporation',
      contact: 'John Smith',
      email: 'john.smith@acme.com',
      phone: '+1 (555) 123-4567',
      status: 'ACTIVE',
      category: 'Technology',
      totalAmount: '245,870',
      lastOrder: '2024-09-08'
    },
    {
      id: 'SUP002',
      name: 'Global Supplies Ltd',
      contact: 'Sarah Johnson',
      email: 'sarah.j@globalsupplies.com',
      phone: '+1 (555) 987-6543',
      status: 'ACTIVE',
      category: 'Office Supplies',
      totalAmount: '89,450',
      lastOrder: '2024-09-05'
    },
    {
      id: 'SUP003',
      name: 'Tech Solutions Inc',
      contact: 'Michael Brown',
      email: 'mbrown@techsolutions.com',
      phone: '+1 (555) 456-7890',
      status: 'PENDING',
      category: 'IT Services',
      totalAmount: '156,320',
      lastOrder: '2024-08-28'
    },
    {
      id: 'SUP004',
      name: 'Premium Materials Co',
      contact: 'Lisa Davis',
      email: 'ldavis@premiummaterials.com',
      phone: '+1 (555) 321-9876',
      status: 'ACTIVE',
      category: 'Manufacturing',
      totalAmount: '312,640',
      lastOrder: '2024-09-07'
    },
    {
      id: 'SUP005',
      name: 'Quick Logistics',
      contact: 'Robert Wilson',
      email: 'rwilson@quicklogistics.com',
      phone: '+1 (555) 654-3210',
      status: 'INACTIVE',
      category: 'Shipping',
      totalAmount: '78,920',
      lastOrder: '2024-07-15'
    }
  ];

  const handleRowClick = (supplier) => {
    console.log('Selected supplier:', supplier);
    // Add your row click logic here when ready
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    // Add your search logic here
  };

  const handleSearch = (value) => {
    console.log('Searching for:', value);
    // Add your search submission logic here
  };

  const handleFilterClick = () => {
    console.log('Filter clicked');
    // Add your filter logic here
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'INACTIVE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const suppliersContent = (
    <div className={styles.container}>
      {/* Stats Cards at the top */}
      <div className={styles.statsGrid}>
        <StatsCard
          number="156"
          label="Total Suppliers"
          change="+8"
          isPositive={true}
        />
        <StatsCard
          number="142"
          label="Active Suppliers"
          change="+5"
          isPositive={true}
        />
        <StatsCard
          number="$2.4M"
          label="Total Value (YTD)"
          change="+12%"
          isPositive={true}
        />
      </div>

      {/* Title and Search Section */}
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

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STATUS</th>
              <th>SUPPLIER NAME</th>
              <th>CONTACT</th>
              <th>CATEGORY</th>
              <th>TOTAL VALUE</th>
              <th>LAST ORDER</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr 
                key={supplier.id} 
                className={styles.tableRow}
                onClick={() => handleRowClick(supplier)}
              >
                <td>
                  <div className={styles.priority}>
                    <div 
                      className={styles.priorityDot}
                      style={{ backgroundColor: getStatusColor(supplier.status) }}
                    ></div>
                    <span>{supplier.status}</span>
                  </div>
                </td>
                <td>{supplier.name}</td>
                <td>{supplier.contact}</td>
                <td>{supplier.category}</td>
                <td>${supplier.totalAmount}</td>
                <td>{supplier.lastOrder}</td>
                <td>
                  <button className={styles.menuButton}>
                    <FiMoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <ThreeColumnLayout
      rightPanel={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'var(--color-text-secondary-light)',
          fontSize: '0.875rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <p>Right panel content</p>
            <p>Coming soon...</p>
          </div>
        </div>
      }
    >
      {suppliersContent}
    </ThreeColumnLayout>
  );
}
