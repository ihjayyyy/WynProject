'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleWarehouses } from './warehouseData';
import styles from './WarehouseLanding.module.scss';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouses] = useState(sampleWarehouses);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/storagesettings/warehouse/warehouseform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/storagesettings/warehouse/warehouseform?id=${item.id}&mode=edit`),
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
    if (!keyword) return warehouses;

    return warehouses.filter((item) =>
      [
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
        .some((val) => val.toLowerCase().includes(keyword))
    );
  }, [searchTerm, warehouses]);

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

  return (
    <div className={styles.warehouseWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Warehouse</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search warehouse"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Warehouse"
            handleOnClick={() => router.push('/storagesettings/warehouse/warehouseform')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {stats.map((stat) => (
          <StatsCard key={stat.key} number={stat.number} label={stat.label} change={stat.change} isPositive={stat.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage="No warehouses found" />
      </div>
    </div>
  );
}
