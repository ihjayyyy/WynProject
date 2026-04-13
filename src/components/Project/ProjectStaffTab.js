'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import ProjectStaffModal from './ProjectStaffModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getProjectStaffsByProjectId, createProjectStaff, updateProjectStaff, deleteProjectStaff } from '../../services/ProjectStaff';
import { getStaffs } from '../../services/Staff';
import { getByProjectId } from '../../services/ProjectScope';
import { useToast } from '../ui/Toast/Toast';

const BASE_COLUMNS = [
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Job', key: 'job' },
];

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
      [it.name, it.code, it.job]
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
            showButton
            buttonLabel="Add Staff"
            handleOnClick={() => { setEditing(null); setIsModalOpen(true); }}
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

      <ProjectStaffModal
        open={isModalOpen}
        initial={editing || {}}
        staffOptions={staffOptions}
        scopeOptions={scopeOptions}
        onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onConfirm={async (val) => {
          if (!val.id || val.id === 0) {
            const payload = { ...val, projectId: Number(projectId) || 0 };
            const res = await createProjectStaff(payload);
            if (res?.error) toast.error('Failed to add staff');
            else { toast.success('Staff added'); await loadData(); }
          } else {
            const res = await updateProjectStaff(val.id, val);
            if (res?.error) toast.error('Failed to update staff');
            else { toast.success('Staff updated'); await loadData(); }
          }
          setIsModalOpen(false);
          setEditing(null);
        }}
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
