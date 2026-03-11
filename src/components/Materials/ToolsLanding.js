 'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import { sampleMaterials } from './materialsData';
import styles from './MaterialsLanding.module.scss';

const baseColumns = [
  { header: 'MaterialType', key: 'materialType' },
  { header: 'UOM', key: 'uom' },
  { header: 'UnitCost', key: 'unitCost' },
  { header: 'Id', key: 'id' },
  { header: 'CreatedBy', key: 'createdBy' },
  { header: 'CreatedDate', key: 'createdDate' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
];

export default function ToolsLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory] = useState(() => sampleMaterials.filter((i) => i.materialType === 'tool'));

  const columns = useMemo(() => baseColumns, []);

  const toolStats = useMemo(() => {
    const total = inventory.length;
    const typesCount = new Set(inventory.map((i) => i.materialType).filter(Boolean)).size;

    return [
      { key: 'total', label: 'Total Tools', number: total, change: `${total} records`, isPositive: true },
      { key: 'types', label: 'Tool Types', number: typesCount, change: `${typesCount} types`, isPositive: true },
    ];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return inventory;
    return inventory.filter((item) =>
      [
        item.materialType,
        item.uom,
        item.unitCost && String(item.unitCost),
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [searchTerm, inventory]);

  return (
    <div className={styles.materialsWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Tools & Equipment</h1>

        <div className={styles.headerActions}>
          <SearchBar placeholder="Search tools" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton buttonLabel="New Tool" handleOnClick={() => router.push('/materialsSettings/tools/toolsForm')} width="320px" />
        </div>
      </div>

      <div className={styles.statsSection}>
        {toolStats.map((stat) => (
          <StatsCard key={stat.key} number={stat.number} label={stat.label} change={stat.change} isPositive={stat.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filteredInventory} showActions={false} emptyMessage="No tool records found" />
      </div>
    </div>
  );
}
