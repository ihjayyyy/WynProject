'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleCustomers } from './customersData';

const baseColumns = [
  { header: 'Id', key: 'id' },
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
  const [customers] = useState(sampleCustomers);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/customers/customersform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/customers/customersform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

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

  const filterFn = (item, keyword) => {
    return [
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
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Customers"
      data={customers}
      columns={columns}
      stats={customerStats}
      searchPlaceholder="Search customer"
      newButtonLabel="New Customer"
      onNew={() => router.push('/customers/customersform')}
      emptyMessage="No customers found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
