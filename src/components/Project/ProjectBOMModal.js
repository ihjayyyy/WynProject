'use client';

import React, { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import DataTable from '../ui/DataTable/DataTable';
import { getProjectBOMByProjectId } from '../../services/ProjectBOM';
import {
  createPdfDocument,
  drawPdfHeader,
  loadPdfLogo,
  previewPdfDocument,
  renderPdfTable,
} from '../../utils/pdfTemplate';
import styles from './ProjectBOMModal.module.scss';

function formatDateTime(value) {
  if (!value) return '-';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString();
}

const columns = [
  { header: 'Scope', key: 'scopeName', width: '160px' },
  { header: 'Code', key: 'code', width: '160px' },
  { header: 'Name', key: 'name', width: '160px' },
  { header: 'Delivered Quantity', key: 'deliveredQuantity', width: '100px' },
  { header: 'Returned Quantity', key: 'returnedQuantity', width: '160px' },
  { header: 'Quantity', key: 'quantity', align: 'right', width: '100px' },
];

export default function ProjectBOMModal({
  open,
  projectId,
  projectLabel = '',
  onClose,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !projectId) return;

    let mounted = true;

    setLoading(true);
    setError(null);

    (async () => {
      const res = await getProjectBOMByProjectId(projectId);

      if (!mounted) return;

      if (!res || res.error) {
        setRows([]);
        setError(res?.error ? String(res.error) : 'Failed to load Project BOM');
        setLoading(false);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];

      const sortedList = [...list].sort((a, b) => {
        const scopeA = a?.scopeName?.toLowerCase() || '';
        const scopeB = b?.scopeName?.toLowerCase() || '';

        return scopeA.localeCompare(scopeB);
      });

      setRows(sortedList);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [open, projectId]);

  if (!open) return null;

  const handleDownloadPdf = async () => {
    if (!rows.length) return;

    const doc = createPdfDocument({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let logoInfo = null;
    try {
      logoInfo = await loadPdfLogo();
    } catch {
      logoInfo = null;
    }

    const tableStartY = drawPdfHeader(doc, {
      logoInfo,
      title: 'PROJECT BOM',
      leftDetails: projectLabel ? [`Project: ${projectLabel}`] : [],
      rightDetails: [
        `Generated: ${new Date().toLocaleString()}`,
        `Total Items: ${rows.length}`,
      ],
    });

    const pdfHeaders = columns.map((column) => column.header);

    const pdfBody = rows.map((item) =>
      columns.map((column) => {
        const value = item?.[column.key];

        if (column.key === 'quantity') return value ?? '-';

        return value ? String(value) : '-';
      })
    );

    renderPdfTable(doc, {
      startY: tableStartY,
      head: [pdfHeaders],
      body: pdfBody,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39],
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
      },
      bodyStyles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 27 },
        2: { cellWidth: 43 },
        3: { halign: 'right', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 27 },
        5: { halign: 'right', cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    previewPdfDocument(doc);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Project BOM{projectLabel ? ` — ${projectLabel}` : ''}
          </h3>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

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
              emptyMessage="No BOM records found"
            />
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            icon={<FiDownload size={14} />}
            onClick={handleDownloadPdf}
            disabled={!rows.length}
          >
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}