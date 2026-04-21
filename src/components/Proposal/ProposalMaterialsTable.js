import React, { useMemo, useState, useEffect } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import pmStyles from './ProposalMaterialsTable.module.scss';
import Button from '../ui/Button/Button';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import ProposalScopeModal from './ProposalScopeModal';
import ProposalMaterialModal from './ProposalMaterialModal';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';

function formatDate(v) {
  if (!v) return '';
  try {
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString();
  } catch (err) {
    return String(v);
  }
}

export default function ProposalMaterialsTable({ items = [], onChange, editable = true, proposalId = 0 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localItems, setLocalItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true); // toggle to simulate admin view
  const [deletedChildren, setDeletedChildren] = useState([]);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeEditing, setScopeEditing] = useState(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialScopeTarget, setMaterialScopeTarget] = useState(null);
  const [materialEditing, setMaterialEditing] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  // (deleted helper removed) centralized deletion logic below

  // ensure every item has a localId for stable local rendering
  useEffect(() => {
    const mapped = (items || []).map((it) => ({ ...it, _localId: it._localId || `r-${Date.now()}-${Math.floor(Math.random() * 10000)}` }));
    setLocalItems(mapped);
  }, [items]);

  const filtered = useMemo(() => {
    const k = (searchTerm || '').trim().toLowerCase();
    if (!k) return localItems || [];
    return (localItems || []).filter((it) =>
      [it.code, it.name, it.materialType, it.uom]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [localItems, searchTerm]);

  const groups = useMemo(() => {
    const map = {};
    (filtered || []).forEach((it) => {
      const key = it.scopeOfWork || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    return map;
  }, [filtered]);

  const groupKeys = Object.keys(groups);

  // build columns (omit Actions column when not editable)
  let columns = [
    { header: 'Material', key: 'material', width: '260px', render: (it) => {
      if (!it || it.isTotalRow) return '';
      return (
        <div className={pmStyles.materialCell}>
          <div className={pmStyles.materialCode}>{it.code || ''}</div>
          <div className={pmStyles.materialName}>{it.name || ''}</div>
        </div>
      );
    } },
    { header: 'Type', key: 'materialType', width: '100px' },
    { header: 'Unit Cost', key: 'unitCost', align: 'right', width: '120px', render: (it) => (((it && it.isTotalRow) || it.unitCost === '' || it.unitCost == null) ? '' : Number(it.unitCost).toLocaleString()) },
    { header: 'UoM', key: 'uom', width: '80px' },
    { header: 'Qty', key: 'quantity', align: 'right', width: '80px' },
    { header: 'VAT', key: 'vat', align: 'right', width: '100px', render: (it) => Number(it.vat || 0).toLocaleString() },
    { header: 'Material Cost', key: 'materialCost', align: 'right', width: '140px', render: (it) => Number(it.materialCost || 0).toLocaleString() },
    { header: 'Labor Cost', key: 'laborCost', align: 'right', width: '120px', render: (it) => Number(it.laborCost || 0).toLocaleString() },
    { header: 'Margin', key: 'margin', align: 'right', width: '100px', render: (it) => (it && (it.margin !== undefined && it.margin !== null) ? Number(it.margin).toLocaleString() : '') },
    { header: 'Total', key: 'totalPrice', align: 'right', width: '140px', render: (it) => Number(it.totalPrice || it.totalAmount || 0).toLocaleString() },
  ];

  if (editable) {
    columns.push({ header: 'Actions', key: '__actions', align: 'right', width: '120px', render: (it) => {
      if (!it || it.isTotalRow || it.fullRow) return null;
      return (
        <div className={pmStyles.actionCell}>
          <Button size="sm" variant="outlinedPrimary" icon={<FiEdit2 />} title="Edit" onClick={() => { setMaterialEditing(it); setMaterialScopeTarget(it.scopeOfWork || 'General'); setIsMaterialModalOpen(true); }} />
          <Button size="sm" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => {
            setConfirmTarget(it);
            setIsConfirmOpen(true);
          }} />
        </div>
      );
    } });
  }

  // hide these columns for admin view
  const hiddenForAdmin = ['vat', 'materialCost', 'laborCost', 'margin', 'totalPrice'];
  const displayedColumns = isAdmin ? columns.filter((c) => !hiddenForAdmin.includes(c.key)) : columns;

  // build grouped data with headers and totals
  const data = [];
  groupKeys.forEach((scope) => {
    const rows = groups[scope];
    const materialTotal = rows.reduce((s, r) => s + (Number(r.materialCost) || 0), 0);
    const laborTotal = rows.reduce((s, r) => s + (Number(r.laborCost) || 0), 0);
    const totalPrice = rows.reduce((s, r) => s + (Number(r.totalPrice || r.totalAmount) || 0), 0);

    data.push({
      id: `${scope}-header`,
      fullRow: true,
      fullRowContent: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={pmStyles.groupHeader}>
            <span className={pmStyles.groupHeaderLabel}>Scope of Work:</span>
            <span className={pmStyles.scopeName}>{scope}</span>
          </div>
          <div className={pmStyles.scopeActions}>
            {editable && (
              <>
                <Button size="sm" variant="outlinedPrimary" className={pmStyles.btnSmall} icon={<FiPlus />} title="Add Material" onClick={() => { setMaterialEditing(null); setMaterialScopeTarget(scope); setIsMaterialModalOpen(true); }} />
                <Button size="sm" variant="outlinedPrimary" className={pmStyles.btnSmall} icon={<FiEdit2 />} title="Edit Scope" onClick={() => { setScopeEditing(scope); setIsScopeModalOpen(true); }} />
              </>
            )}
          </div>
        </div>
      ),
    });

    rows.forEach((r) => {
      // skip scope-only placeholder entries
      if (r && r.__isScope) return;
      // Prefer keeping the original numeric id for saved rows so edits preserve server ids.
      // Only fall back to _localId or generated id for new/unsaved rows (id === 0 or undefined).
      const hasSavedId = r && r.id !== undefined && Number(r.id) !== 0;
      const rowKey = hasSavedId ? r.id : (r._localId || `row-${scope}-${Math.random()}`);
      data.push({
        ...r,
        // keep original numeric `id` when present; otherwise use a stable row key for rendering
        id: hasSavedId ? r.id : rowKey,
        _rowKey: rowKey,
        forecast: `${formatDate(r.forecastedStartDate)}${r.forecastedEndDate ? ` — ${formatDate(r.forecastedEndDate)}` : ''}`,
      });
    });

    if (!isAdmin) {
      data.push({ id: `${scope}-total`, isTotalRow: true, code: '', name: '', quantity: '', unitCost: '', materialCost: materialTotal, laborCost: laborTotal, totalPrice: totalPrice });
    }
  });

  return (
    <div className={pmStyles.landingWrap}>
      <div className={pmStyles.headerRow}>
        <h2 className={pmStyles.title}>Scope of Work</h2>
        <div className={pmStyles.headerActions}>
          <SearchBar placeholder="Search scope of work" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton={editable} buttonLabel="Add Scope" handleOnClick={() => { setScopeEditing(null); setIsScopeModalOpen(true); }} width="320px" />
        </div>
      </div>

      <div className={pmStyles.tableSection}>
        {groupKeys.length === 0 ? (
          <div className={pmStyles.empty}>No materials match your search</div>
        ) : (
          <DataTable columns={displayedColumns} data={data} showActions={false} emptyMessage="No materials" />
        )}
      </div>

      <ProposalScopeModal open={isScopeModalOpen} initial={scopeEditing} onCancel={() => { setIsScopeModalOpen(false); setScopeEditing(null); }} onConfirm={(val) => {
        if (!scopeEditing) {
          const newItem = { id: 0, _localId: `S-${Date.now()}`, scopeOfWork: val, __isScope: true, parentId: proposalId ? Number(proposalId) : undefined };
          setLocalItems((prev) => {
            const updated = [newItem, ...(prev || [])];
            if (typeof onChange === 'function') onChange(updated, deletedChildren);
            return updated;
          });
          // open material modal for the newly created scope
          setMaterialEditing(null);
          setMaterialScopeTarget(val);
          setIsMaterialModalOpen(true);
        } else {
          setLocalItems((prev) => {
            const updated = (prev || []).map((it) => (it.scopeOfWork === scopeEditing ? { ...it, scopeOfWork: val } : it));
            if (typeof onChange === 'function') onChange(updated, deletedChildren);
            return updated;
          });
        }
        setIsScopeModalOpen(false);
        setScopeEditing(null);
      }} />

      <ProposalMaterialModal open={isMaterialModalOpen} initial={materialEditing || { parentId: Number(proposalId) || 0, scopeOfWork: materialScopeTarget || 'General' }} keepOpenOnSave={!materialEditing} onCancel={() => { setIsMaterialModalOpen(false); setMaterialScopeTarget(null); setMaterialEditing(null); }} onConfirm={(m, options = {}) => {
        if (materialEditing) {
          // update existing
          setLocalItems((prev) => {
              let matched = false;
              const updated = (prev || []).map((p) => {
                const matchById = materialEditing && materialEditing.id && Number(materialEditing.id) !== 0 && p.id === materialEditing.id;
                const matchByLocal = materialEditing && materialEditing._localId && p._localId === materialEditing._localId;
                if (matchById || matchByLocal) {
                  matched = true;
                  const parentId = p.parentId !== undefined && p.parentId !== null ? p.parentId : (proposalId ? Number(proposalId) : undefined);
                  return { ...p, ...m, parentId };
                }
                return p;
              });
              // If somehow no existing row matched (race / stale ids), try to match by code+name+parentId and update that one
              if (!matched) {
                const fallbackIndex = (prev || []).findIndex((p) => p.code === (materialEditing && materialEditing.code) && p.name === (materialEditing && materialEditing.name) && p.parentId === (materialEditing && materialEditing.parentId));
                if (fallbackIndex !== -1) {
                  matched = true;
                  const p = (prev || [])[fallbackIndex];
                  updated[fallbackIndex] = { ...p, ...m, parentId: p.parentId !== undefined && p.parentId !== null ? p.parentId : (proposalId ? Number(proposalId) : undefined) };
                }
              }
              if (typeof onChange === 'function') onChange(updated, deletedChildren);
              return updated;
          });
        } else {
          const item = { id: 0, _localId: `M-${Date.now()}`, ...m, scopeOfWork: materialScopeTarget || 'General', parentId: proposalId ? Number(proposalId) : undefined };
          setLocalItems((prev) => {
            const updated = [item, ...(prev || [])];
            if (typeof onChange === 'function') onChange(updated, deletedChildren);
            return updated;
          });
        }
        if (options.closeModal !== false) {
          setIsMaterialModalOpen(false);
          setMaterialScopeTarget(null);
          setMaterialEditing(null);
        }
      }} />
      
        <ConfirmModal open={isConfirmOpen} title="Remove material?" message={confirmTarget ? `Remove material "${confirmTarget.name || confirmTarget.code || ''}"?` : 'Remove this material?'} confirmText="Remove" confirmVariant="danger" onConfirm={() => {
          // use canonical item from localItems to preserve original id (if present)
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
                    return prevDeleted.some((p) => p.code === sel.code && p.name === sel.name && p.parentId === sel.parentId);
                  }
                  return false;
                })();
                const dnew = exists ? prevDeleted : [...prevDeleted, sel];
                if (typeof onChange === 'function') onChange(updated, dnew);
                try { console.log('Proposal materials changed (debug) - delete:', { updated, deleted: dnew }); } catch (err) {}
                return dnew;
              });
              return updated;
            });
          }
          setIsConfirmOpen(false);
          setConfirmTarget(null);
        }} onCancel={() => { setIsConfirmOpen(false); setConfirmTarget(null); }} />
    </div>
  );
}
