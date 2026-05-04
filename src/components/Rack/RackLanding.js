'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { getRacks } from '../../services/Rack';
import { getWarehouses } from '../../services/Warehouse';
import Landing from '../ui/Landing/Landing';

const baseColumns = [
  // { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouseName' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function RackLanding() {
  const [racks, setRacks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRacks();
        if (!cancelled && !res?.error) setRacks(res.data || []);
        const res2 = await getWarehouses();
        if (!cancelled && !res2?.error) setWarehouses(res2.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);
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

  const getWarehouseName = (id) => warehouses.find((w) => w.id === id)?.name || id;

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
