import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from '../ItemDetails/itemModal';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import styles from './ProjectScope.module.scss';
import { printMaterialRequests_byProject, createMaterialRequest, updateMaterialRequest, cancelMaterialRequest, INITIAL_MATERIAL_REQUEST, printMaterialRequest_byId, printMaterialRequest_byObj } from '../../services/MaterialRequest';
import { getByProjectId as getScopesByProjectId } from '../../services/ProjectScope';
import * as Yup from 'yup';
import { getAuthData } from '../../services/Auth';
import { useToast } from '../ui/Toast/Toast';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { FiPrinter, FiEdit2, FiXCircle } from 'react-icons/fi';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import InvalidPage from '@/components/InvalidPage/page';

export default function MaterialRequestsTab({ projectId, editable = true, projectNumber = '' }) {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [cancelingId, setCancelingId] = useState(null);
  const toast = useToast();
  const confirmModal = useConfirmModal();

  // Prefixes a display value with the record's assemblyCode, e.g.
  // "T8AFE4Y8 - Bolt, machine, 5/8\" x 12\"". Falls back to the plain
  // value when no assemblyCode is present on the record.
  const withAssembly = useCallback((item, value) => {
    const v = value ?? '';
    return item && item.assemblyCode ? `${item.assemblyCode} - ${v}` : v;
  }, []);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    const res = await printMaterialRequests_byProject(projectId);
    setItems(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!projectId) return;
      const res = await getScopesByProjectId(projectId);
      if (!mounted) return;
      const raw = Array.isArray(res.data) ? res.data : (res.data && Array.isArray(res.data.value) ? res.data.value : res.data || []);
      if (!Array.isArray(raw)) {
        setMaterials([]);
        return;
      }
      // Flatten children across scopes and dedupe by materialId + scopeId pair
      const mats = [];
      const seen = new Set();
      raw.forEach((scope) => {
        const children = Array.isArray(scope.children) ? scope.children : [];
        children.forEach((c) => {
          const resolvedScopeId = scope.id ?? 0;
          const key = `mat:${c.materialId || c.id}:scope:${resolvedScopeId}`;
          if (seen.has(key)) return;
          seen.add(key);
          mats.push({
            id: c.materialId || c.id || 0,
            name: c.name || '',
            code: c.code || '',
            quantity: Number(c.quantity) || Number(c.initialQuantity) || 0,
            uom: c.uom || '',
            scopeId: resolvedScopeId,
            assemblyCode: c.assemblyCode || '',
          });
        });
      });
      setMaterials(mats);
    })();
    return () => { mounted = false; };
  }, [projectId]);

  /**
   * Returns the total requestedQty already submitted for a given
   * materialId + scopeId combination, excluding the item currently
   * being edited (so editing doesn't double-count itself).
   *
   * FIX: Uses a loose scopeId match — if either side is 0/null/undefined
   * (i.e. the API returned an unscoped item), we still count it toward
   * the total so the "Available to Request" correctly reflects prior
   * requests for the same material regardless of scope discrepancies.
   */
  const getTotalRequestedQty = useCallback((materialId, scopeId) => {
    return items
      .filter((item) => {
        const materialMatch = Number(item.materialId) === Number(materialId);

        // Strict scope match OR either side is 0/null/undefined (unscoped)
        const scopeMatch =
          Number(item.scopeId) === Number(scopeId) ||
          !item.scopeId ||
          !scopeId;

        const notCurrentEdit = item.id !== editing?.id;

        return materialMatch && scopeMatch && notCurrentEdit;
      })
      .reduce((sum, item) => sum + (Number(item.requestedQty) || 0), 0);
  }, [items, editing]);

  /**
   * Build material options, excluding any materialId+scopeId combo
   * that has already consumed its full project quantity.
   * When editing an existing request, always keep that material in the
   * list (it was already selected, and its own qty is excluded from the
   * alreadyRequested sum by getTotalRequestedQty).
   */
  const materialOptions = materials
    .filter((m) => {
      const alreadyRequested = getTotalRequestedQty(m.id, m.scopeId);
      const remaining = m.quantity - alreadyRequested;
      // Always show the material that is currently being edited
      // FIX: also use loose scopeId match here for consistency
      const isCurrentlyEditing =
        editing &&
        Number(editing.materialId) === Number(m.id) &&
        (Number(editing.scopeId) === Number(m.scopeId) || !editing.scopeId || !m.scopeId);
      return isCurrentlyEditing || remaining > 0;
    })
    .map((m) => {
      const alreadyRequested = getTotalRequestedQty(m.id, m.scopeId);
      const remaining = m.quantity - alreadyRequested;
      const label = `${withAssembly(m, m.name)} (${remaining} ${m.uom || ''} left)`
        .replace(/\s+left/, ' left')
        .replace(/\(\s+/, '(');
      return {
        // IMPORTANT: composite "id:scopeId" value, must match the field's
        // controlled value below so the select can resolve the label.
        value: `${m.id}:${m.scopeId}`,
        // Show how much of this material can still be requested right in
        // the dropdown label, e.g. "T8AFE4Y8 - Bolt, single upset, 5/8\" x 12\" (15 pcs left)"
        label,
        materialId: m.id,
        scopeId: m.scopeId,
      };
    });

  const modalFields = useMemo(() => {
    const record = editing || {};
    const findMaterial = (id, scopeId) => materials.find((m) => Number(m.id) === Number(id) && Number(m.scopeId) === Number(scopeId));
    const selectedMaterial = findMaterial(record.materialId, record.scopeId);
    const auth = getAuthData() || {};
    const authName = `${(auth.firstName || '').trim()} ${(auth.lastName || '').trim()}`.trim() || auth.email || auth.userId || '';
    const today = new Date().toISOString().slice(0, 10);
    const defaultDeadlineDate = new Date();
    defaultDeadlineDate.setDate(defaultDeadlineDate.getDate() + 21);
    const defaultDeadline = defaultDeadlineDate.toISOString().slice(0, 10);
    const fmt = (v) => {
      if (!v) return '';
      try {
        const d = new Date(v);
        if (isNaN(d)) return '';
        return d.toISOString().slice(0, 10);
      } catch (e) { return ''; }
    };
    return [
      { name: 'id', label: 'Id', type: 'number', value: Number(record.id) || 0, hidden: true },
      { name: 'projectId', label: 'Project Id', type: 'number', value: Number(projectId) || 0, hidden: true },
      { name: 'scopeId', label: 'Scope Id', type: 'number', value: (selectedMaterial && selectedMaterial.scopeId) || record.scopeId || 0, hidden: true },
      { name: 'name', label: 'Name', type: 'text', value: (selectedMaterial && selectedMaterial.name) || record.name || '', hidden: true },
      { name: 'code', label: 'Code', type: 'text', value: (selectedMaterial && selectedMaterial.code) || record.code || '', hidden: true },
      { name: 'assemblyCode', label: 'Assembly Code', type: 'text', value: (selectedMaterial && selectedMaterial.assemblyCode) || record.assemblyCode || '', hidden: true },
      {
        name: 'materialId',
        label: 'Material',
        type: 'select',
        searchable: true,
        // Controlled value must be the SAME composite "id:scopeId" format
        // used by materialOptions[].value, or the select can't find a
        // matching option and falls back to the placeholder.
        value: record.materialId ? `${record.materialId}:${record.scopeId ?? 0}` : '',
        options: materialOptions,
        required: true,
        onChange: (item, updateField, itemFields, nextValue) => {
          const [midStr, sidStr] = String(nextValue || '').split(':');
          const mid = Number(midStr) || 0;
          const sid = Number(sidStr) || 0;
          const mat = materials.find((m) => Number(m.id) === mid && Number(m.scopeId) === sid);
          if (mat) {
            // Keep materialId as the composite string so it still matches
            // an entry in materialOptions on re-render. The numeric id is
            // parsed back out later (in modalFields' own 'projectQty'/etc.
            // lookups via findMaterial, and in the save payload in onClose).
            const pq = Number(mat.quantity) || 0;
            const alreadyRequested = getTotalRequestedQty(mid, sid);
            updateField('materialId', nextValue);
            updateField('projectQty', pq);
            updateField('name', mat.name || '');
            updateField('code', mat.code || '');
            updateField('uom', mat.uom || '');
            updateField('scopeId', sid);
            updateField('assemblyCode', mat.assemblyCode || '');
            // Recompute live — this field's initial `value` only reflects
            // whatever material was selected when the modal first opened
            // (or nothing, for a brand-new request), so it must be set
            // explicitly here whenever the user picks/changes a material.
            updateField('availableQty', pq - alreadyRequested);
          } else {
            updateField('materialId', '');
            updateField('projectQty', 0);
            updateField('scopeId', 0);
            updateField('assemblyCode', '');
            updateField('availableQty', '');
          }
        }
      },
      { name: 'projectQty', label: 'Project Quantity', type: 'number', value: (selectedMaterial && (selectedMaterial.quantity !== undefined ? selectedMaterial.quantity : selectedMaterial.projectQty)) || record.projectQty || '', readonly: true, hidden: true },
      {
        name: 'availableQty',
        label: 'Available to Request',
        type: 'number',
        readonly: true,
        value: (() => {
          const pq = Number((selectedMaterial && (selectedMaterial.quantity !== undefined ? selectedMaterial.quantity : selectedMaterial.projectQty)) || record.projectQty || 0);
          if (!pq) return '';
          const materialId = (selectedMaterial && selectedMaterial.id) || record.materialId;
          const scopeId = (selectedMaterial && selectedMaterial.scopeId) || record.scopeId;
          if (!materialId) return '';
          const alreadyRequested = getTotalRequestedQty(materialId, scopeId);
          return pq - alreadyRequested;
        })(),
      },
      {
        name: 'requestedQty',
        label: 'Requested Quantity',
        type: 'number',
        value: record.requestedQty || '',
        validator: Yup.number()
          .typeError('Requested Quantity must be a number')
          .required('Requested Quantity is required')
          .moreThan(0, 'Requested Quantity must be greater than 0')
          .test('max-remaining', 'Requested quantity exceeds remaining project quantity', function (value) {
            const pq = Number(this.parent?.projectQty) || 0;
            if (!pq) return true;

            // materialId on the in-progress form value may still be the
            // composite "id:scopeId" string; parse the numeric id out.
            const [midStr] = String(this.parent?.materialId || '').split(':');
            const materialId = Number(midStr) || this.parent?.materialId;
            const scopeId = this.parent?.scopeId;

            const alreadyRequested = getTotalRequestedQty(materialId, scopeId);
            const remaining = pq - alreadyRequested;

            return Number(value) <= remaining;
          }),
        onChange: (item, updateField, itemFields, nextValue) => {
          const req = Number(nextValue) || 0;
          updateField('requestedQty', req);
          updateField('balance', req);
        }
      },
      { name: 'balance', label: 'Balance', type: 'number', value: record.balance || record.requestedQty || '', readonly: true },
      { name: 'uom', label: 'UOM', type: 'text', value: (selectedMaterial && selectedMaterial.uom) || record.uom || '', readonly: true },
      {
        name: 'reasonOrProject',
        label: 'Reason/Project',
        type: 'text',
        // Default to the project number for brand-new requests only.
        // If a saved record already has a value (or is blank because the
        // user cleared it intentionally on an existing draft), we don't
        // override it with the project number.
        value: record.reasonOrProject || (record.id ? '' : projectNumber) || '',
      },
      { name: 'requestedBy', label: 'Requested By', type: 'text', value: record.requestedBy || authName || '', required: true, hidden: true },
      { name: 'deadline', label: 'Deadline', type: 'date', value: fmt(record.deadline) || defaultDeadline },
      { name: 'requestDate', label: 'Request Date', type: 'date', value: fmt(record.requestDate) || today, hidden: true },
    ];
  }, [editing, projectId, materialOptions, getTotalRequestedQty, materials, projectNumber]);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.name, item.code, item.requestedBy, item.deadline, item.assemblyCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  // Group rows by assemblyCode. Items sharing an assemblyCode are sorted
  // together (alphabetically by code, then by name within the group).
  // Items with no assemblyCode are collected into a trailing "Ungrouped"
  // section. A synthetic full-width header row (DataTable's `fullRow`
  // support) is inserted before each group so the grouping is visible.
  //
  // NOTE: because DataTable owns its own click-to-sort behavior and would
  // reorder these rows (including the injected header rows) if a column
  // header were clicked, we disable per-column sorting and pagination
  // below so the grouped order always stays intact.
  const groupedRows = useMemo(() => {
    const groups = new Map(); // assemblyCode -> items[]
    const ungrouped = [];

    filtered.forEach((item) => {
      const code = (item.assemblyCode || '').trim();
      if (!code) {
        ungrouped.push(item);
        return;
      }
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code).push(item);
    });

    const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    const byName = (a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' });

    const rows = [];

    sortedGroupKeys.forEach((code) => {
      const groupItems = [...groups.get(code)].sort(byName);
      rows.push({
        fullRow: true,
        fullRowContent: (
          <div className={styles.groupHeaderRow}>
            <strong>Assembly: {code}</strong>
            <span className={styles.groupHeaderCount}>
              {groupItems.length} item{groupItems.length === 1 ? '' : 's'}
            </span>
          </div>
        ),
      });
      rows.push(...groupItems);
    });

    if (ungrouped.length) {
      const sortedUngrouped = [...ungrouped].sort(byName);
      rows.push({
        fullRow: true,
        fullRowContent: (
          <div className={styles.groupHeaderRow}>
            <strong>Ungrouped</strong>
            <span className={styles.groupHeaderCount}>
              {sortedUngrouped.length} item{sortedUngrouped.length === 1 ? '' : 's'}
            </span>
          </div>
        ),
      });
      rows.push(...sortedUngrouped);
    }

    return rows;
  }, [filtered]);

  // Cancels a draft material request via the /Cancel/{id} endpoint, then
  // reloads the table so the row picks up its new (canceled) status.
  const handleCancel = useCallback(async (item) => {
    if (!item?.id) return;
    setCancelingId(item.id);
    try {
      const response = await cancelMaterialRequest(item.id);
      if (response?.error) {
        toast.error('Failed to cancel material request');
      } else {
        toast.success('Material request canceled');
        await loadData();
      }
      return response;
    } finally {
      setCancelingId(null);
    }
  }, [toast, loadData]);

  const tableColumns = useMemo(() => [
    {
      header: 'Requested Date', key: 'requestDate', sortable: false, render: (item) =>
        item.requestDate
          ? new Date(item.requestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
          : '—',
    },
    { header: 'RIV Number', key: 'rivNumber', sortable: false },
    { header: 'Name', key: 'name', sortable: false, render: (item) => withAssembly(item, item.name) },
    { header: 'Code', key: 'code', sortable: false, render: (item) => withAssembly(item, item.code) },
    { header: 'UOM', key: 'uom', sortable: false },
    { header: 'Status', key: 'status', sortable: false, render: (item) => <StatusBadge status={item.status} /> },
    { header: 'Project Qty', key: 'projectQty', sortable: false },
    { header: 'Requested Qty', key: 'requestedQty', sortable: false },
    { header: 'Delivered Qty', key: 'deliveredQuantity', sortable: false },
    { header: 'Balance', key: 'balance', sortable: false },
    { header: 'Requested By', key: 'requestedBy', sortable: false },
    {
      header: 'Deadline', key: 'deadline', sortable: false, render: (item) =>
        item.deadline
          ? new Date(item.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
          : '—',
    },
    {
      header: 'Actions',
      key: '__actions',
      sortable: false,
      render: (item) => editable && isAllowed(PageName, 'w') ? (
        <div>
          {((item.status || '').toLowerCase().includes('draft')) && (
            <Button
              size="sm"
              variant="outlinedPrimary"
              icon={<FiEdit2 size={14} />}
              title="Edit"
              onClick={() => { setEditing(item); setIsModalOpen(true); }}
            />
          )}
          {!((item.status || '').toLowerCase().includes('cancel')) && (
            <Button
              size="sm"
              variant="outlineDanger"
              icon={<FiXCircle size={14} />}
              title="Cancel"
              disabled={cancelingId === item.id}
              onClick={() => {
                confirmModal.show(
                  'Cancel material request?',
                  `Cancel material request "${item.name || item.code || ''}"?`,
                  'Cancel Request',
                  'danger',
                  () => handleCancel(item)
                );
              }}
              style={{ marginLeft: '6px' }}
            />
          )}
          {(item.rivNumber != "" && item.rivNumber != null) && (
            <Button
              size="sm"
              variant="outlinedPrimary"
              icon={<FiPrinter size={14} />}
              title="Print Request Voucher"
              onClick={() => { printMaterialRequest_byObj(item); }}
              style={{ marginLeft: '6px' }}
            />
          )}
        </div>
      ) : null,
    },
  ], [editable, isAllowed, cancelingId, confirmModal, handleCancel, withAssembly]);

  if (!isAllowed(PageName, 'r')) return <InvalidPage />;

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Material Requests</h2>
        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search material requests"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            width="280px"
          />
          {isAllowed(PageName, 'w') && filtered.find(itm => (itm.status || '').toLowerCase().includes("draft")) && (
            <Button onClick={async () => {
              await printMaterialRequest_byId(projectId).then(async _ => {
                const res = await printMaterialRequests_byProject(projectId);
                setItems(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
              });
            }}>Submit Drafts + Print RV</Button>
          )}
          {isAllowed(PageName, 'w') && editable && (
            <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>Add Material Request</Button>
          )}
        </div>
      </div>

      <div className={styles.tableSection}>
        <DataTable
          columns={tableColumns}
          data={groupedRows}
          showActions={false}
          emptyMessage="No material requests found"
          pagination={false}
        />
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Material Request' : 'Add Material Request'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? 0 : -1}
        isOpen={isModalOpen}
        fields={modalFields}
        hideDeleteButton ={true}
        onItemRemove={() => {}}
        onClose={isAllowed(PageName, 'w') && editable ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          // Prevent updating non-draft items
          if (value.id && editing && !((editing.status || '').toLowerCase().includes('draft'))) {
            toast.error('Only draft material requests can be edited');
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          const auth = getAuthData() || {};
          const authName = `${(auth.firstName || '').trim()} ${(auth.lastName || '').trim()}`.trim() || auth.email || auth.userId || '';
          const today = new Date().toISOString().slice(0, 10);

          // materialId coming from the form may still be the composite
          // "id:scopeId" string produced by the select field — parse the
          // numeric material id back out before building the payload.
          const [midStr, sidStrFromMaterial] = String(value.materialId || '').split(':');
          const numericMaterialId = Number(midStr) || 0;
          const numericScopeId = Number(value.scopeId) || Number(sidStrFromMaterial) || 0;

          const matchedMaterial = materials.find(
            (m) => Number(m.id) === numericMaterialId && Number(m.scopeId) === numericScopeId
          );

          const payload = {
            ...INITIAL_MATERIAL_REQUEST,
            ...value,
            name: value.name || matchedMaterial?.name || '',
            code: value.code || matchedMaterial?.code || '',
            assemblyCode: value.assemblyCode || matchedMaterial?.assemblyCode || '',
            materialId: numericMaterialId,
            projectId: Number(projectId) || 0,
            scopeId: numericScopeId,
            projectQty: value.projectQty !== undefined ? Number(value.projectQty) : 0,
            requestedQty: value.requestedQty !== undefined ? Number(value.requestedQty) : 0,
            balance: value.balance !== undefined ? Number(value.balance) : 0,
            reasonOrProject: value.reasonOrProject || (value.id ? '' : projectNumber) || '',
            requestedBy: value.requestedBy || authName || '',
            deadline: value.deadline || '',
            requestDate: value.requestDate || today,
          };

          // Final guard: check cumulative requested qty for materialId + scopeId
          // before hitting the API, in case Yup validation was bypassed.
          const alreadyRequested = getTotalRequestedQty(payload.materialId, payload.scopeId);
          const remaining = (payload.projectQty || 0) - alreadyRequested;
          if (payload.requestedQty > remaining) {
            toast.error(
              `Cannot request ${payload.requestedQty}. Only ${remaining} remaining for this material` +
              ` (project qty: ${payload.projectQty}, already requested: ${alreadyRequested}).`
            );
            return; // keep modal open so user can correct the value
          }

          if (!value.id || value.id === 0) {
            const response = await createMaterialRequest(payload);
            if (response?.error) toast.error('Failed to add material request');
            else { toast.success('Material request added'); await loadData(); }
          } else {
            const response = await updateMaterialRequest(value.id, payload);
            if (response?.error) toast.error('Failed to update material request');
            else { toast.success('Material request updated'); await loadData(); }
          }

          setIsModalOpen(false);
          setEditing(null);
        } : async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
          }
        }}
        readOnly={!editable || !isAllowed(PageName, 'w') || (editing && !((editing.status || '').toLowerCase().includes('draft')))}
      />
    </div>
  );
}