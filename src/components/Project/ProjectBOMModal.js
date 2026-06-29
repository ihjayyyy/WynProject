'use client';

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiX } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import DataTable from '../ui/DataTable/DataTable';
import { getProjectBOMByProjectId } from '../../services/ProjectBOM';
import styles from './ProjectBOMModal.module.scss';

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

const columns = [
  { header: 'Code', key: 'code', width: '160px' },
  { header: 'Name', key: 'name', width: '160px' },
  { header: 'Quantity', key: 'quantity', align: 'right', width: '100px' },
  { header: 'Updated By', key: 'updatedBy', width: '120px', render: (it) => it.updatedBy || '-' },
  { header: 'Updated At', key: 'updatedAt', width: '160px', render: (it) => formatDateTime(it.updatedAt) },
];

export default function ProjectBOMModal({ open, projectId, projectLabel = '', onClose }) {
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
      setRows(list);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [open, projectId]);

  if (!open) return null;

  const handleDownloadPdf = () => {
    if (!rows.length) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('Project BOM', 14, 16);
    doc.setFontSize(10);
    if (projectLabel) {
      doc.text(`Project: ${projectLabel}`, 14, 22);
    }
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 16, { align: 'right' });
    doc.text(`Total Items: ${rows.length}`, pageWidth - 14, 22, { align: 'right' });

    autoTable(doc, {
      startY: 28,
      head: [['Code', 'Name', 'Quantity', 'Updated By', 'Updated At']],
      body: rows.map((item) => [
        item.code || '-',
        item.name || '-',
        item.quantity ?? '-',
        item.updatedBy || '-',
        formatDateTime(item.updatedAt),
      ]),
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
        2: { halign: 'right', cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    const safeLabel = (projectLabel || `project-${projectId}`).toString().replace(/[^a-z0-9-_]+/gi, '-');
    doc.save(`project-bom-${safeLabel}.pdf`);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Project BOM{projectLabel ? ` — ${projectLabel}` : ''}
          </h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {loading && <div className={styles.statusMsg}>Loading...</div>}
          {!loading && error && <div className={styles.statusMsg}>Error: {error}</div>}
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