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
import styles from './MaterialInventoryLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouse' },
  { header: 'Rack Name', key: 'rackId' },
  { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
];

export default function ToolsInventoryLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const materialsMap = useMemo(() => {
    return (sampleMaterials || []).reduce((acc, m) => {
      acc[m.id] = m;
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

  const inventory = useMemo(() => {
    return (sampleMaterialInventory || []).filter((it) => {
      const mat = materialsMap[it.materialId];
      return mat && String(mat.materialType).toLowerCase() === 'tool';
    });
  }, [materialsMap]);

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

  const columns = useMemo(() => {
    return [
      ...baseColumns.map((c) => {
        if (c.key === 'rackId') {
          return { ...c, render: (item) => racksMap[item.rackId]?.name || item.rackId };
        }
        if (c.key === 'materialId') {
          return { ...c, render: (item) => materialsMap[item.materialId]?.name || item.materialId };
        }
        if (c.key === 'warehouse') {
          return { ...c, render: (item) => warehousesMap[racksMap[item.rackId]?.warehouseId] || '' };
        }
        return c;
      }),
      { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> },
    ];
  }, [actionItems, materialsMap, racksMap, warehousesMap]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const totalQty = inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    return [
      { key: 'total', label: 'Tool Inventory Records', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Quantity', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [inventory]);

  const filtered = useMemo(() => {
    const k = searchTerm.trim().toLowerCase();
    if (!k) return inventory;
    return inventory.filter((it) => {
      const matName = materialsMap[it.materialId]?.name || '';
      const rackName = racksMap[it.rackId]?.name || '';
      const whName = warehousesMap[racksMap[it.rackId]?.warehouseId] || '';
      return [it.id, it.name, matName, rackName, whName, it.createdBy].filter(Boolean).some((v) => String(v).toLowerCase().includes(k));
    });
  }, [searchTerm, inventory, materialsMap, racksMap, warehousesMap]);

  return (
    <div className={styles.materialsWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Tools & Equipment Inventory</h1>
        <div className={styles.headerActions}>
          <SearchBar placeholder="Search tools inventory" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton buttonLabel="New Record" handleOnClick={() => router.push('/inventory/tools-inventory/toolsInventoryForm')} width="320px" />
        </div>
      </div>

      <div className={styles.statsSection}>
        {stats.map((s) => (
          <StatsCard key={s.key} number={s.number} label={s.label} change={s.change} isPositive={s.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage="No tool inventory records found" />
      </div>
    </div>
  );
}
