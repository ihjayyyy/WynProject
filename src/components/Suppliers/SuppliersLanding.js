'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleSuppliers } from './suppliersData';
import { sampleCustomers } from '../Customers/customersData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'CustomerNameId', key: 'CustomerNameId' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function SuppliersLanding() {
  const [suppliers] = useState(sampleSuppliers);
  const router = useRouter();

  const customerMap = useMemo(() => Object.fromEntries(sampleCustomers.map((c) => [c.id, c.customerName])), []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => {
    const cols = baseColumns.map((col) => {
      if (col.key === 'CustomerNameId') {
        return { ...col, header: 'Customer', render: (item) => customerMap[item.CustomerNameId] ?? item.CustomerNameId };
      }
      return col;
    });
    return [...cols, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }];
  }, [actionItems, customerMap]);

  const supplierStats = useMemo(() => {
    const total = suppliers.length;
    const byCustomerRefs = new Set(suppliers.map((s) => s.CustomerNameId).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Suppliers', number: total, change: `${total} records`, isPositive: true },
      { key: 'refs', label: 'Customer Refs', number: byCustomerRefs, change: `${byCustomerRefs} unique`, isPositive: true },
    ];
  }, [suppliers]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.CustomerNameId,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Suppliers"
      data={suppliers}
      columns={columns}
      stats={supplierStats}
      searchPlaceholder="Search supplier"
      newButtonLabel="New Supplier"
      onNew={() => router.push('/suppliers/supplierform')}
      emptyMessage="No suppliers found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
