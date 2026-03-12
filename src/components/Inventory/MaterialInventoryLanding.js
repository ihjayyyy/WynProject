'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { sampleMaterialInventory } from './materialInventoryData';
import { sampleMaterials } from '../Materials/materialsData';
import { sampleRacks } from '../Rack/rackData';
import { sampleWarehouses } from '../Warehouse/warehouseData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Rack Name', key: 'rackId' },
  { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function MaterialInventoryLanding() {
  const router = useRouter();
  const [inventory] = useState(() =>
    (sampleMaterialInventory || []).filter((it) => {
      const mat = (sampleMaterials || []).find((m) => m.id === it.materialId);
      return mat && String(mat.materialType).toLowerCase() === 'material';
    })
  );

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const materialsMap = useMemo(() => (sampleMaterials || []).reduce((acc, m) => { acc[m.id] = m.name || m.code || m.id; return acc; }, {}), []);

  const racksMap = useMemo(() => (sampleRacks || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {}), []);

  const warehousesMap = useMemo(() => (sampleWarehouses || []).reduce((acc, w) => { acc[w.id] = w.name || w.code || w.id; return acc; }, {}), []);

  const columns = useMemo(() => {
    const cols = baseColumns.map((c) => {
      if (c.key === 'rackId') return { ...c, render: (item) => (racksMap[item.rackId]?.name || item.rackId) };
      if (c.key === 'materialId') return { ...c, render: (item) => materialsMap[item.materialId] || item.materialId };
      return c;
    });

    const rackIndex = cols.findIndex((c) => c.key === 'rackId');
    const warehouseCol = { header: 'Warehouse', key: 'warehouse', render: (item) => { const rack = racksMap[item.rackId]; const wid = rack && rack.warehouseId; return warehousesMap[wid] || ''; } };
    if (rackIndex >= 0) cols.splice(rackIndex, 0, warehouseCol);

    return [...cols, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }];
  }, [actionItems, materialsMap, racksMap, warehousesMap]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const totalQty = inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    return [
      { key: 'total', label: 'Inventory Records', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Quantity', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [inventory]);

  const filterFn = (it, k) => {
    const keyword = k;
    return [
      it.id,
      it.name,
      racksMap[it.rackId] && racksMap[it.rackId].name,
      materialsMap[it.materialId],
      (racksMap[it.rackId] && warehousesMap[racksMap[it.rackId].warehouseId]) || '',
      it.createdBy,
    ].filter(Boolean).some((v) => String(v).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Material Inventory"
      data={inventory}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search inventory"
      newButtonLabel="New Record"
      onNew={() => router.push('/inventory/material-inventory/materialInventoryForm')}
      emptyMessage="No inventory records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
