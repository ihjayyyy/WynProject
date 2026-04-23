import React, { useMemo, useState, useEffect } from 'react';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import AssemblyMaterialModal from './AssemblyMaterialModal';
import styles from './AssemblyMaterialsTable.module.scss';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Button from '../ui/Button/Button';

export default function AssemblyMaterialsTable({ items = [], onChange, editable = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localItems, setLocalItems] = useState([]);
  const [deletedChildren, setDeletedChildren] = useState([]);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialEditing, setMaterialEditing] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    const mapped = (items || []).map((it) => ({ ...it, _localId: it._localId || `r-${Date.now()}-${Math.floor(Math.random() * 10000)}` }));
    setLocalItems(mapped);
  }, [items]);

  const filtered = useMemo(() => {
    const k = (searchTerm || '').trim().toLowerCase();
    if (!k) return localItems || [];
    return (localItems || []).filter((it) =>
      [it.code, it.name, it.uom]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [localItems, searchTerm]);

  let columns = [
    { header: 'Name', key: 'name', width: '180px' },
    { header: 'Code', key: 'code', width: '120px' },
    { header: 'Material ID', key: 'materialId', width: '120px' },
    { header: 'UOM', key: 'uom', width: '100px' },
    { header: 'Quantity', key: 'quantity', align: 'right', width: '100px' },
  ];
  if (editable) {
    columns.push({
      header: 'Actions',
      key: '__actions',
      align: 'right',
      width: '120px',
      render: (it) => {
        return (
          <div className={styles.actionCell}>
            <Button size="sm" variant="outlinedPrimary" icon={<FiEdit2 />} title="Edit" onClick={() => { setMaterialEditing(it); setIsMaterialModalOpen(true); }} />
            <Button size="sm" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => { setConfirmTarget(it); setIsConfirmOpen(true); }} />
          </div>
        );
      }
    });
  }

  const data = (filtered || []).map((r, idx) => ({ ...r, id: r.id || r._localId || idx }));

  // Helper to sanitize for API
  const sanitizeForApi = (arr) =>
    (arr || []).map((item) => {
      const base = {
        name: item.name || '',
        code: item.code || '',
        parentMaterialId: Number(item.parentMaterialId) || 0,
        materialId: Number(item.materialId) || 0,
        quantity: Number(item.quantity) || 0,
        uom: Number(item.uom) || 0,
      };
      // Only include id if it exists
      if (item.id !== undefined) base.id = item.id;
      return base;
    });

  const handleMaterialConfirm = (m, options = {}) => {
    if (materialEditing) {
      setLocalItems((prev) => {
        let matched = false;
        const updated = (prev || []).map((p) => {
          const matchById = materialEditing && materialEditing.id && Number(materialEditing.id) !== 0 && p.id === materialEditing.id;
          const matchByLocal = materialEditing && materialEditing._localId && p._localId === materialEditing._localId;
          if (matchById || matchByLocal) {
            matched = true;
            return { ...p, ...m };
          }
          return p;
        });
        if (!matched) {
          const fallbackIndex = (prev || []).findIndex((p) => p.code === (materialEditing && materialEditing.code) && p.name === (materialEditing && materialEditing.name));
          if (fallbackIndex !== -1) {
            matched = true;
            const p = (prev || [])[fallbackIndex];
            updated[fallbackIndex] = { ...p, ...m };
          }
        }
        // sanitize before onChange
        if (typeof onChange === 'function') onChange(sanitizeForApi(updated), sanitizeForApi(deletedChildren));
        return updated;
      });
    } else {
      const item = { id: 0, _localId: `M-${Date.now()}`, ...m };
      setLocalItems((prev) => {
        const updated = [item, ...(prev || [])];
        // sanitize before onChange
        if (typeof onChange === 'function') onChange(sanitizeForApi(updated), sanitizeForApi(deletedChildren));
        return updated;
      });
    }
    if (options.closeModal !== false) {
      setIsMaterialModalOpen(false);
      setMaterialEditing(null);
    }
  };

  const handleConfirmDelete = () => {
    const sel = (localItems || []).find((p) => (confirmTarget && p._localId && confirmTarget._localId && p._localId === confirmTarget._localId) || (confirmTarget && confirmTarget.id && Number(confirmTarget.id) !== 0 && p.id === confirmTarget.id)) || confirmTarget;
    if (sel) {
      setLocalItems((prev) => {
        const updated = (prev || []).filter((p) => p._localId !== (sel._localId || confirmTarget._localId));
        setDeletedChildren((dprev) => {
          const prevDeleted = dprev || [];
          const exists = (() => {
            if (!sel) return false;
            if (sel.id && Number(sel.id) !== 0) {
              return prevDeleted.some((p) => Number(p.id) === Number(sel.id));
            }
            if (sel._localId && prevDeleted.some((p) => p._localId === sel._localId)) return true;
            if (sel.code && sel.name) {
              return prevDeleted.some((p) => p.code === sel.code && p.name === sel.name);
            }
            return false;
          })();
          const dnew = exists ? prevDeleted : [...prevDeleted, sel];
          // sanitize before onChange
          if (typeof onChange === 'function') onChange(sanitizeForApi(updated), sanitizeForApi(dnew));
          return dnew;
        });
        return updated;
      });
    }
    setIsConfirmOpen(false);
    setConfirmTarget(null);
  };

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Assembly Materials</h2>
        <div className={styles.headerActions}>
          <SearchBar placeholder="Search materials" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton={editable} buttonLabel="Add Material" handleOnClick={() => { setMaterialEditing(null); setIsMaterialModalOpen(true); }} width="320px" />
        </div>
      </div>

      <div className={styles.tableSection}>

          <DataTable columns={columns} data={data} showActions={false} emptyMessage="No materials" />

      </div>

      <AssemblyMaterialModal open={isMaterialModalOpen} initial={materialEditing || {}} onCancel={() => { setIsMaterialModalOpen(false); setMaterialEditing(null); }} onConfirm={handleMaterialConfirm} />

      <ConfirmModal open={isConfirmOpen} title="Remove material?" message={confirmTarget ? `Remove material \"${confirmTarget.name || confirmTarget.code || ''}\"?` : 'Remove this material?'} confirmText="Remove" confirmVariant="danger" onConfirm={handleConfirmDelete} onCancel={() => { setIsConfirmOpen(false); setConfirmTarget(null); }} />
    </div>
  );
}
