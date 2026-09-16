'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import DataTable from '../ui/DataTable/DataTable';
import { getInventoryMovementsFilteredByMaterial } from '../../services/InventoryMovement';
import styles from './InventoryMovementModal.module.scss';
import inputStyles from '../ui/Input/Input.module.scss';

const quantityFormat = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

// Converts a Date (or date-ish value) into 'YYYY-MM-DD' for the Input's date type.
function toInputDateValue(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function InventoryMovementModal({
  open,
  materialId,
  materialLabel = '',
  onClose,
  rackMap = {},
  fromDate: initialFromDate,
  toDate: initialToDate,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Local, editable date range — seeded from props but changeable by the user.
  const [fromDate, setFromDate] = useState(toInputDateValue(initialFromDate));
  const [toDate, setToDate] = useState(toInputDateValue(initialToDate));

  // FE-only filters (applied client-side against whatever rows are loaded).
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Re-seed local dates whenever the modal is (re)opened with new prop defaults.
  useEffect(() => {
    if (open) {
      setFromDate(toInputDateValue(initialFromDate));
      setToDate(toInputDateValue(initialToDate));
    }
  }, [open, initialFromDate, initialToDate]);

  // Reset FE filters whenever the modal is reopened.
  useEffect(() => {
    if (open) {
      setActionTypeFilter('');
      setModeFilter('');
    }
  }, [open, materialId]);

  useEffect(() => {
    if (!open || (materialId === undefined || materialId === null)) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      const res = await getInventoryMovementsFilteredByMaterial(materialId, fromDate, toDate);

      if (!mounted) return;

      if (!res || res.error) {
        setRows([]);
        setError(res?.error ? String(res.error) : 'Failed to load inventory movements');
        setLoading(false);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.value) ? res.data.value : [];

      // Date range is filtered server-side via the fromDate/toDate query params.
      const sortedList = [...list].sort((a, b) => {
        const dateA = a?.createdAt || a?.date || a?.updatedAt || '';
        const dateB = b?.createdAt || b?.date || b?.updatedAt || '';
        return String(dateB).localeCompare(String(dateA));
      });

      setRows(sortedList);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [open, materialId, fromDate, toDate]);

  // Build dropdown options from whatever data is currently loaded.
  const actionTypeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rows.map((r) => r.actionType).filter((v) => v !== undefined && v !== null && v !== ''))
    );
    return [
      { value: '', label: 'All action types' },
      ...unique.map((v) => ({ value: v, label: v })),
    ];
  }, [rows]);

  const modeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(rows.map((r) => r.mode).filter((v) => v !== undefined && v !== null && v !== ''))
    );
    return [
      { value: '', label: 'All modes' },
      ...unique.map((v) => ({ value: v, label: v })),
    ];
  }, [rows]);

  // Apply FE-only filters on top of the server-loaded rows.
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (actionTypeFilter && String(r.actionType) !== String(actionTypeFilter)) return false;
      if (modeFilter && String(r.mode) !== String(modeFilter)) return false;
      return true;
    });
  }, [rows, actionTypeFilter, modeFilter]);

  if (!open) return null;

  const columns = [
    {
      header: 'Date',
      key: 'createdAt',
      render: (item) => formatDateTime(item.createdAt || item.date || item.updatedAt),
    },
    { header: 'Reference No.', key: 'referenceNumber' },
    {
      header: 'Rack',
      key: 'rackId',
      render: (item) => rackMap[item.rackId]?.name || rackMap[item.rackId] || item.rackId || '-',
    },
    {
      header: 'Qty Before',
      key: 'quantityBefore',
      align: 'right',
      render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityBefore)}</div>,
    },
    {
      header: 'Qty Change',
      key: 'quantityChange',
      align: 'right',
      render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityChange)}</div>,
    },
    {
      header: 'Qty After',
      key: 'quantityAfter',
      align: 'right',
      render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityAfter)}</div>,
    },
    { header: 'Action Type', key: 'actionType' },
    { header: 'Mode', key: 'mode' },
  ];

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  const handleClearAllFilters = () => {
    setFromDate('');
    setToDate('');
    setActionTypeFilter('');
    setModeFilter('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Inventory Movement{materialLabel ? ` — ${materialLabel}` : ''}
          </h3>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={`${styles.filterToggleBtn} ${showFilters ? styles.filterToggleBtnActive : ''}`}
              onClick={() => setShowFilters((prev) => !prev)}
              aria-label="Toggle filters"
              title="Toggle filters"
            >
              <FiFilter size={16} />
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={styles.filters}>
            <Input
              id="inventoryMovementFromDate"
              label="From"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />

            <Input
              id="inventoryMovementToDate"
              label="To"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />

            <div className={inputStyles.field}>
              <label htmlFor="inventoryMovementActionType">Action Type</label>
              <Select
                id="inventoryMovementActionType"
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                options={actionTypeOptions}
                placeholder="All action types"
              />
            </div>

            <div className={inputStyles.field}>
              <label htmlFor="inventoryMovementMode">Mode</label>
              <Select
                id="inventoryMovementMode"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                options={modeOptions}
                placeholder="All modes"
              />
            </div>

            <Button variant="secondary" onClick={handleClearAllFilters}>
              Clear filters
            </Button>
          </div>
        )}

        <div className={styles.body}>
          {loading && <div className={styles.statusMsg}>Loading...</div>}

          {!loading && error && (
            <div className={styles.statusMsg}>Error: {error}</div>
          )}

          {!loading && !error && (
            <DataTable
              columns={columns}
              data={filteredRows}
              showActions={false}
              emptyMessage="No inventory movements found"
            />
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}