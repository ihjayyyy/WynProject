 'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleAssemblies } from './assemblyData';

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
  const [inventory] = useState(sampleAssemblies);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = inventory.length;
    return [{ key: 'total', label: 'Total Assemblies', number: total, change: `${total} records`, isPositive: true }];
  }, [inventory]);

  const filterFn = (item, keyword) => {
    return [item.uom, item.id, item.createdBy, item.createdDate, item.updatedBy, item.updatedDate, item.code, item.name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Assembly"
      data={inventory}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search assemblies"
      newButtonLabel="New Assembly"
      onNew={() => router.push('/materialsSettings/assembly/assemblyForm')}
      emptyMessage="No assembly records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
