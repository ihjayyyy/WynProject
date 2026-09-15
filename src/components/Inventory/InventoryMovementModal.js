'use client';

import React, { useEffect, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import DataTable from '../ui/DataTable/DataTable';
import { getInventoryMovementsFilteredByMaterial } from '../../services/InventoryMovement';
import styles from './InventoryMovementModal.module.scss';

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

  // Re-seed local dates whenever the modal is (re)opened with new prop defaults.
  useEffect(() => {
    if (open) {
      setFromDate(toInputDateValue(initialFromDate));
      setToDate(toInputDateValue(initialToDate));
    }
  }, [open, initialFromDate, initialToDate]);

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
              aria-label="Toggle date filters"
              title="Toggle date filters"
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

            <Button variant="secondary" onClick={handleClearDates}>
              Clear dates
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
              data={rows}
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