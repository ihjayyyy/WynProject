'use client';

import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import ItemModal from '../ItemDetails/itemModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getExpensesByProjectId, createExpense, updateExpense, deleteExpense } from '../../services/Expense';
import { getByProjectId } from '../../services/ProjectScope';
import { useToast } from '../ui/Toast/Toast';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { AccessContext } from '@/app/contextProviders/accessContext';
import * as Yup from 'yup';

const BASE_COLUMNS = [
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Description', key: 'description', render: (item) => item.description || item.desciption || '—' },
  { header: 'Amount', key: 'amount', render: (item) => Number(item.amount || 0).toLocaleString() },
  { header: 'Reference #', key: 'referenceNumber', render: (item) => item.referenceNumber || '—' },
];

function getFieldValue(itemFields, fieldName, fallback = '') {
  const field = itemFields.find((entry) => entry.name === fieldName);
  return field ? field.value : fallback;
}

export default function ExpensesTab({ projectId = 0 }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scopeOptions, setScopeOptions] = useState([]);
  const toast = useToast();
  const confirmModal = useConfirmModal();
  const { isAllowed } = useContext(AccessContext);

  const expensesModalFields = useMemo(() => {
    const record = editing || {};
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
        name: 'projectId',
        label: 'Project Id',
        type: 'number',
        value: Number(projectId) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        value: record.code || '',
        validator: Yup.string().notRequired(),
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        value: record.name || '',
        validator: Yup.string().required('Name is required'),
      },
      {
        name: 'amount',
        label: 'Amount',
        type: 'number',
        value: Number(record.amount) || 0,
        validator: Yup.number().min(0).notRequired(),
      },
      {
        name: 'referenceNumber',
        label: 'Reference Number',
        type: 'number',
        value: Number(record.referenceNumber) || 0,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        value: record.description || record.desciption || '',
        validator: Yup.string().notRequired(),
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
  }, [editing, projectId, scopeOptions]);

  const loadData = useCallback(async () => {
    if (!projectId) return;

    const response = await getExpensesByProjectId(projectId);
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
      toast.error('Failed to delete expense');
      return;
    }

    const response = await deleteExpense(idToDelete);
    if (response?.error) toast.error('Failed to delete expense');
    else {
      toast.success('Expense deleted');
      await loadData();
    }
  }, [editing?.id, loadData, toast]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;

    (async () => {
      const response = await getByProjectId(projectId);
      if (!mounted || response?.error) return;

      const raw = Array.isArray(response.data) ? response.data : (response.data?.value || []);
      setScopeOptions(
        (raw || []).map((scope) => ({
          value: String(scope.id),
          label: scope.description || scope.name || scope.code || String(scope.id),
        }))
      );
    })();

    return () => { mounted = false; };
  }, [projectId]);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [item.name, item.code, item.description, item.desciption, item.amount, item.referenceNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    ...BASE_COLUMNS,
    {
      header: 'Scope',
      key: 'scopeId',
      render: (item) => {
        const match = scopeOptions.find((scope) => scope.value === String(item.scopeId));
        return match ? match.label : (item.scopeId || '—');
      },
    },
    {
      header: 'Actions',
      key: '__actions',
      align: 'right',
      render: (item) => isAllowed('Projects.Projects', 'w') ? (
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
              const title = 'Remove expense?';
              const message = item?.name
                ? `Remove expense "${item.name}"?`
                : 'Remove this expense?';
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
  ], [confirmModal, handleDelete, scopeOptions, isAllowed]);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Expenses</h2>
        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search expenses"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton={isAllowed('Projects.Projects', 'w')}
            buttonLabel={isAllowed('Projects.Projects', 'w') ? "Add Expense" : undefined}
            handleOnClick={isAllowed('Projects.Projects', 'w') ? () => { setEditing(null); setIsModalOpen(true); } : undefined}
            width="260px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No expenses for this project</div>
        ) : (
          <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No expenses found" />
        )}
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Expense' : 'Add Expense'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? Number(editing.id) : -1}
        isOpen={isModalOpen}
        fields={expensesModalFields}
        onItemRemove={handleDelete}
        onClose={isAllowed('Projects.Projects', 'w') ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          const payload = {
            name: value.name || '',
            code: value.code || '',
            projectId: Number(projectId) || 0,
            scopeId: Number(value.scopeId) || 0,
            amount: Number(value.amount) || 0,
            referenceNumber: Number(value.referenceNumber) || 0,
            description: value.description || '',
            desciption: value.description || '',
          };

          if (!value.id || value.id === 0) {
            const response = await createExpense(payload);
            if (response?.error) toast.error('Failed to add expense');
            else { toast.success('Expense added'); await loadData(); }
          } else {
            const response = await updateExpense(value.id, payload);
            if (response?.error) toast.error('Failed to update expense');
            else { toast.success('Expense updated'); await loadData(); }
          }

          setIsModalOpen(false);
          setEditing(null);
        } : undefined}
        readOnly={!isAllowed('Projects.Projects', 'w')}
      />
    </div>
  );
}
