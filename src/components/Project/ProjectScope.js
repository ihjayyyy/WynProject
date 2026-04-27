import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import styles from './ProjectScope.module.scss';
import Button from '../ui/Button/Button';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import Input from '../ui/Input/Input';
import ProjectScopeModal from './ProjectScopeModal';
import ProjectMaterialModal from './ProjectMaterialModal';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { getByProjectId, createProjectScope, updateProjectScope } from '../../services/ProjectScope';
import { updateCompletedQuantity } from '../../services/ProjectMaterial';

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

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toIsoOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeScopeChild(child = {}, scopeId = 0) {
  return {
    name: child.name || '',
    code: child.code || '',
    id: toNumber(child.id),
    parentId: toNumber(child.parentId ?? scopeId),
    materialId: toNumber(child.materialId),
    materialType: child.materialType || '',
    uom: child.uom || '',
    unitCost: toNumber(child.unitCost),
    quantity: toNumber(child.quantity),
    vat: toNumber(child.vat),
    totalCost: toNumber(child.totalCost ?? child.materialCost ?? child.totalAmount ?? child.totalPrice),
    margin: toNumber(child.margin),
    isAssembly: Boolean(child.isAssembly),
    scopeOfWork: child.scopeOfWork || '',
    discount: toNumber(child.discount),
    laborCost: toNumber(child.laborCost),
    extendedCost: toNumber(child.extendedCost),
    totalAmount: toNumber(child.totalAmount ?? child.totalPrice),
    scopeId: toNumber(child.scopeId ?? scopeId),
    initialQuantity: toNumber(child.initialQuantity ?? child.quantity),
    remarks: child.remarks || '',
    proposalQuantity: toNumber(child.proposalQuantity),
    completedQuantity: toNumber(child.completedQuantity),
  };
}

function dedupeChildren(items = []) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = toNumber(item.id)
      ? `id:${toNumber(item.id)}`
      : `tmp:${item.code || ''}|${item.name || ''}|${toNumber(item.parentId)}|${toNumber(item.materialId)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildScopePayload({
  projectId,
  base = {},
  overrides = {},
  children = [],
  deletedChildren = [],
}) {
  const scopeId = toNumber(base.id || overrides.id);
  const description = overrides.description ?? base.description ?? base.name ?? '';
  const name = (overrides.name ?? base.name ?? description) || 'New Scope';

  return {
    name,
    code: overrides.code ?? base.code ?? '',
    children: dedupeChildren(children).map((child) => normalizeScopeChild(child, scopeId)),
    deletedChildren: dedupeChildren(deletedChildren).map((child) => normalizeScopeChild(child, scopeId)),
    projectId: toNumber(projectId),
    percentage: toNumber(overrides.percentage ?? base.percentage),
    description,
    margin: toNumber(overrides.margin ?? base.margin),
    forecastedStartDate: toIsoOrNull(overrides.forecastedStartDate ?? base.forecastedStartDate),
    forecastedEndDate: toIsoOrNull(overrides.forecastedEndDate ?? base.forecastedEndDate),
    actualStartDate: toIsoOrNull(overrides.actualStartDate ?? base.actualStartDate),
    actualEndDate: toIsoOrNull(overrides.actualEndDate ?? base.actualEndDate),
    milestoneDate: toIsoOrNull(overrides.milestoneDate ?? base.milestoneDate),
    scopeOfWork: overrides.scopeOfWork ?? base.scopeOfWork ?? description,
    scopeAmount: toNumber(overrides.scopeAmount ?? base.scopeAmount),
  };
}

export default function ProjectScope({ projectId = 0, editable = true }) {
  const [isCompletedQtyModalOpen, setIsCompletedQtyModalOpen] = useState(false);
  const [completedQtyTarget, setCompletedQtyTarget] = useState(null);
  const [completedQtyValue, setCompletedQtyValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [localItems, setLocalItems] = useState([]);
  const [deletedChildren, setDeletedChildren] = useState([]);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [scopeEditing, setScopeEditing] = useState(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialScopeTarget, setMaterialScopeTarget] = useState(null);
  const [materialEditing, setMaterialEditing] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [scopesList, setScopesList] = useState([]);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getByProjectId(projectId);
      if (!res || res.error) {
        setLocalItems([]);
        setScopesList([]);
        return;
      }
      // If API returned an object with .value (some endpoints), handle that
      const raw = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.value) ? res.data.value : res.data || []);
      if (!Array.isArray(raw)) {
        setLocalItems([]);
        setScopesList([]);
        return;
      }
      setScopesList(raw || []);
      const flattened = [];
      (raw || []).forEach((scope) => {
        const scopeName = scope.description || scope.name || scope.code || '';
        if (Array.isArray(scope.children) && scope.children.length) {
          scope.children.forEach((c) => {
            flattened.push({
              ...c,
              scopeOfWork: c.scopeOfWork || scopeName || 'General',
              parentId: c.parentId ?? scope.id ?? projectId,
              _localId: c._localId || `srv-${scope.id || ''}-${c.id || Math.floor(Math.random()*10000)}`,
            });
          });
        } else {
          // No children: just ensure the group header will be created by adding a dummy entry to a set
          flattened.push({
            __isScopeHeaderOnly: true,
            scopeOfWork: scopeName || 'General',
            parentId: scope.id ?? projectId,
            id: scope.id,
          });
        }
      });
      setLocalItems(flattened);
    } catch (err) {
      setLocalItems([]);
      setScopesList([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  let columns = [
    { header: 'Material', key: 'material', width: '260px', render: (it) => {
      if (!it || it.isTotalRow) return '';
      return (
        <div className={styles.materialCell}>
          <div className={styles.materialCode}>{it.code || ''}</div>
          <div className={styles.materialName}>{it.name || ''}</div>
        </div>
      );
    } },
    { header: 'Type', key: 'materialType', width: '100px' },
    // { header: 'Unit Cost', key: 'unitCost', align: 'right', width: '120px', render: (it) => (((it && it.isTotalRow) || it.unitCost === '' || it.unitCost == null) ? '' : Number(it.unitCost).toLocaleString()) },
    { header: 'UoM', key: 'uom', width: '80px' },
    { header: 'Qty', key: 'quantity', align: 'right', width: '80px' },
    // { header: 'VAT', key: 'vat', align: 'right', width: '100px', render: (it) => Number(it.vat || 0).toLocaleString() },
    // { header: 'Material Cost', key: 'materialCost', align: 'right', width: '140px', render: (it) => Number(it.materialCost || 0).toLocaleString() },
    // { header: 'Labor Cost', key: 'laborCost', align: 'right', width: '120px', render: (it) => Number(it.laborCost || 0).toLocaleString() },
    // { header: 'Margin', key: 'margin', align: 'right', width: '100px', render: (it) => (it && (it.margin !== undefined && it.margin !== null) ? Number(it.margin).toLocaleString() : '') },
    { header: 'Completed Qty', key: 'completedQuantity', align: 'right', width: '120px', render: (it) => (it && it.completedQuantity != null ? Number(it.completedQuantity).toLocaleString() : '') },
    { header: 'Total', key: 'totalCost', align: 'right', width: '140px', render: (it) => Number(it.totalPrice || it.totalAmount || 0).toLocaleString() },
  ];

  if (editable) {
    columns.push({
      header: 'Actions',
      key: '__actions',
      align: 'right',
      width: '140px',
      render: (it) => {
        if (!it || it.isTotalRow || it.fullRow) return null;
        return (
          <div className={styles.actionCell}>
            <Button size="sm" variant="outlinedPrimary" icon={<FiEdit2 />} title="Edit" onClick={() => { setMaterialEditing(it); setMaterialScopeTarget(it.scopeOfWork || 'General'); setIsMaterialModalOpen(true); }} />
            <Button size="sm" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => {
              setConfirmTarget(it);
              setIsConfirmOpen(true);
            }} />
            <Button
              size="sm"
              variant="success"
              icon={<FiCheckCircle size={20} color="#22c55e" />} // Tailwind green-500
              title="Update Completed Quantity"
              onClick={() => {
                setCompletedQtyTarget(it);
                setCompletedQtyValue(it.completedQuantity ?? 0);
                setIsCompletedQtyModalOpen(true);
              }}
            />
          </div>
        );
      }
    });
  }

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
          <div className={styles.groupHeader}>
            <span className={styles.groupHeaderLabel}>Scope of Work:</span>
            <span className={styles.scopeName}>{scope}</span>
          </div>
          <div className={styles.scopeActions}>
            {editable && (
              <>
                <Button size="sm" variant="outlinedPrimary" className={styles.btnSmall} icon={<FiPlus />} title="Add Material" onClick={() => { setMaterialEditing(null); setMaterialScopeTarget(scope); setIsMaterialModalOpen(true); }} />
                <Button size="sm" variant="outlinedPrimary" className={styles.btnSmall} icon={<FiEdit2 />} title="Edit Scope" onClick={() => {
                  // find scope object from scopesList by matching name/code/description
                  const found = (scopesList || []).find(s => (s.description && s.description === scope) || (s.name && s.name === scope) || (s.code && s.code === scope));
                  setScopeEditing(found || scope);
                  setIsScopeModalOpen(true);
                }} />
              </>
            )}
          </div>
        </div>
      ),
    });

    rows.forEach((r) => {
      if (r && r.__isScope) return;
      // If this is a header-only placeholder, do not render a material row
      if (r && r.__isScopeHeaderOnly) {
        return;
      }
      const hasSavedId = r && r.id !== undefined && Number(r.id) !== 0;
      const rowKey = hasSavedId ? r.id : (r._localId || `row-${scope}-${Math.random()}`);
      data.push({
        ...r,
        id: hasSavedId ? r.id : rowKey,
        _rowKey: rowKey,
        forecast: `${formatDate(r.forecastedStartDate)}${r.forecastedEndDate ? ` — ${formatDate(r.forecastedEndDate)}` : ''}`,
      });
    });

    data.push({ id: `${scope}-total`, isTotalRow: true, code: '', name: '', quantity: '', unitCost: '', materialCost: materialTotal, laborCost: laborTotal, totalPrice: totalPrice });
  });

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Scope of Work</h2>
        <div className={styles.headerActions}>
          <SearchBar placeholder="Search scope of work" value={searchTerm} onChange={setSearchTerm} showFilter={false} showButton={editable} buttonLabel="Add Scope" handleOnClick={() => { setScopeEditing(null); setIsScopeModalOpen(true); }} width="320px" />
        </div>
      </div>

      <div className={styles.tableSection}>
        {groupKeys.length === 0 ? (
          <div className={styles.empty}>No materials match your search</div>
        ) : (
          <DataTable columns={columns} data={data} showActions={false} emptyMessage="No materials" />
        )}
      </div>

<ConfirmModal
                open={isCompletedQtyModalOpen}
                title="Update Completed Quantity"
                message={completedQtyTarget ? `Set completed quantity for \"${completedQtyTarget.name || completedQtyTarget.code || ''}\"` : ''}
                confirmText="Save"
                confirmVariant="success"
                onCancel={() => { setIsCompletedQtyModalOpen(false); setCompletedQtyTarget(null); }}
                onConfirm={async () => {
                  if (completedQtyTarget) {
                    const res = await updateCompletedQuantity(completedQtyTarget.id, Number(completedQtyValue));
                    setIsCompletedQtyModalOpen(false);
                    setCompletedQtyTarget(null);
                    if (!res.error) await loadData();
                    else window.alert('Failed to update: ' + res.error);
                  }
                }}
              >
                <div style={{ margin: '16px 0' }}>
                  <Input
                    type="number"
                    min={0}
                    value={completedQtyValue}
                    onChange={e => setCompletedQtyValue(e.target.value)}
                    autoFocus
                    id="completed-qty-input"
                  />
                </div>
              </ConfirmModal>

      <ProjectScopeModal
        open={isScopeModalOpen}
        initial={scopeEditing}
        onCancel={() => { setIsScopeModalOpen(false); setScopeEditing(null); }}
        onConfirm={async (val) => {
          try {
            if (!scopeEditing) {
              const payload = buildScopePayload({ projectId, overrides: val, children: [], deletedChildren: [] });
              const res = await createProjectScope(payload);
              if (res && !res.error) await loadData();
            } else {
              const existing = typeof scopeEditing === 'object' ? scopeEditing : (scopesList || []).find(s => (s.description && s.description === scopeEditing) || (s.name && s.name === scopeEditing) || (s.code && s.code === scopeEditing));
              if (existing && existing.id) {
                const payload = buildScopePayload({
                  projectId,
                  base: existing,
                  overrides: val,
                  children: existing.children || [],
                  deletedChildren: existing.deletedChildren || [],
                });
                const res = await updateProjectScope(existing.id, payload);
                if (res && !res.error) await loadData();
              }
            }
          } catch (err) {
            // ignore
          }
          setIsScopeModalOpen(false);
          setScopeEditing(null);
        }}
      />

      <ProjectMaterialModal open={isMaterialModalOpen} initial={materialEditing || { parentId: Number(projectId) || 0, scopeOfWork: materialScopeTarget || 'General' }} keepOpenOnSave={!materialEditing} onCancel={() => { setIsMaterialModalOpen(false); setMaterialScopeTarget(null); setMaterialEditing(null); }} onConfirm={async (m, options = {}) => {
        try {
          // find scope object by parentId or scopeOfWork
          const scopeName = m.scopeOfWork || materialScopeTarget || 'General';
          let scopeObj = null;
          if (m.parentId && Number(m.parentId) !== 0) {
            scopeObj = (scopesList || []).find(s => Number(s.id) === Number(m.parentId));
          }
          if (!scopeObj) {
            scopeObj = (scopesList || []).find(s => (s.description && s.description === scopeName) || (s.name && s.name === scopeName) || (s.code && s.code === scopeName));
          }

          if (scopeObj && scopeObj.id) {
            // prepare updated children
            const existingChildren = Array.isArray(scopeObj.children) ? scopeObj.children.slice() : [];
            if (m.id && Number(m.id) !== 0) {
              // update existing child
              const idx = existingChildren.findIndex(c => Number(c.id) === Number(m.id));
              if (idx !== -1) existingChildren[idx] = { ...existingChildren[idx], ...m };
              else existingChildren.push({ ...m, parentId: scopeObj.id });
            } else {
              // new child
              existingChildren.push({ ...m, id: 0, parentId: scopeObj.id });
            }

            const scopeNameFromObj = scopeObj.description || scopeObj.name || scopeObj.code || '';
            const pendingDeletedChildren = (deletedChildren || []).filter((c) => (
              Number(c.parentId) === Number(scopeObj.id)
              || ((c.scopeOfWork || '') && (c.scopeOfWork || '') === scopeNameFromObj)
            ));

            const payload = buildScopePayload({
              projectId,
              base: scopeObj,
              overrides: {
                name: scopeObj.name || scopeObj.description || scopeName,
                description: scopeObj.description || scopeObj.name || scopeName,
              },
              children: existingChildren,
              deletedChildren: [...(scopeObj.deletedChildren || []), ...pendingDeletedChildren],
            });

            const res = await updateProjectScope(scopeObj.id, payload);
            if (!res || res.error) {
              // fallback to local update on error
              if (m.id && Number(m.id) !== 0) {
                setLocalItems(prev => (prev || []).map(p => (p.id === m.id ? { ...p, ...m } : p)));
              } else {
                const item = { id: 0, _localId: `M-${Date.now()}`, ...m, scopeOfWork: scopeName, parentId: scopeObj.id };
                setLocalItems(prev => [item, ...(prev || [])]);
              }
            } else {
              setDeletedChildren((prev) => (prev || []).filter((c) => !pendingDeletedChildren.includes(c)));
              await loadData();
            }
          } else {
            // no scope found - create scope with this child
            const scopePayload = buildScopePayload({
              projectId,
              overrides: { name: scopeName, description: scopeName },
              children: [{ ...m, id: 0, parentId: 0 }],
              deletedChildren: [],
            });
            const res = await createProjectScope(scopePayload);
            if (!res || res.error) {
              const item = { id: 0, _localId: `M-${Date.now()}`, ...m, scopeOfWork: scopeName, parentId: projectId };
              setLocalItems(prev => [item, ...(prev || [])]);
            } else {
              await loadData();
            }
          }
        } catch (err) {
          // fallback to local update if API fails
          if (materialEditing) {
            setLocalItems((prev) => (prev || []).map((p) => (p._localId === (materialEditing && materialEditing._localId) ? { ...p, ...m } : p)));
          } else {
            const item = { id: 0, _localId: `M-${Date.now()}`, ...m, scopeOfWork: materialScopeTarget || 'General', parentId: projectId };
            setLocalItems((prev) => [item, ...(prev || [])]);
          }
        }

        if (options.closeModal !== false) {
          setIsMaterialModalOpen(false);
          setMaterialScopeTarget(null);
          setMaterialEditing(null);
        }
      }} />

      <ConfirmModal open={isConfirmOpen} title="Remove material?" message={confirmTarget ? `Remove material "${confirmTarget.name || confirmTarget.code || ''}"?` : 'Remove this material?'} confirmText="Remove" confirmVariant="danger" onConfirm={() => {
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
