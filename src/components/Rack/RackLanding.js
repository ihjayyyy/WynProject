'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleRacks } from './rackData';
import { sampleWarehouses } from '../Warehouse/warehouseData';
import Landing from '../ui/Landing/Landing';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouseId' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function RackLanding() {
  const [racks] = useState(sampleRacks);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/storagesettings/rack/rackform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/storagesettings/rack/rackform?id=${item.id}&mode=edit`),
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

  const rackStats = useMemo(() => {
    const total = racks.length;
    const warehousesCount = new Set(racks.map((r) => r.warehouseId).filter(Boolean)).size;

    return [
      { key: 'total', label: 'Total Racks', number: total, change: `${total} records`, isPositive: true },
      { key: 'warehouses', label: 'Warehouses', number: warehousesCount, change: `${warehousesCount} linked`, isPositive: true },
    ];
  }, [racks]);

  const getWarehouseName = (id) => sampleWarehouses.find((w) => w.id === id)?.name || id;

  const displayedColumns = useMemo(
    () =>
      columns.map((c) =>
        c.key === 'warehouseId' ? { ...c, render: (item) => getWarehouseName(item.warehouseId) } : c
      ),
    [columns]
  );

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.name,
      item.warehouseId,
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Racks"
      data={racks}
      columns={displayedColumns}
      stats={rackStats}
      searchPlaceholder="Search racks"
      newButtonLabel="New Rack"
      onNew={() => router.push('/storagesettings/rack/rackform')}
      emptyMessage="No racks found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
