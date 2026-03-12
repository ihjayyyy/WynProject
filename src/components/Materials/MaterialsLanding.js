'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleMaterials } from './materialsData';
import styles from './MaterialsLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
    { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
  { header: 'UnitCost', key: 'unitCost' },
    { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function MaterialsLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [materials] = useState(() => sampleMaterials.filter((i) => i.materialType === 'material'));

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}&mode=edit`),
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

  const materialStats = useMemo(() => {
    const total = materials.length;
    const typesCount = new Set(materials.map((i) => i.materialType).filter(Boolean)).size;

    return [
      { key: 'total', label: 'Total Materials', number: total, change: `${total} records`, isPositive: true },
      { key: 'types', label: 'Material Types', number: typesCount, change: `${typesCount} types`, isPositive: true },
    ];
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return materials;
    }

    return materials.filter((item) =>
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
  }, [searchTerm, materials]);

  return (
    <div className={styles.materialsWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Materials</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search materials"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Material"
            handleOnClick={() => router.push('/materialsSettings/materials/materialsForm')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {materialStats.map((stat) => (
          <StatsCard key={stat.key} number={stat.number} label={stat.label} change={stat.change} isPositive={stat.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable
          columns={columns}
          data={filteredMaterials}
          showActions={false}
          emptyMessage="No material records found"
        />
      </div>
    </div>
  );
}
