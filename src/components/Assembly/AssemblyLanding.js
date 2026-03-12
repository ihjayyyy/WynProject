'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleAssemblies } from './assemblyData';
import styles from '../Materials/MaterialsLanding.module.scss';

const baseColumns = [
  { header: 'Id', key: 'id' },
    { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
    { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function AssemblyLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory] = useState(sampleAssemblies);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}&mode=edit`),
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

  const stats = useMemo(() => {
    const total = inventory.length;
    return [{ key: 'total', label: 'Total Assemblies', number: total, change: `${total} records`, isPositive: true }];
  }, [inventory]);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return inventory;
    return inventory.filter((item) =>
      [item.uom, item.id, item.createdBy, item.createdDate, item.updatedBy, item.updatedDate, item.code, item.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(keyword))
    );
  }, [searchTerm, inventory]);

  return (
    <div className={styles.materialsWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Assembly</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search assemblies"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Assembly"
            handleOnClick={() => router.push('/materialsSettings/assembly/assemblyForm')}
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
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage="No assembly records found" />
      </div>
    </div>
  );
}
