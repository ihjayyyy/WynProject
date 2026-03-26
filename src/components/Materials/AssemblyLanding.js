'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { byTypeMaterials } from '../../services/Materials';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
  { header: 'UnitCost', key: 'unitCost' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function AssemblyLanding() {
  const router = useRouter();
  const [assemblies, setAssemblies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await byTypeMaterials({ isAssembly: true });
        if (!cancelled && !res?.error) {
          const items = (res.data || []).map((m) => ({ ...m, uom: m.unitOfMeasure, unitCost: m.unitCost }));
          setAssemblies(items);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/assembly/assemblyForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const assemblyStats = useMemo(() => {
    const total = assemblies.length;
    const typesCount = new Set(assemblies.map((i) => i.materialType).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Assemblies', number: total, change: `${total} records`, isPositive: true },
      { key: 'types', label: 'Assembly Types', number: typesCount, change: `${typesCount} types`, isPositive: true },
    ];
  }, [assemblies]);

  const filterFn = (item, keyword) => {
    return [
      item.materialType,
      item.uom,
      item.unitCost && String(item.unitCost),
      item.id,
      item.createdBy,
      item.createdAt,
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
      title="Assemblies"
      data={assemblies}
      columns={columns}
      stats={assemblyStats}
      searchPlaceholder="Search assemblies"
      newButtonLabel="New Assembly"
      onNew={() => router.push('/materialsSettings/assembly/assemblyForm')}
      emptyMessage="No assembly records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
