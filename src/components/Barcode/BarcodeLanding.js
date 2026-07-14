'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { useToast } from '../ui/Toast/Toast';
import BarcodeService from '@/services/Barcode';

const baseColumns = [
  { header: 'Barcode', key: 'barcode' },
  {
    header: 'Material',
    key: 'name',
    render: (item) => (
      <>
        <b>{item.code || '-'}</b> - {item.name || '-'}
      </>
    ),
  },
  { header: 'Warehouse', key: 'warehouseName' },
  { header: 'Rack', key: 'rackName' },
  { header: 'Source', key: 'source' },
  {
    header: 'Used',
    key: 'isUsed',
    render: (item) => (item.isUsed ? 'Yes' : 'No'),
  },
  {
    header: 'Updated Date',
    key: 'updatedAt',
    render: (item) =>
      item.updatedAt
        ? new Date(item.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          })
        : '-',
  },
  { header: 'Updated By', key: 'updatedBy' },
];

const getBarcodeKey = (item) => String(item?.id ?? item?.barcode ?? item?.materialInventoryId ?? '');

export default function BarcodeLanding() {
  const toast = useToast();
  const [barcodes, setBarcodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedBarcodeKeys, setSelectedBarcodeKeys] = useState([]);

  const selectedBarcodes = useMemo(() => {
    if (!selectedBarcodeKeys.length) return [];
    const selectedSet = new Set(selectedBarcodeKeys);
    return barcodes.filter((item) => selectedSet.has(getBarcodeKey(item)));
  }, [barcodes, selectedBarcodeKeys]);

  const allSelected = useMemo(
    () => barcodes.length > 0 && selectedBarcodeKeys.length === barcodes.length,
    [barcodes.length, selectedBarcodeKeys.length]
  );

  const loadBarcodes = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await BarcodeService.getBarcodes();

    if (error) {
      setBarcodes([]);
      toast.error('Failed to load barcodes.');
      setIsLoading(false);
      return;
    }

    const normalized = Array.isArray(data) ? data : data ? [data] : [];
    setBarcodes(normalized);

    // Keep checked rows in sync after reloading server data.
    setSelectedBarcodeKeys((current) => {
      if (!current.length || !normalized.length) return [];
      const existingKeys = new Set(normalized.map((item) => getBarcodeKey(item)).filter(Boolean));
      return current.filter((key) => existingKeys.has(key));
    });

    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadBarcodes();
  }, [loadBarcodes]);

  const handlePrintConfirm = useCallback(async () => {
    if (isPrinting || selectedBarcodes.length === 0) return;

    setIsPrinting(true);
    const { data, error } = await BarcodeService.printBarcodes(selectedBarcodes);

    if (error) {
      const cleanError = String(error).replace(/^Error:\s*/i, '');
      toast.error(`Failed to print barcodes. ${cleanError}`);
      setIsPrinting(false);
      return;
    }

    if (data?.downloaded) {
      const baseMessage = `Barcode PDF downloaded (${data.fileName || 'barcodes.pdf'}).`;
      toast.success(
        data.selectionApplied === false
          ? `${baseMessage} Note: current API endpoint prints all barcodes and does not support selected filtering yet.`
          : baseMessage
      );
      setIsPrintModalOpen(false);
      setIsPrinting(false);
      await loadBarcodes();
      return;
    }

    const printedCount = Array.isArray(data)
      ? data.length
      : Array.isArray(data?.value)
      ? data.value.length
      : null;

    toast.success(
      printedCount !== null
        ? `Print request sent (${printedCount} barcode${printedCount === 1 ? '' : 's'}).`
        : 'Print request sent successfully.'
    );

    setIsPrintModalOpen(false);
    setIsPrinting(false);
    await loadBarcodes();
  }, [isPrinting, selectedBarcodes, loadBarcodes, toast]);

  const toggleSelectAll = useCallback(() => {
    setSelectedBarcodeKeys((current) => {
      if (barcodes.length === 0) return [];
      if (current.length === barcodes.length) return [];
      return barcodes.map((item) => getBarcodeKey(item)).filter(Boolean);
    });
  }, [barcodes]);

  const toggleBarcodeSelection = useCallback((item) => {
    const key = getBarcodeKey(item);
    if (!key) return;

    setSelectedBarcodeKeys((current) =>
      current.includes(key) ? current.filter((value) => value !== key) : [...current, key]
    );
  }, []);

  const columns = useMemo(
    () => [
      {
        header: (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            onClick={(event) => event.stopPropagation()}
            aria-label="Select all barcodes"
          />
        ),
        key: 'select',
        sortable: false,
        width: '56px',
        align: 'center',
        render: (item) => {
          const key = getBarcodeKey(item);
          return (
            <input
              type="checkbox"
              checked={selectedBarcodeKeys.includes(key)}
              onChange={() => toggleBarcodeSelection(item)}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Select barcode ${item?.barcode || item?.code || ''}`}
            />
          );
        },
      },
      ...baseColumns,
    ],
    [allSelected, selectedBarcodeKeys, toggleSelectAll, toggleBarcodeSelection]
  );

  const selectedCount = selectedBarcodeKeys.length;

  const barcodeStats = useMemo(() => {
    const total = barcodes.length;
    const used = barcodes.filter((item) => Boolean(item?.isUsed)).length;
    const available = total - used;
    const uniqueMaterialCount = new Set(
      barcodes.map((item) => item.materialId || item.materialInventoryId || item.code || item.id)
    ).size;

    return [
      {
        key: 'total',
        label: 'Total Barcodes',
        number: total,
        change: `${uniqueMaterialCount} material groups`,
        isPositive: true,
      },
      {
        key: 'available',
        label: 'Available',
        number: available,
        change: `${available} not used`,
        isPositive: true,
      },
      {
        key: 'used',
        label: 'Used',
        number: used,
        change: `${used} already used`,
        isPositive: used === 0,
      },
    ];
  }, [barcodes]);

  const filterFn = (item, keyword) =>
    [
      item.id,
      item.barcode,
      item.code,
      item.name,
      item.source,
      item.warehouseName,
      item.rackName,
      item.updatedBy,
    ]
      .filter((value) => value !== undefined && value !== null && value !== '')
      .some((value) => String(value).toLowerCase().includes(keyword));

  return (
    <>
      <Landing
        title="Barcodes"
        data={barcodes}
        columns={columns}
        stats={barcodeStats}
        searchPlaceholder="Search barcodes"
        newButtonLabel="Print Barcodes"
        onNew={() => {
          if (selectedCount === 0) {
            toast.error('Please select at least one barcode to print.');
            return;
          }
          setIsPrintModalOpen(true);
        }}
        emptyMessage={isLoading ? 'Loading barcodes...' : 'No barcodes found'}
        width="320px"
        filterFn={filterFn}
        belowStatsAddon={
          <div style={{ color: '#334155', fontSize: '12px' }}>
            Selected: <b>{selectedCount}</b>
          </div>
        }
      />

      <ConfirmModal
        open={isPrintModalOpen}
        title="Print Barcodes"
        message={`Are you sure you want to print ${selectedCount} selected barcode${selectedCount === 1 ? '' : 's'}?`}
        confirmText={isPrinting ? 'Printing...' : 'Print'}
        confirmVariant="primary"
        onConfirm={handlePrintConfirm}
        onCancel={() => {
          if (!isPrinting) setIsPrintModalOpen(false);
        }}
      >
        <div style={{ marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
          This will call the barcode print endpoint and queue only the selected barcode output from the server.
        </div>
      </ConfirmModal>
    </>
  );
}
