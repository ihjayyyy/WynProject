'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import ExpensesModal from './ExpensesModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2 } from 'react-icons/fi';
import { getExpensesByProjectId, createExpense, updateExpense } from '../../services/Expense';
import { getByProjectId } from '../../services/ProjectScope';
import { useToast } from '../ui/Toast/Toast';

const BASE_COLUMNS = [
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Description', key: 'description', render: (item) => item.description || item.desciption || '—' },
  { header: 'Amount', key: 'amount', render: (item) => Number(item.amount || 0).toLocaleString() },
  { header: 'Reference #', key: 'referenceNumber', render: (item) => item.referenceNumber || '—' },
];

export default function ExpensesTab({ projectId = 0 }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scopeOptions, setScopeOptions] = useState([]);
  const toast = useToast();

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
      render: (item) => (
        <div className={styles.actionCell}>
          <Button
            size="sm"
            variant="outlinedPrimary"
            icon={<FiEdit2 />}
            title="Edit"
            onClick={() => { setEditing(item); setIsModalOpen(true); }}
          />
        </div>
      ),
    },
  ], [scopeOptions]);

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
            showButton
            buttonLabel="Add Expense"
            handleOnClick={() => { setEditing(null); setIsModalOpen(true); }}
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

      <ExpensesModal
        open={isModalOpen}
        initial={editing || {}}
        projectId={projectId}
        scopeOptions={scopeOptions}
        onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onConfirm={async (value) => {
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
        }}
      />
    </div>
  );
}
