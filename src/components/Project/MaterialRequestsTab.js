import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from '../ItemDetails/itemModal';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import styles from './ProjectScope.module.scss';
import { getMaterialRequestsByProjectId, createMaterialRequest, updateMaterialRequest, INITIAL_MATERIAL_REQUEST } from '../../services/MaterialRequest';
import { getMaterials } from '../../services/Materials';
import { useToast } from '../ui/Toast/Toast';
import { AccessContext } from '@/app/contextProviders/accessContext';


export default function MaterialRequestsTab({ projectId }) {
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
      const res = await getMaterials();
      if (!mounted) return;
      setMaterials(Array.isArray(res.data) ? res.data : []);
    })();
    return () => { mounted = false; };
  }, []);

  const materialOptions = materials.map((m) => ({ value: m.id, label: m.name }));

  const modalFields = useMemo(() => {
    const record = editing || {};
    return [
      { name: 'id', label: 'Id', type: 'number', value: Number(record.id) || 0, hidden: true },
      { name: 'projectId', label: 'Project Id', type: 'number', value: Number(projectId) || 0, hidden: true },
      { name: 'name', label: 'Name', type: 'text', value: record.name || '' },
      { name: 'code', label: 'Code', type: 'text', value: record.code || '' },
      { name: 'materialId', label: 'Material', type: 'select', value: record.materialId || '', options: materialOptions, required: true },
      { name: 'qty', label: 'Quantity', type: 'number', value: record.qty || '', required: true },
      { name: 'projectQty', label: 'Project Quantity', type: 'number', value: record.projectQty || '' },
      { name: 'requestedQty', label: 'Requested Quantity', type: 'number', value: record.requestedQty || '' },
      { name: 'balance', label: 'Balance', type: 'number', value: record.balance || '' },
      { name: 'reasonOrProject', label: 'Reason/Project', type: 'text', value: record.reasonOrProject || '' },
      { name: 'requestedBy', label: 'Requested By', type: 'text', value: record.requestedBy || '', required: true },
      { name: 'deadline', label: 'Deadline', type: 'date', value: record.deadline || '' },
      { name: 'requestDate', label: 'Request Date', type: 'date', value: record.requestDate || '' },
      { name: 'status', label: 'Status', type: 'text', value: record.status || '' },
      { name: 'responseBy', label: 'Response By', type: 'text', value: record.responseBy || '' },
      { name: 'responseDate', label: 'Response Date', type: 'date', value: record.responseDate || '' },
    ];
  }, [editing, projectId, materialOptions]);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      [item.name, item.code, item.qty, item.requestedBy, item.deadline, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Code', key: 'code' },
    { header: 'Qty', key: 'qty' },
    { header: 'Requested By', key: 'requestedBy' },
    { header: 'Deadline', key: 'deadline' },
    { header: 'Status', key: 'status' },
    {
      header: 'Actions',
      key: '__actions',
      render: (item) => (
        <Button
          size="sm"
          variant="outlinedPrimary"
          title="Edit"
          onClick={() => { setEditing(item); setIsModalOpen(true); }}
        >Edit</Button>
      ),
    },
  ], []);

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
          {isAllowed(PageName, 'w') && (
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
        onClose={isAllowed(PageName, 'w') ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }
          // Ensure all required fields for the API are present in the payload
          const payload = {
            ...INITIAL_MATERIAL_REQUEST,
            ...value,
            name: value.name || '',
            code: value.code || '',
            materialId: Number(value.materialId) || 0,
            projectId: Number(projectId) || 0,
            qty: Number(value.qty) || 0,
            projectQty: value.projectQty !== undefined ? Number(value.projectQty) : 0,
            requestedQty: value.requestedQty !== undefined ? Number(value.requestedQty) : 0,
            balance: value.balance !== undefined ? Number(value.balance) : 0,
            reasonOrProject: value.reasonOrProject || '',
            requestedBy: value.requestedBy || '',
            deadline: value.deadline || '',
            requestDate: value.requestDate || '',
            status: value.status || '',
            responseBy: value.responseBy || '',
            responseDate: value.responseDate || '',
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
        } : undefined}
        readOnly={!isAllowed(PageName, 'w')}
      />
    </div>
  );
}
