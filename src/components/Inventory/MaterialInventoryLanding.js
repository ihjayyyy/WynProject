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
import styles from './MaterialInventoryLanding.module.scss';

const MATERIAL_TYPE_OPTIONS = [
  { label: 'Material', value: 'Material' },
  { label: 'Other', value: 'Other' },
];

const baseColumns = [
  // { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name', render: (item) => (<><b>{item.code}</b> - {item.name}</>) },
  { header: 'Rack Name', key: 'rackId' },
  // { header: 'Material Name', key: 'materialId' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },

];

export default function MaterialInventoryLanding() {
  const router = useRouter();
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [racks, setRacks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materialType, setMaterialType] = useState('Material');
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [qtyTargetItem, setQtyTargetItem] = useState(null);
  const [qtyChange, setQtyChange] = useState('');
  const [qtySaving, setQtySaving] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const loadInventoryData = async (cancelled = false, type = 'Material') => {
    try {
      setLoadingMaterials(true);
      const res = await getRacks();
      if (!cancelled && !res?.error) setRacks(res.data || []);
      const res2 = await getWarehouses();
      if (!cancelled && !res2?.error) setWarehouses(res2.data || []);
      const matRes = await fetchByTypeMaterials({ materialType: type, isAssembly: false });
      if (!cancelled && !matRes?.error) {
        setMaterials(matRes.data || []);
        const invRes = await getMaterialInventories({ materialType: type });
        if (!cancelled && !invRes?.error) {
          const invData = invRes.data || [];
          const inv = invData.filter((it) => (matRes.data || []).some((m) => m.id === it.materialId));
          setInventory(inv);
        } else {
          setInventory([]);
        }
      }
    } catch (e) {
    } finally {
      if (!cancelled) setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadInventoryData(cancelled, materialType);
    })();
    return () => { cancelled = true; };
  }, [materialType]);

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

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/inventory/material-inventory/materialInventoryForm?id=${item.id}&mode=edit`) },
      { key: 'adjustQuantity', label: 'Adjust Quantity', icon: <FiPlusCircle size={14} />, onClick: openQuantityModal },
    ],
    [router]
  );

  const materialsMap = useMemo(() => (materials || []).reduce((acc, m) => { acc[m.id] = m.name || m.code || m.id; return acc; }, {}), [materials]);

  const racksMap = useMemo(() => (racks || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {}), [racks]);

  const warehousesMap = useMemo(() => (warehouses || []).reduce((acc, w) => { acc[w.id] = w.name || w.code || w.id; return acc; }, {}), [warehouses]);

  const columns = useMemo(() => {
    const cols = baseColumns.map((c) => {
      if (c.key === 'rackId') return { ...c, render: (item) => (racksMap[item.rackId]?.name || item.rackId) };
      if (c.key === 'materialId') return { ...c, render: (item) => materialsMap[item.materialId] || item.materialId };
      return c;
    });

    const rackIndex = cols.findIndex((c) => c.key === 'rackId');
    const warehouseCol = { header: 'Warehouse', key: 'warehouse', render: (item) => { const rack = racksMap[item.rackId]; const wid = rack && rack.warehouseId; return warehousesMap[wid] || ''; } };
    if (rackIndex >= 0) cols.splice(rackIndex, 0, warehouseCol);

    return [...cols, { header: 'Action', key: 'actions', align: 'right', sortable: false, render: (item) => <DropdownAction item={item} items={actionItems} /> }];
  }, [actionItems, materialsMap, racksMap, warehousesMap]);

  const stats = useMemo(() => {
    const total = inventory.length;
    const totalQty = inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    return [
      { key: 'total', label: 'Inventory Records', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Quantity', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [inventory]);

  const typeToggle = (
    <div className={styles.typeToggleRow}>
      <span className={styles.typeLabel}>Type</span>
      <div className={styles.tabs}>
        {MATERIAL_TYPE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            className={`${styles.tab} ${materialType === opt.value ? styles.tabActive : ''}`}
            onClick={() => setMaterialType(opt.value)}
            disabled={loadingMaterials && materialType === opt.value}
            aria-pressed={materialType === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

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
    <>
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
        belowStatsAddon={typeToggle}
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
