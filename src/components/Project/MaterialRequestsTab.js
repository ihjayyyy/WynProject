import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from '../ItemDetails/itemModal';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import styles from './ProjectScope.module.scss';
import { getMaterialRequestsByProjectId, createMaterialRequest, updateMaterialRequest, INITIAL_MATERIAL_REQUEST, getDocumentPDFById, getDocumentPDFByRivNumber } from '../../services/MaterialRequest';
import { getByProjectId as getScopesByProjectId } from '../../services/ProjectScope';
import * as Yup from 'yup';
import { getAuthData } from '../../services/Auth';
import { useToast } from '../ui/Toast/Toast';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { FiPrinter } from 'react-icons/fi';

export default function MaterialRequestsTab({ projectId, editable = true }) {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [materials, setMaterials] = useState([]);
  const toast = useToast();

  const loadData = useCallback(async () => {
    if (!projectId) return;
    const res = await getMaterialRequestsByProjectId(projectId);
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
      // Flatten children across scopes and dedupe by materialId (or child id fallback)
      const mats = [];
      const seen = new Set();
      raw.forEach((scope) => {
        const children = Array.isArray(scope.children) ? scope.children : [];
        children.forEach((c) => {
          const key = c.materialId ? `mat:${c.materialId}` : `child:${c.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          mats.push({ id: c.materialId || c.id || 0, name: c.name || '', code: c.code || '', quantity: Number(c.quantity) || Number(c.initialQuantity) || 0 });
        });
      });
      setMaterials(mats);
    })();
    return () => { mounted = false; };
  }, [projectId]);

  const materialOptions = materials.map((m) => ({ value: m.id, label: m.name }));

  const modalFields = useMemo(() => {
    const record = editing || {};
    const findMaterial = (id) => materials.find((m) => Number(m.id) === Number(id));
    const selectedMaterial = findMaterial(record.materialId);
    const auth = getAuthData() || {};
    const authName = `${(auth.firstName || '').trim()} ${(auth.lastName || '').trim()}`.trim() || auth.email || auth.userId || '';
    const today = new Date().toISOString().slice(0, 10);
    const defaultDeadlineDate = new Date();
    defaultDeadlineDate.setMonth(defaultDeadlineDate.getMonth() + 1);
    const defaultDeadline = defaultDeadlineDate.toISOString().slice(0, 10);
    const fmt = (v) => {
      if (!v) return '';
      try {
        const d = new Date(v);
        if (isNaN(d)) return '';
        return d.toISOString().slice(0, 10);
      } catch (e) { return '';} 
    };
    return [
      { name: 'id', label: 'Id', type: 'number', value: Number(record.id) || 0, hidden: true },
      { name: 'projectId', label: 'Project Id', type: 'number', value: Number(projectId) || 0, hidden: true },
      { name: 'name', label: 'Name', type: 'text', value: (selectedMaterial && selectedMaterial.name) || record.name || '', hidden: true },
      { name: 'code', label: 'Code', type: 'text', value: (selectedMaterial && selectedMaterial.code) || record.code || '', hidden: true },
      {
        name: 'materialId',
        label: 'Material',
        type: 'select',
        value: record.materialId || '',
        options: materialOptions,
        required: true,
        onChange: (item, updateField, itemFields, nextValue) => {
          const mid = Number(nextValue) || 0;
          const mat = materials.find((m) => Number(m.id) === Number(mid));
          if (mat) {
            updateField('projectQty', Number(mat.quantity) || 0);
            updateField('name', mat.name || '');
            updateField('code', mat.code || '');
          } else {
            updateField('projectQty', 0);
          }
        }
      },
      { name: 'projectQty', label: 'Project Quantity', type: 'number', value: (selectedMaterial && (selectedMaterial.quantity !== undefined ? selectedMaterial.quantity : selectedMaterial.projectQty)) || record.projectQty || '', readonly: true },
      { name: 'requestedQty', label: 'Requested Quantity', type: 'number', value: record.requestedQty || '', validator: Yup.number().required('Requested Quantity is required').min(0).test('max-project', 'Requested quantity cannot exceed project quantity', function(value) {
          const pq = Number(this.parent?.projectQty) || 0;
          if (!pq) return true;
          return Number(value || 0) <= pq;
        }), onChange: (item, updateField, itemFields, nextValue) => {
          const req = Number(nextValue) || 0;
          updateField('requestedQty', req);
          updateField('balance', req);
        } },
      { name: 'balance', label: 'Balance', type: 'number', value: record.balance || record.requestedQty || '', readonly: true },
      { name: 'reasonOrProject', label: 'Reason/Project', type: 'text', value: record.reasonOrProject || '' },
      { name: 'requestedBy', label: 'Requested By', type: 'text', value: record.requestedBy || authName || '', required: true, hidden: true },
      { name: 'deadline', label: 'Deadline', type: 'date', value: fmt(record.deadline) || defaultDeadline },
      { name: 'requestDate', label: 'Request Date', type: 'date', value: fmt(record.requestDate) || today, hidden: true },
      // status, responseBy, responseDate removed as requested
    ];
  }, [editing, projectId, materialOptions]);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.name, item.code, item.requestedBy, item.deadline]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Code', key: 'code' },
    { header: 'Project Qty', key: 'projectQty' },
    { header: 'Requested Qty', key: 'requestedQty' },
    { header:'Delivered Qty', key: 'deliveredQuantity' },
    { header: 'Balance', key: 'balance' },
    { header: 'Requested By', key: 'requestedBy' },
    { header: 'Deadline', key: 'deadline',     render: (item) =>
      item.deadline
        ? new Date(item.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
        : '—', },
    {
      header: 'Actions',
      key: '__actions',
      render: (item) => editable && isAllowed(PageName, 'w') ? (
        <div>
          <Button
            size="sm"
            variant="outlinedPrimary"
            title="Edit"
            onClick={() => { setEditing(item); setIsModalOpen(true); }}
          >Edit</Button>
          {(item.rivNumber != "" && item.rivNumber != null) && <Button
            size="sm"
            variant="outlinedPrimary"
            title="Print RIV"
            onClick={() => { getDocumentPDFByRivNumber(item).then(() => {getMaterialRequestsByProjectId(projectId);}); }}
            style={{marginLeft: "4px"}}
          >RIV</Button>}
        </div>
      ) : null,
    },
  ], [editable, isAllowed]);

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
          {isAllowed(PageName, 'w') && filtered.find(itm => itm.status.toLowerCase().includes("draft")) && (
            <Button onClick={() => { getDocumentPDFById(projectId); }}>Generate RIV</Button>
          )}
          {isAllowed(PageName, 'w') && editable && (
            <Button onClick={() => { setEditing(null); setIsModalOpen(true); }}>Add Material Request</Button>
          )}
        </div>
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No material requests found" />
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Material Request' : 'Add Material Request'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? 0 : -1}
        isOpen={isModalOpen}
        fields={modalFields}
        onItemRemove={() => {}}
        onClose={isAllowed(PageName, 'w') && editable ? async (value) => {
          if (!value) {
              setIsModalOpen(false);
              setEditing(null);
              return;
            }

            // Field validation (Yup) will prevent saving when requestedQty > projectQty

          const auth = getAuthData() || {};
          const authName = `${(auth.firstName || '').trim()} ${(auth.lastName || '').trim()}`.trim() || auth.email || auth.userId || '';
          const today = new Date().toISOString().slice(0, 10);

          const payload = {
            ...INITIAL_MATERIAL_REQUEST,
            ...value,
            name: value.name || (materials.find((m) => Number(m.id) === Number(value.materialId))?.name) || '',
            code: value.code || (materials.find((m) => Number(m.id) === Number(value.materialId))?.code) || '',
            materialId: Number(value.materialId) || 0,
            projectId: Number(projectId) || 0,
            projectQty: value.projectQty !== undefined ? Number(value.projectQty) : 0,
            requestedQty: value.requestedQty !== undefined ? Number(value.requestedQty) : 0,
            balance: value.balance !== undefined ? Number(value.balance) : 0,
            reasonOrProject: value.reasonOrProject || '',
            requestedBy: value.requestedBy || authName || '',
            deadline: value.deadline || '',
            requestDate: value.requestDate || today,
          };

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
        readOnly={!editable || !isAllowed(PageName, 'w')}
      />
    </div>
  );
}