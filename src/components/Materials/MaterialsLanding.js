'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiPackage } from 'react-icons/fi';
import * as Yup from 'yup';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import ItemModal from '../ItemDetails/itemModal';
import { byTypeMaterials } from '../../services/Materials';
import { getRacks } from '../../services/Rack';
import { createMaterialInventory } from '../../services/MaterialInventory';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
  { header: 'Purchase Price', key: 'purchasePrice', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.purchasePrice != null ? Number(item.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function MaterialsLanding() {
  const router = useRouter();
  const toast = useToast();
  const [materials, setMaterials] = useState([]);
  const [racks, setRacks] = useState([]);
  const [inventoryModal, setInventoryModal] = useState({ open: false, material: null });

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRacks();
        if (!cancelled && !res?.error) setRacks(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const rackOptions = useMemo(() =>
    (racks || []).map((r) => ({ label: `${r.warehouseName ? r.warehouseName + ' - ' : ''}${r.name}`, value: String(r.id) })),
    [racks]
  );

  const inventoryFields = useMemo(() => {
    if (!inventoryModal.material) return [];
    const mat = inventoryModal.material;
    return [
      { name: 'materialId', label: 'Material Id', type: 'number', value: Number(mat.id) || 0, hidden: true, validator: Yup.number().notRequired() },
      { name: 'code', label: 'Code', type: 'text', value: mat.code || '', hidden: true, validator: Yup.string().notRequired() },
      { name: 'isDefault', label: 'Is Default', type: 'checkbox', value: true, hidden: true, validator: Yup.boolean().notRequired() },
      { name: 'name', label: 'Name', type: 'text', value: mat.name || '', validator: Yup.string().required('Name is required') },
      {
        name: 'rackId', label: 'Rack', type: 'select',
        value: '',
        options: rackOptions,
        validator: Yup.string().required('Rack is required'),
      },
      { name: 'quantity', label: 'Quantity', type: 'number', value: 0, validator: Yup.number().min(0).required('Quantity is required') },
      { name: 'stockLevel', label: 'Stock Level', type: 'number', value: 0, validator: Yup.number().min(0).notRequired() },
    ];
  }, [inventoryModal.material, rackOptions]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/materials/materialsForm?id=${item.id}&mode=edit`) },
      { key: 'createInventory', label: 'Create Inventory', icon: <FiPackage size={14} />, onClick: (item) => setInventoryModal({ open: true, material: item }) },
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
      item.updatedAt,
      item.code,
      item.name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <>
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
      <ItemModal
        headerLabel="Create Inventory"
        mode="new"
        itemIndex={-1}
        isOpen={inventoryModal.open}
        fields={inventoryFields}
        onItemRemove={() => {}}
        onClose={async (val) => {
          if (!val) { setInventoryModal({ open: false, material: null }); return; }
          try {
            const payload = {
              name: val.name || '',
              code: val.code || '',
              rackId: Number(val.rackId) || 0,
              materialId: Number(val.materialId) || 0,
              quantity: Number(val.quantity) || 0,
              stockLevel: Number(val.stockLevel ?? val.quantity) || 0,
              isDefault: true,
            };
            const result = await createMaterialInventory(payload);
            if (result.error) throw new Error(result.error);
            toast.success('Inventory record created');
          } catch (err) {
            toast.error('Failed to create inventory record');
          } finally {
            setInventoryModal({ open: false, material: null });
          }
        }}
      />
    </>
  );
}
