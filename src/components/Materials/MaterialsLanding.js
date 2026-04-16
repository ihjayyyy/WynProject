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
  { header: 'Purchase Price', key: 'purchasePrice' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function MaterialsLanding() {
  const router = useRouter();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await byTypeMaterials({ materialType: 'Material', isAssembly: false });
        if (!cancelled && !res?.error) {
          const items = (res.data || []).map((m) => ({ ...m, uom: m.unitOfMeasure, purchasePrice: m.purchasePrice ?? m.unitCost ?? 0 }));
          setMaterials(items);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const materialStats = useMemo(() => {
    const total = materials.length;
    const typesCount = new Set(materials.map((i) => i.materialType).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Materials', number: total, change: `${total} records`, isPositive: true },
      { key: 'types', label: 'Material Types', number: typesCount, change: `${typesCount} types`, isPositive: true },
    ];
  }, [materials]);

  const filterFn = (item, keyword) => {
    return [
      item.materialType,
      item.uom,
      item.purchasePrice && String(item.purchasePrice),
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
      title="Materials"
      data={materials}
      columns={columns}
      stats={materialStats}
      searchPlaceholder="Search materials"
      newButtonLabel="New Material"
      onNew={() => router.push('/materialsSettings/materials/materialsForm')}
      emptyMessage="No material records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
