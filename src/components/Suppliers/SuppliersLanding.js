'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { getSuppliers } from '../../services/Supplier';
import { useEffect } from 'react';

const baseColumns = [
  { header: 'Code', key: 'code' },
  { header: 'Company Name', key: 'name' },
  { header: 'Contact Person', key: 'contactPerson' },
  { header: 'Contact Number', key: 'contactNumber' },
  { header: 'Email', key: 'email' },
  { header: 'VAT Type', key: 'vatType' },
  { header: 'Terms', key: 'terms' },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function SuppliersLanding() {
  const [suppliers, setSuppliers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await getSuppliers();
      if (!mounted) return;
      if (res.error || !res.data) {
        console.error('Failed to load suppliers', res.error);
        setSuppliers([]);
        return;
      }
      setSuppliers(res.data || []);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => {
    const cols = baseColumns.map((col) => {
      if (col.key === 'customerName') {
        return { ...col, render: (item) => item.customerName || '' };
      }
      if (col.key === 'isDeleted') {
        return { ...col, render: (item) => (item.isDeleted ? 'Yes' : 'No') };
      }
      return col;
    });
    return [...cols, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }];
  }, [actionItems]);

  const supplierStats = useMemo(() => {
    const total = suppliers.length;
    return [
      { key: 'total', label: 'Total Suppliers', number: total, change: `${total} records`, isPositive: true },
    ];
  }, [suppliers]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.contactPerson,
      item.contactNumber,
      item.code,
      item.name,
      item.email,
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
