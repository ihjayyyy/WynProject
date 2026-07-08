'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { FiEdit2, FiEye, FiPlusCircle } from 'react-icons/fi';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Input from '../ui/Input/Input';
import { useToast } from '../ui/Toast/Toast';
import { getMaterialInventories, updateMaterialInventoryQuantity } from '../../services/MaterialInventory';
import { byTypeMaterials as fetchByTypeMaterials } from '../../services/Materials';
import { getRacks } from '../../services/Rack';
import { getWarehouses } from '../../services/Warehouse';

const baseColumns = [
  // { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name', render: (item) => (<><b>{item.code}</b> - {item.name}</>) },
  // { header: 'Name', key: 'name' },
  { header: 'Warehouse', key: 'warehouse' },
  { header: 'Rack Name', key: 'rackId' },
  // { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'Updated By', key: 'updatedBy' },
    { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }) : '') },

];

export default function ToolsInventoryLanding() {
  const router = useRouter();
  const toast = useToast();
  const [racks, setRacks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [qtyTargetItem, setQtyTargetItem] = useState(null);
  const [qtyChange, setQtyChange] = useState('');
  const [qtySaving, setQtySaving] = useState(false);

  const loadInventoryData = async (cancelled = false) => {
    try {
      const res = await getRacks();
      if (!cancelled && !res?.error) setRacks(res.data || []);
      const res2 = await getWarehouses();
      if (!cancelled && !res2?.error) setWarehouses(res2.data || []);
      const matRes = await fetchByTypeMaterials({ materialType: 'Tool' });
      if (!cancelled && !matRes?.error) {
        setMaterials((matRes.data || []).map((m) => ({ ...m, uom: m.unitOfMeasure, unitCost: m.sellingPrice ?? m.unitCost ?? 0 })));
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
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadInventoryData(cancelled);
    })();
    return () => { cancelled = true; };
  }, []);

  const openQuantityModal = (item) => {
    setQtyTargetItem(item);
    setQtyChange('');
    setIsQtyModalOpen(true);
  };

  const closeQuantityModal = () => {
    setIsQtyModalOpen(false);
    setQtyTargetItem(null);
    setQtyChange('');
  };

  const applyQuantityChange = async () => {
    if (qtySaving) return;
    const parsed = Number(qtyChange);
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast.error('Enter a non-zero number. Use positive to add, negative to deduct.');
      return;
    }
    if (!qtyTargetItem?.id) {
      toast.error('No inventory record selected.');
      return;
    }

    try {
      setQtySaving(true);
      const res = await updateMaterialInventoryQuantity(qtyTargetItem.id, parsed);
      if (res?.error) throw new Error(res.error);
      toast.success('Quantity updated successfully.');
      closeQuantityModal();
      await loadInventoryData(false);
    } catch (error) {
      toast.error('Failed to update quantity.');
    } finally {
      setQtySaving(false);
    }
  };

  const materialsMap = useMemo(() => (materials || []).reduce((acc, m) => { acc[m.id] = m; return acc; }, {}), [materials]);

  const racksMap = useMemo(() => (racks || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {}), [racks]);

  const warehousesMap = useMemo(() => (warehouses || []).reduce((acc, w) => { acc[w.id] = w.name || w.code || w.id; return acc; }, {}), [warehouses]);

  

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inventory/tools-inventory/toolsInventoryForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/inventory/tools-inventory/toolsInventoryForm?id=${item.id}&mode=edit`) },
      { key: 'adjustQuantity', label: 'Adjust Quantity', icon: <FiPlusCircle size={14} />, onClick: openQuantityModal },
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
    <>
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

      <ConfirmModal
        open={isQtyModalOpen}
        title="Adjust Quantity"
        message="Use positive number to add stock and negative number to deduct stock."
        confirmText={qtySaving ? 'Saving...' : 'Apply'}
        confirmVariant="primary"
        onConfirm={applyQuantityChange}
        onCancel={closeQuantityModal}>
        <div style={{ marginBottom: '12px' }}>
          <Input
            type="number"
            value={qtyChange}
            onChange={(e) => setQtyChange(e.target.value)}
            placeholder="e.g. 5 or -3"
            min={-999999}
            max={999999}
            disabled={qtySaving}
          />
          {qtyTargetItem?.name ? (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              Target: {qtyTargetItem.name}
            </div>
          ) : null}
        </div>
      </ConfirmModal>
    </>
  );
}
