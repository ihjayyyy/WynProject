'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import ItemModal from '../ItemDetails/itemModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getProjectStaffsByProjectId, createProjectStaff, updateProjectStaff, deleteProjectStaff } from '../../services/ProjectStaff';
import { getStaffs } from '../../services/Staff';
import { getByProjectId } from '../../services/ProjectScope';
import { useToast } from '../ui/Toast/Toast';
import * as Yup from 'yup';
import { AccessContext } from '@/app/contextProviders/accessContext';

const BASE_COLUMNS = [
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Job', key: 'job' },
  { header: 'Expenses', key: 'expenses', render: (it) => Number(it.expenses) || 0 },
];

function getFieldValue(itemFields, fieldName, fallback = '') {
  const field = itemFields.find((entry) => entry.name === fieldName);
  return field ? field.value : fallback;
}

function findStaff(staffOptions, staffId) {
  return staffOptions.find((staff) => Number(staff.value) === Number(staffId));
}

export default function ProjectStaffTab({ projectId = 0 }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [scopeOptions, setScopeOptions] = useState([]);
  const toast = useToast();
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);

  const projectStaffModalFields = useMemo(() => {
    const record = editing || {};
    const initialStaffId = Number(record.staffId) || 0;
    const selectedStaff = findStaff(staffOptions, initialStaffId);
    const selectableStaff = staffOptions.map((staff) => ({
      value: String(staff.value),
      name: staff.label,
    }));
    const selectableScopes = scopeOptions.map((scope) => ({
      value: scope.value,
      name: scope.label,
    }));

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
        name: 'name',
        label: 'Name',
        type: 'text',
        value: record.name || selectedStaff?.name || '',
        hidden: true,
        validator: Yup.string().notRequired(),
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        value: record.code || selectedStaff?.code || '',
        hidden: true,
        validator: Yup.string().notRequired(),
      },
      {
        name: 'staffId',
        label: 'Staff Member',
        type: 'select',
        value: initialStaffId ? String(initialStaffId) : '',
        options: selectableStaff,
        validator: Yup.string().required('Staff member is required'),
        onChange: (item, updateField, itemFields, nextValue) => {
          const selected = findStaff(staffOptions, nextValue);
          updateField('name', selected?.name || selected?.label || '');
          updateField('code', selected?.code || '');
          updateField('expenses', Number(selected?.ratePerHour) || 0);
        },
      },
      {
        name: 'job',
        label: 'Job',
        type: 'text',
        value: record.job || '',
        validator: Yup.string().notRequired(),
      },
      {
        name: 'expenses',
        label: 'Expenses',
        type: 'number',
        value: Number(record.expenses) || 0,
        readonly: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'scopeId',
        label: 'Scope',
        type: 'select',
        value: record.scopeId ? String(record.scopeId) : '',
        options: selectableScopes,
        validator: Yup.number().notRequired(),
      },
    ];
  }, [editing, staffOptions, scopeOptions]);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    const res = await getProjectStaffsByProjectId(projectId);
    if (!res.error) {
      const raw = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setItems(raw);
    } else {
      setItems([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load staff dropdown options
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getStaffs();
      if (!mounted || res.error) return;
      const list = Array.isArray(res.data) ? res.data : (res.data?.value || []);
      setStaffOptions(
        (list || []).map((s) => ({
          value: String(s.id),
          label: s.name || s.code || String(s.id),
          name: s.name || '',
          code: s.code || '',
          job: s.job || '',
          ratePerHour: Number(s.ratePerHour) || 0,
        }))
      );
    })();
    return () => { mounted = false; };
  }, []);

  // Load scope dropdown options
  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    (async () => {
      const res = await getByProjectId(projectId);
      if (!mounted || res.error) return;
      const raw = Array.isArray(res.data) ? res.data : (res.data?.value || []);
      setScopeOptions(
        (raw || []).map((s) => ({
          value: String(s.id),
          label: s.description || s.name || s.code || String(s.id),
        }))
      );
    })();
    return () => { mounted = false; };
  }, [projectId]);

  const filtered = useMemo(() => {
    const k = (searchTerm || '').trim().toLowerCase();
    if (!k) return items;
    return items.filter((it) =>
      [it.name, it.code, it.job, it.expenses]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    ...BASE_COLUMNS,
    {
      header: 'Scope',
      key: 'scopeId',
      render: (it) => {
        const match = scopeOptions.find((s) => s.value === String(it.scopeId));
        return match ? match.label : it.scopeId || '—';
      },
    },
    {
      header: 'Actions',
      key: '__actions',
      align: 'right',
      render: (it) => (
        <div className={styles.actionCell}>
          <Button
            size="sm"
            variant="outlinedPrimary"
            icon={<FiEdit2 />}
            title="Edit"
            onClick={() => { setEditing(it); setIsModalOpen(true); }}
          />
          <Button
            size="sm"
            variant="danger"
            icon={<FiTrash2 />}
            title="Delete"
            onClick={() => { setConfirmTarget(it); setIsConfirmOpen(true); }}
          />
        </div>
      ),
    },
  ], [scopeOptions]);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Staff</h2>
        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search staff"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton={isAllowed(PageName, 'w')}
            buttonLabel={isAllowed(PageName, 'w') ? "Add Staff" : undefined}
            handleOnClick={isAllowed(PageName, 'w') ? () => { setEditing(null); setIsModalOpen(true); } : undefined}
            width="280px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No staff assigned to this project</div>
        ) : (
          <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No staff found" />
        )}
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Project Staff' : 'Add Project Staff'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? 0 : -1}
        isOpen={isModalOpen}
        fields={projectStaffModalFields}
        onItemRemove={() => {}}
        onClose={isAllowed(PageName, 'w') ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          const selectedStaff = staffOptions.find((s) => Number(s.value) === Number(value.staffId));
          const payload = {
            name: value.name || '',
            code: value.code || '',
            scopeId: Number(value.scopeId) || 0,
            staffId: Number(value.staffId) || 0,
            job: value.job || '',
            expenses: Number(selectedStaff?.ratePerHour ?? value.expenses) || 0,
          };

          if (!value.id || value.id === 0) {
            const res = await createProjectStaff(payload);
            if (res?.error) toast.error('Failed to add staff');
            else { toast.success('Staff added'); await loadData(); }
          } else {
            const res = await updateProjectStaff(value.id, payload);
            if (res?.error) toast.error('Failed to update staff');
            else { toast.success('Staff updated'); await loadData(); }
          }
          setIsModalOpen(false);
          setEditing(null);
        } : undefined}
        readOnly={!isAllowed(PageName, 'w')}
      />

      <ConfirmModal
        open={isConfirmOpen}
        title="Remove staff?"
        message={confirmTarget ? `Remove "${confirmTarget.name || confirmTarget.code || ''}" from this project?` : 'Remove this staff member?'}
        confirmText="Remove"
        confirmVariant="danger"
        onConfirm={async () => {
          if (confirmTarget?.id) {
            const res = await deleteProjectStaff(confirmTarget.id);
            if (res?.error) toast.error('Failed to remove staff');
            else { toast.success('Staff removed'); await loadData(); }
          }
          setIsConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onCancel={() => { setIsConfirmOpen(false); setConfirmTarget(null); }}
      />
    </div>
  );
}
