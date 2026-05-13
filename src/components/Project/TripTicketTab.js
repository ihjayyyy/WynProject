'use client';

import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import ItemModal from '../ItemDetails/itemModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getTripTicketByProjectId, createTripTicket, updateTripTicket, deleteTripTicket } from '../../services/TripTicket';
import { byTypeMaterials } from '../../services/Materials';
import { useToast } from '../ui/Toast/Toast';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { AccessContext } from '@/app/contextProviders/accessContext';
import * as Yup from 'yup';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString();
  return String(value);
}

function getFieldValue(itemFields, fieldName, fallback = '') {
  const field = itemFields.find((entry) => entry.name === fieldName);
  return field ? field.value : fallback;
}

const BASE_COLUMNS = [
  { header: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Trip Meter', key: 'tripMeter', render: (item) => Number(item.tripMeter || 0).toFixed(2) },
  { header: 'Hours Used', key: 'hoursUsed', render: (item) => Number(item.hoursUsed || 0).toFixed(2) },
  { header: 'Vehicle Plate', key: 'vehiclePlateNumber' },
  { header: 'Gas Slip #', key: 'gasSlipNumber' },
  { header: 'Trip Cost', key: 'tripCost', render: (item) => Number(item.tripCost || 0).toLocaleString() },
];

export default function TripTicketTab({ projectId = 0, editable = true }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [materials, setMaterials] = useState([]);
  const toast = useToast();
  const confirmModal = useConfirmModal();
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await byTypeMaterials({ materialType: 'Tool', isAssembly: false });
        if (!mounted) return;
        if (!res.error && Array.isArray(res.data)) setMaterials(res.data || []);
        else setMaterials([]);
      } catch (err) {
        setMaterials([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tripTicketModalFields = useMemo(() => {
    const record = editing || {};
    const selectedMaterial = (materials || []).find((m) => Number(m.id) === Number(record.materialId));
    const materialRate = Number(selectedMaterial?.sellingPrice ?? selectedMaterial?.unitCost ?? 0) || 0;
    const computedTripCost = Number((materialRate * (Number(record.hoursUsed) || 0)).toFixed(2));

    return [
      {
        name: 'id',
        label: 'Id',
        type: 'number',
        value: Number(record.id) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'projectId',
        label: 'Project Id',
        type: 'number',
        value: Number(projectId) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'materialId',
        label: 'Tool',
        type: 'select',
        value: record.materialId ? String(record.materialId) : '',
        options: (materials || []).map((m) => ({ value: String(m.id), name: `${m.name || m.code || ''}`.trim() })),
        validator: Yup.string().notRequired(),
        onChange: (item, updateField, itemFields, nextValue) => {
          const hoursUsed = Number(getFieldValue(itemFields, 'hoursUsed', 0)) || 0;
          const nextMaterial = (materials || []).find((m) => Number(m.id) === Number(nextValue));
          const nextRate = Number(nextMaterial?.sellingPrice ?? nextMaterial?.unitCost ?? 0) || 0;
          const nextTripCost = Number((nextRate * hoursUsed).toFixed(2));
          updateField('code', nextMaterial?.code || '');
          updateField('name', nextMaterial?.name || '');
          updateField('tripCost', nextTripCost);
        },
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        value: selectedMaterial?.code || record.code || '',
        validator: Yup.string().notRequired(),
        hidden: true,
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        value: selectedMaterial?.name || record.name || '',
        validator: Yup.string().required('Name is required'),
      },
      {
        name: 'tripMeter',
        label: 'Trip Meter',
        type: 'number',
        value: Number(record.tripMeter) || 0,
        validator: Yup.number().min(0).notRequired(),
      },
      {
        name: 'hoursUsed',
        label: 'Hours Used',
        type: 'number',
        value: Number(record.hoursUsed) || 0,
        validator: Yup.number().min(0).notRequired(),
        onChange: (item, updateField, itemFields, nextValue) => {
          const materialId = getFieldValue(itemFields, 'materialId', '');
          const selected = (materials || []).find((m) => Number(m.id) === Number(materialId));
          const rate = Number(selected?.sellingPrice ?? selected?.unitCost ?? 0) || 0;
          const hoursUsed = Number(nextValue) || 0;
          const nextTripCost = Number((rate * hoursUsed).toFixed(2));
          updateField('tripCost', nextTripCost);
        },
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        value: record.date ? String(record.date).split('T')[0] : new Date().toISOString().split('T')[0],
        validator: Yup.date().notRequired(),
      },
      {
        name: 'vehiclePlateNumber',
        label: 'Vehicle Plate Number',
        type: 'text',
        value: record.vehiclePlateNumber || '',
        validator: Yup.string().notRequired(),
      },
      {
        name: 'gasSlipNumber',
        label: 'Gas Slip Number',
        type: 'text',
        value: record.gasSlipNumber || '',
        validator: Yup.string().notRequired(),
      },
      {
        name: 'tripCost',
        label: 'Trip Cost',
        type: 'number',
        value: computedTripCost,
        readonly: true,
        validator: Yup.number().min(0).notRequired(),
      },
    ];
  }, [editing, projectId, materials]);

  const loadData = useCallback(async () => {
    if (!projectId) return;

    const response = await getTripTicketByProjectId(projectId);
    if (response?.error) {
      setItems([]);
      return;
    }

    const raw = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
    setItems(raw);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (itemId) => {
    const idToDelete = Number(itemId) || Number(editing?.id) || 0;
    if (!idToDelete) {
      toast.error('Failed to delete trip ticket');
      return;
    }

    const response = await deleteTripTicket(idToDelete);
    if (response?.error) toast.error('Failed to delete trip ticket');
    else {
      toast.success('Trip ticket deleted');
      await loadData();
    }
  }, [editing?.id, loadData, toast]);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.name, item.code, item.vehiclePlateNumber, item.gasSlipNumber, item.date, item.tripMeter, item.hoursUsed, item.tripCost]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    ...BASE_COLUMNS,
    {
      header: 'Actions',
      key: '__actions',
      align: 'right',
      render: (item) => editable && isAllowed(PageName, 'w') ? (
        <div className={styles.actionCell}>
          <Button
            size="sm"
            variant="outlinedPrimary"
            icon={<FiEdit2 />}
            title="Edit"
            onClick={() => { setEditing(item); setIsModalOpen(true); }}
          />
          <Button
            size="sm"
            variant="danger"
            icon={<FiTrash2 />}
            title="Delete"
            onClick={() => {
              const title = 'Remove trip ticket?';
              const message = item?.name
                ? `Remove trip ticket for "${item.name}" on ${formatDate(item.date)}?`
                : 'Remove this trip ticket?';
              const confirmText = 'Remove';
              const variant = 'danger';
              const action = async () => {
                await handleDelete(item?.id);
              };
              confirmModal.show(title, message, confirmText, variant, action);
            }}
          />
        </div>
      ) : null,
    },
  ], [confirmModal, handleDelete, editable, isAllowed]);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Trip Tickets</h2>
        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search trip tickets"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton={isAllowed(PageName, 'w') && editable}
            buttonLabel={isAllowed(PageName, 'w') && editable ? "Add Trip Ticket" : undefined}
            handleOnClick={isAllowed(PageName, 'w') && editable ? () => { setEditing(null); setIsModalOpen(true); } : undefined}
            width="260px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No trip tickets found" />
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Trip Ticket' : 'Add Trip Ticket'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? Number(editing.id) : -1}
        isOpen={isModalOpen}
        fields={tripTicketModalFields}
        onItemRemove={handleDelete}
        onClose={isAllowed(PageName, 'w') && editable ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          const material = (materials || []).find((m) => Number(m.id) === Number(value.materialId));
          const materialRate = Number(material?.sellingPrice ?? material?.unitCost ?? 0) || 0;
          const hoursUsed = Number(value.hoursUsed) || 0;
          const tripCost = Number((materialRate * hoursUsed).toFixed(2));

          const payload = {
            name: material?.name || value.name || '',
            code: material?.code || value.code || '',
            projectId: Number(projectId) || 0,
            materialId: Number(value.materialId) || 0,
            tripMeter: Number(value.tripMeter) || 0,
            hoursUsed,
            date: value.date || new Date().toISOString().split('T')[0],
            vehiclePlateNumber: value.vehiclePlateNumber || '',
            gasSlipNumber: value.gasSlipNumber || '',
            tripCost,
          };

          if (!value.id || value.id === 0) {
            const response = await createTripTicket(payload);
            if (response?.error) toast.error('Failed to add trip ticket');
            else { toast.success('Trip ticket added'); await loadData(); }
          } else {
            const response = await updateTripTicket(value.id, payload);
            if (response?.error) toast.error('Failed to update trip ticket');
            else { toast.success('Trip ticket updated'); await loadData(); }
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