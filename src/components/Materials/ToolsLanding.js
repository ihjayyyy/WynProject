'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiPackage, FiStar, FiTrash2 } from 'react-icons/fi';
import * as Yup from 'yup';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import ItemModal from '../ItemDetails/itemModal';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Select from '../ui/Select/Select';
import { byTypeMaterials, deleteMaterial } from '../../services/Materials';
import { getRacks } from '../../services/Rack';
import { createMaterialInventory, getRacksByMaterialId, setDefaultMaterialInventory } from '../../services/MaterialInventory';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'UOM', key: 'uom' },
  { header: 'Purchase Price', key: 'purchasePrice', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.purchasePrice != null ? Number(item.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }) : '') },
];

export default function ToolsLanding() {
  const router = useRouter();
  const toast = useToast();
  const [inventory, setInventory] = useState([]);
  const [racks, setRacks] = useState([]);
  const [inventoryModal, setInventoryModal] = useState({ open: false, material: null });

  // Rack options available for the Create Inventory modal (already-used racks filtered out)
  const [inventoryRackOptions, setInventoryRackOptions] = useState([]);
  const [inventoryRacksLoading, setInventoryRacksLoading] = useState(false);

  // Set Default modal state
  const [defaultModal, setDefaultModal] = useState({ open: false, material: null });
  const [defaultRackOptions, setDefaultRackOptions] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [defaultSaving, setDefaultSaving] = useState(false);
  const [defaultLoading, setDefaultLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, material: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await byTypeMaterials({ materialType: 'Tool', isAssembly: false });
        if (!cancelled && !res?.error) {
          const items = (res.data || []).map((m) => ({ ...m, uom: m.unitOfMeasure, purchasePrice: m.purchasePrice ?? m.unitCost ?? 0 }));
          setInventory(items);
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

  // Open Create Inventory modal and filter out racks already assigned to this tool
  const openInventoryModal = useCallback(async (item) => {
    setInventoryModal({ open: true, material: item });
    setInventoryRackOptions([]);
    setInventoryRacksLoading(true);
    try {
      const res = await getRacksByMaterialId(item.id);
      const usedRackIds = !res?.error
        ? new Set((res.data || []).map((r) => String(r.rack?.id)).filter(Boolean))
        : new Set();
      const availableOptions = rackOptions.filter((opt) => !usedRackIds.has(opt.value));
      setInventoryRackOptions(availableOptions);
    } catch (e) {
      // If the lookup fails, fall back to showing all racks rather than blocking the user
      setInventoryRackOptions(rackOptions);
    } finally {
      setInventoryRacksLoading(false);
    }
  }, [rackOptions]);

  // Open Set Default modal and load racks for that material
  const openDefaultModal = useCallback(async (item) => {
    setDefaultModal({ open: true, material: item });
    setSelectedInventoryId('');
    setDefaultRackOptions([]);
    setDefaultLoading(true);
    try {
      const res = await getRacksByMaterialId(item.id);
      if (!res?.error) {
        const opts = (res.data || []).map((r) => ({
          label: `${r.rack?.warehouseName ? r.rack.warehouseName + ' - ' : ''}${r.rack?.name || ''}${r.isDefault ? ' (Default)' : ''}`,
          value: String(r.id),
        }));
        setDefaultRackOptions(opts);
      } else {
        toast.error('Failed to load racks for this tool.');
      }
    } catch (e) {
      toast.error('Failed to load racks for this tool.');
    } finally {
      setDefaultLoading(false);
    }
  }, [toast]);

  const closeDefaultModal = () => {
    setDefaultModal({ open: false, material: null });
    setSelectedInventoryId('');
    setDefaultRackOptions([]);
  };

  const applySetDefault = async () => {
    if (defaultSaving) return;
    if (!selectedInventoryId) {
      toast.error('Please select a rack / inventory record.');
      return;
    }
    try {
      setDefaultSaving(true);
      const res = await setDefaultMaterialInventory(Number(selectedInventoryId));
      if (res?.error) throw new Error(res.error);
      toast.success('Default inventory set successfully.');
      closeDefaultModal();
    } catch (err) {
      toast.error('Failed to set default inventory.');
    } finally {
      setDefaultSaving(false);
    }
  };

  const applyDelete = async () => {
    if (deleteLoading || !deleteModal.material?.id) return;
    try {
      setDeleteLoading(true);
      const res = await deleteMaterial(deleteModal.material.id);
      if (res?.error) throw new Error(res.error);
      setInventory((prev) => prev.filter((item) => String(item.id) !== String(deleteModal.material.id)));
      toast.success('Tool deleted');
      setDeleteModal({ open: false, material: null });
    } catch (err) {
      toast.error('Failed to delete tool');
    } finally {
      setDeleteLoading(false);
    }
  };

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
        options: inventoryRackOptions,
        validator: Yup.string().required('Rack is required'),
      },
      { name: 'quantity', label: 'Quantity', type: 'number', value: 0, hidden: true, validator: Yup.number().min(0).notRequired() },
      { name: 'stockLevel', label: 'Stock Level', type: 'number', value: 0, validator: Yup.number().min(0).notRequired() },
    ];
  }, [inventoryModal.material, inventoryRackOptions]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/materialsSettings/tools/toolsForm?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/materialsSettings/tools/toolsForm?id=${item.id}&mode=edit`) },
      { key: 'createInventory', label: 'Create Inventory', icon: <FiPackage size={14} />, onClick: openInventoryModal },
      { key: 'setDefault', label: 'Set Default', icon: <FiStar size={14} />, onClick: openDefaultModal },
      { key: 'delete', label: 'Delete', icon: <FiTrash2 size={14} />, onClick: (item) => setDeleteModal({ open: true, material: item }) },
    ],
    [router, openInventoryModal, openDefaultModal]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', sortable: false, render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

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
      item.purchasePrice && String(item.purchasePrice),
      item.id,
      item.createdBy,
      item.createdDate,
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
        loading={defaultLoading}
      />

      <ItemModal
        headerLabel="Create Inventory"
        mode="new"
        itemIndex={-1}
        isOpen={inventoryModal.open}
        fields={inventoryFields}
        loading={inventoryRacksLoading}
        onItemRemove={() => {}}
        onClose={async (val) => {
          if (!val) {
            setInventoryModal({ open: false, material: null });
            setInventoryRackOptions([]);
            return;
          }
          try {
            const payload = {
              name: val.name || '',
              code: val.code || '',
              rackId: Number(val.rackId) || 0,
              materialId: Number(val.materialId) || 0,
              quantity: 0,
              stockLevel: Number(val.stockLevel) || 0,
              isDefault: true,
            };
            const result = await createMaterialInventory(payload);
            if (result.error) throw new Error(result.error);
            toast.success('Inventory record created');
          } catch (err) {
            toast.error('Failed to create inventory record');
          } finally {
            setInventoryModal({ open: false, material: null });
            setInventoryRackOptions([]);
          }
        }}
      />

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Tool"
        message={`Are you sure you want to delete "${deleteModal.material?.name || deleteModal.material?.code || ''}"?`}
        confirmText={deleteLoading ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
        onConfirm={applyDelete}
        onCancel={() => {
          if (!deleteLoading) setDeleteModal({ open: false, material: null });
        }}
      />

      <ConfirmModal
        open={defaultModal.open}
        title="Set Default Inventory"
        message="Select the rack / inventory record to set as the default for this tool."
        confirmText={defaultSaving ? 'Saving...' : 'Set Default'}
        confirmVariant="primary"
        onConfirm={applySetDefault}
        onCancel={closeDefaultModal}
      >
        <div style={{ marginBottom: '12px' }}>
          {defaultLoading ? (
            <div style={{ fontSize: '13px', color: '#64748b' }}>Loading racks...</div>
          ) : (
            <Select
              value={selectedInventoryId}
              onChange={(e) => setSelectedInventoryId(e.target.value)}
              options={defaultRackOptions}
              placeholder="Select a rack..."
              searchable
              disabled={defaultSaving}
            />
          )}
          {defaultModal.material?.name ? (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              Tool: {defaultModal.material.name}
            </div>
          ) : null}
        </div>
      </ConfirmModal>
    </>
  );
}