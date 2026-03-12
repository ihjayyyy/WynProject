 'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleMaterials } from './materialsData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
  { header: 'UnitCost', key: 'unitCost' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function ToolsLanding() {
  const router = useRouter();
  const [inventory] = useState(() => sampleMaterials.filter((i) => i.materialType === 'tool'));

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/tools/toolsForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/tools/toolsForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const toolStats = useMemo(() => {
    const total = inventory.length;
    const typesCount = new Set(inventory.map((i) => i.materialType).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Tools', number: total, change: `${total} records`, isPositive: true },
      { key: 'types', label: 'Tool Types', number: typesCount, change: `${typesCount} types`, isPositive: true },
    ];
  }, [inventory]);

  const filterFn = (item, keyword) => {
    return [
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
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Tools & Equipment"
      data={inventory}
      columns={columns}
      stats={toolStats}
      searchPlaceholder="Search tools"
      newButtonLabel="New Tool"
      onNew={() => router.push('/materialsSettings/tools/toolsForm')}
      emptyMessage="No tool records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
