'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleRacks } from './rackData';
import { sampleWarehouses } from '../Warehouse/warehouseData';
import styles from './RackLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouseId' },
    { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function RackLanding() {
  const [searchTerm, setSearchTerm] = useState('');
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

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return racks;

    return racks.filter((item) =>
      [
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
        .some((val) => val.toLowerCase().includes(keyword))
    );
  }, [searchTerm, racks]);

  const rackStats = useMemo(() => {
    const total = racks.length;
    const warehousesCount = new Set(racks.map((r) => r.warehouseId).filter(Boolean)).size;

    return [
      { key: 'total', label: 'Total Racks', number: total, change: `${total} records`, isPositive: true },
      { key: 'warehouses', label: 'Warehouses', number: warehousesCount, change: `${warehousesCount} linked`, isPositive: true },
    ];
  }, [racks]);

  // helper to get warehouse name
  const getWarehouseName = (id) => sampleWarehouses.find((w) => w.id === id)?.name || id;

  // wrap columns to render warehouse name when appropriate
  const displayedColumns = useMemo(
    () =>
      columns.map((c) =>
        c.key === 'warehouseId'
          ? { ...c, render: (item) => getWarehouseName(item.warehouseId) }
          : c
      ),
    [columns]
  );

  return (
    <div className={styles.rackWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Racks</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search racks"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Rack"
            handleOnClick={() => router.push('/storagesettings/rack/rackform')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {rackStats.map((stat) => (
          <StatsCard key={stat.key} number={stat.number} label={stat.label} change={stat.change} isPositive={stat.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={displayedColumns} data={filtered} showActions={false} emptyMessage="No racks found" />
      </div>
    </div>
  );
}
