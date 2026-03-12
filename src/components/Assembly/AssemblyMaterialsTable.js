'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import ProposalMaterialsModal from '../Proposal/ProposalMaterials/ProposalMaterialsModal';
import { sampleAssemblyMaterials } from './assemblyData';
import { sampleMaterials } from '../Materials/materialsData';
import { sampleMaterialInventory } from '../Inventory/materialInventoryData';
import styles from './AssemblyMaterialsTable.module.scss';

export default function AssemblyMaterialsTable({ assemblyId, allowCreateBeforeSave = false, initialMaterials = null, onCreateMaterial, readOnly = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [materialsState, setMaterialsState] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!assemblyId) {
      setMaterialsState(initialMaterials || []);
      return;
    }
    setMaterialsState((sampleAssemblyMaterials || []).filter((m) => m.assemblyId === assemblyId));
  }, [assemblyId, initialMaterials]);

  const columns = useMemo(() => {
    const cols = [
      { header: 'Material Code', key: 'materialId' },
      { header: 'Material Name', key: 'materialName' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'UOM', key: 'uom' },
    ];

    if (!readOnly) {
      cols.push({
        header: 'Action',
        key: 'action',
        align: 'right',
        render: (item) => {
          if (!item) return null;
          const items = [
            {
              key: 'edit',
              label: 'Edit',
              icon: <FiEdit2 size={14} />,
              onClick: () => {
                setEditing(item);
                setIsModalOpen(true);
              },
            },
            {
              key: 'remove',
              label: 'Remove',
              icon: <FiTrash2 size={14} />,
              onClick: () => setMaterialsState((prev) => (prev || []).filter((p) => p.id !== item.id)),
            },
          ];
          return <DropdownAction item={item} items={items} />;
        },
      });
    }

    return cols;
  }, [readOnly]);

  const combined = useMemo(() => {
    const all = [ ...(sampleAssemblyMaterials || []), ...(initialMaterials || []), ...(materialsState || []) ];
    return (all || []).filter((m) => m.assemblyId === assemblyId);
  }, [assemblyId, initialMaterials, materialsState]);

  const filtered = useMemo(() => {
    const k = searchTerm.trim().toLowerCase();
    const mapName = (mid) => {
      const inv = (sampleMaterialInventory || []).find((si) => si.materialId === mid);
      if (inv && inv.name) return inv.name;
      const mat = (sampleMaterials || []).find((s) => s.id === mid);
      return (mat && (mat.name || mat.code)) || '';
    };

    if (!k) return combined.map((m) => ({ ...m, materialName: mapName(m.materialId) }));

    return combined
      .map((m) => ({ ...m, materialName: mapName(m.materialId) }))
      .filter((m) => [m.id, m.materialId, m.materialName, String(m.quantity), m.uom].filter(Boolean).some((v) => String(v).toLowerCase().includes(k)));
  }, [combined, searchTerm]);

  if (!assemblyId && !allowCreateBeforeSave) return null;

  return (
    <section className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Assembly Materials</h3>
        <SearchBar placeholder="Search materials" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton={!readOnly} buttonLabel="Add Material" handleOnClick={() => setIsModalOpen(true)} width="320px" />
      </div>

      <ProposalMaterialsModal
        open={isModalOpen}
        scopeName={null}
        initial={editing}
        onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onConfirm={(m) => {
          const mat = {
            id: editing?.id || `AM-${Date.now()}`,
            assemblyId: assemblyId || '',
            materialId: m.materialId || m.code || m.id || '',
            materialName: m.name || '',
            quantity: m.quantity || m.qty || '',
            uom: (sampleMaterials.find(s => s.id === (m.materialId || m.code || m.id)) || {}).uom || '',
            createdBy: m.createdBy || 'You',
            createdDate: m.createdDate || new Date().toISOString().slice(0,10),
          };
          if (editing) {
            setMaterialsState((prev) => (prev || []).map((p) => (p.id === mat.id ? mat : p)));
          } else {
            setMaterialsState((prev) => [mat, ...(prev || [])]);
            if (typeof onCreateMaterial === 'function') onCreateMaterial(mat);
          }
          setIsModalOpen(false);
          setEditing(null);
        }}
      />

      <DataTable columns={columns} data={filtered} showActions={false} emptyMessage="No assembly materials" />
    </section>
  );
}
