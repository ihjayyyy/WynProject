'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleCustomers } from './customersData';
import styles from './CustomersLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
  // { header: 'CreatedBy', key: 'createdBy' },
  // { header: 'CreatedDate', key: 'createdDate' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'CustomerName', key: 'customerName' },
  { header: 'ContactNumber', key: 'contactNumber' },
  { header: 'Address', key: 'address' },
  { header: 'Company Name', key: 'companyName' },
  { header: 'Email', key: 'email' },
    { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function CustomersLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers] = useState(sampleCustomers);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/customers/customersform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/customers/customersform?id=${item.id}&mode=edit`),
      },
    ],
    [router]
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems]
  );

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return customers;
    }

    return customers.filter((item) =>
      [
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
        item.customerName,
        item.contactNumber,
        item.address,
        item.companyName,
        item.email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [searchTerm, customers]);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const companies = new Set(customers.map((item) => item.companyName).filter(Boolean)).size;
    const withEmail = customers.filter((item) => item.email).length;
    const withContact = customers.filter((item) => item.contactNumber).length;

    return [
      { key: 'total', label: 'Total Customers', number: total, change: `${total} records`, isPositive: true },
      { key: 'companies', label: 'Companies', number: companies, change: `${companies} unique`, isPositive: true },
      { key: 'email', label: 'With Email', number: withEmail, change: `${withEmail}/${total || 0}`, isPositive: true },
      { key: 'contact', label: 'With Contact', number: withContact, change: `${withContact}/${total || 0}`, isPositive: true },
    ];
  }, [customers]);

  return (
    <div className={styles.customersWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Customers</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search customer"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Customer"
            handleOnClick={() => router.push('/customers/customersform')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {customerStats.map((stat) => (
          <StatsCard
            key={stat.key}
            number={stat.number}
            label={stat.label}
            change={stat.change}
            isPositive={stat.isPositive}
          />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          showActions={false}
          emptyMessage="No customers found"
        />
      </div>
    </div>
  );
}
