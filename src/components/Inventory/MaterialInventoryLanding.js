'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { sampleMaterialInventory } from './materialInventoryData';
import { sampleMaterials } from '../Materials/materialsData';
import { sampleRacks } from '../Rack/rackData';
import { sampleWarehouses } from '../Warehouse/warehouseData';
import styles from '../Materials/MaterialsLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Rack Name', key: 'rackId' },
  { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
];

export default function MaterialInventoryLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory] = useState(() =>
    (sampleMaterialInventory || []).filter((it) => {
      const mat = (sampleMaterials || []).find((m) => m.id === it.materialId);
      return mat && String(mat.materialType).toLowerCase() === 'material';
    })
  );

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}&mode=edit`),
      },
    ],
    [router]
  );

  const materialsMap = useMemo(() => {
    return (sampleMaterials || []).reduce((acc, m) => {
      acc[m.id] = m.name || m.code || m.id;
      return acc;
    }, {});
  }, []);

  const racksMap = useMemo(() => {
    return (sampleRacks || []).reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {});
  }, []);

  const warehousesMap = useMemo(() => {
    return (sampleWarehouses || []).reduce((acc, w) => {
      acc[w.id] = w.name || w.code || w.id;
      return acc;
    }, {});
  }, []);

  const columns = useMemo(() => {
    const cols = baseColumns.map((c) => {
      if (c.key === 'rackId') {
        return { ...c, render: (item) => (racksMap[item.rackId]?.name || item.rackId) };
      }
      if (c.key === 'materialId') {
        return { ...c, render: (item) => materialsMap[item.materialId] || item.materialId };
      }
      return c;
    });

    // insert Warehouse column before RackId
    const rackIndex = cols.findIndex((c) => c.key === 'rackId');
    const warehouseCol = {
      header: 'Warehouse',
      key: 'warehouse',
      render: (item) => {
        const rack = racksMap[item.rackId];
        const wid = rack && rack.warehouseId;
        return warehousesMap[wid] || '';
      },
    };
    if (rackIndex >= 0) cols.splice(rackIndex, 0, warehouseCol);

    return [
      ...cols,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ];
  }, [actionItems, materialsMap, racksMap]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const totalQty = inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    return [
      { key: 'total', label: 'Inventory Records', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Quantity', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [inventory]);

  const filtered = useMemo(() => {
    const k = searchTerm.trim().toLowerCase();
    if (!k) return inventory;
    return inventory.filter((it) =>
      [
        it.id,
        it.name,
        racksMap[it.rackId] && racksMap[it.rackId].name,
        materialsMap[it.materialId],
        (racksMap[it.rackId] && warehousesMap[racksMap[it.rackId].warehouseId]) || '',
        it.createdBy,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [searchTerm, inventory]);

  return (
    <div className={styles.materialsWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Material Inventory</h1>
        <div className={styles.headerActions}>
          <SearchBar placeholder="Search inventory" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton buttonLabel="New Record" handleOnClick={() => router.push('/inventory/material-inventory/materialInventoryForm')} width="320px" />
        </div>
      </div>

      <div className={styles.statsSection}>
        {stats.map((s) => (
          <StatsCard key={s.key} number={s.number} label={s.label} change={s.change} isPositive={s.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage="No inventory records found" />
      </div>
    </div>
  );
}
