'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { getMaterialInventories } from '../../services/MaterialInventory';
import { byTypeMaterials as fetchByTypeMaterials } from '../../services/Materials';
import { getRacks } from '../../services/Rack';
import { getWarehouses } from '../../services/Warehouse';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouse' },
  { header: 'Rack Name', key: 'rackId' },
  { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function ToolsInventoryLanding() {
  const router = useRouter();
  const [racks, setRacks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRacks();
        if (!cancelled && !res?.error) setRacks(res.data || []);
        const res2 = await getWarehouses();
        if (!cancelled && !res2?.error) setWarehouses(res2.data || []);
        const matRes = await fetchByTypeMaterials({ materialType: 'Tool' });
        if (!cancelled && !matRes?.error) {
          setMaterials((matRes.data || []).map((m) => ({ ...m, uom: m.unitOfMeasure, unitCost: m.unitCost })));
          const invRes = await getMaterialInventories({ materialType: 'Tool' });
          if (!cancelled && !invRes?.error) {
            const invData = invRes.data || [];
            const toolInv = invData.filter((it) => (matRes.data || []).some((m) => m.id === it.materialId));
            setInventory(toolInv);
          } else {
            setInventory([]);
          }
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const materialsMap = useMemo(() => (materials || []).reduce((acc, m) => { acc[m.id] = m; return acc; }, {}), [materials]);

  const racksMap = useMemo(() => (racks || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {}), [racks]);

  const warehousesMap = useMemo(() => (warehouses || []).reduce((acc, w) => { acc[w.id] = w.name || w.code || w.id; return acc; }, {}), [warehouses]);

  

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [
    ...baseColumns.map((c) => {
      if (c.key === 'rackId') return { ...c, render: (item) => racksMap[item.rackId]?.name || item.rackId };
      if (c.key === 'materialId') return { ...c, render: (item) => materialsMap[item.materialId]?.name || item.materialId };
      if (c.key === 'warehouse') return { ...c, render: (item) => warehousesMap[racksMap[item.rackId]?.warehouseId] || '' };
      return c;
    }),
    { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> },
  ], [actionItems, materialsMap, racksMap, warehousesMap]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const totalQty = inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    return [
      { key: 'total', label: 'Tool Inventory Records', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Quantity', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [inventory]);

  const filterFn = (it, k) => {
    const matName = materialsMap[it.materialId]?.name || '';
    const rackName = racksMap[it.rackId]?.name || '';
    const whName = warehousesMap[racksMap[it.rackId]?.warehouseId] || '';
    return [it.id, it.name, matName, rackName, whName, it.createdBy].filter(Boolean).some((v) => String(v).toLowerCase().includes(k));
  };

  return (
    <Landing
      title="Tools & Equipment Inventory"
      data={inventory}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search tools inventory"
      newButtonLabel="New Record"
      onNew={() => router.push('/inventory/tools-inventory/toolsInventoryForm')}
      emptyMessage="No tool inventory records found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
