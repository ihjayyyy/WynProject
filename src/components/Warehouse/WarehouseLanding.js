'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleWarehouses } from './warehouseData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Location', key: 'location' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function WarehouseLanding() {
  const [warehouses] = useState(sampleWarehouses);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/storagesettings/warehouse/warehouseform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/storagesettings/warehouse/warehouseform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = warehouses.length;
    const locations = new Set(warehouses.map((w) => w.location).filter(Boolean)).size;
    const totalQuantity = warehouses.reduce((s, w) => s + Number(w.quantity || 0), 0);
    return [
      { key: 'total', label: 'Total Warehouses', number: total, change: `${total} records`, isPositive: true },
      { key: 'locations', label: 'Locations', number: locations, change: `${locations} unique`, isPositive: true },
      { key: 'quantity', label: 'Total Quantity', number: totalQuantity, change: `Sum of stock`, isPositive: true },
    ];
  }, [warehouses]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.name,
      item.location,
      item.quantity?.toString(),
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Warehouse"
      data={warehouses}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search warehouse"
      newButtonLabel="New Warehouse"
      onNew={() => router.push('/storagesettings/warehouse/warehouseform')}
      emptyMessage="No warehouses found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
