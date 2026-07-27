'use client';

import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiX } from 'react-icons/fi';
import Button from '../ui/Button/Button';
import DataTable from '../ui/DataTable/DataTable';
import { getProposalBOM } from '../../services/ProjectBOM';
import styles from './ProposalBOMModal.module.scss';

const columns = [
  { header: 'Scope', key: 'proposalScopeName', width: '220px' },
  { header: 'Code', key: 'code', width: '180px' },
  { header: 'Name', key: 'name', width: '220px' },
  { header: 'Quantity', key: 'quantity', align: 'right', width: '100px' },
];

export default function ProposalBOMModal({
  open,
  proposalId,
  proposalLabel = '',
  proposalName = '',
  companyName = '',
  onClose,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !proposalId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      const res = await getProposalBOM(proposalId);
      if (!mounted) return;

      if (!res || res.error) {
        setRows([]);
        setError(res?.error ? String(res.error) : 'Failed to load Proposal BOM');
        setLoading(false);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];

      const sortedList = [...list].sort((a, b) => {
        const scopeA = a?.proposalScopeName?.toLowerCase() || '';
        const scopeB = b?.proposalScopeName?.toLowerCase() || '';

        return scopeA.localeCompare(scopeB);
      });

      setRows(sortedList);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [open, proposalId]);

  if (!open) return null;

  const handleDownloadPdf = () => {
    if (!rows.length) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text('Proposal BOM', 14, 16);
    doc.setFontSize(10);

    // Left column: proposal label / name / company
    let leftY = 22;
    if (proposalLabel) {
      doc.text(`Proposal: ${proposalLabel}`, 14, leftY);
      leftY += 6;
    }
    if (proposalName) {
      doc.text(`Proposal Name: ${proposalName}`, 14, leftY);
      leftY += 6;
    }
    if (companyName) {
      doc.text(`Company: ${companyName}`, 14, leftY);
      leftY += 6;
    }

    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 16, {
      align: 'right',
    });

    doc.text(`Total Items: ${rows.length}`, pageWidth - 14, 22, {
      align: 'right',
    });

    const pdfHeaders = columns.map((column) => column.header);

    const pdfBody = rows.map((item) =>
      columns.map((column) => {
        const value = item?.[column.key];

        if (column.key === 'quantity') return value ?? '-';

        return value ? String(value) : '-';
      })
    );

    // Push table start down to accommodate the extra header lines
    const startY = Math.max(leftY, 28) + 2;

    autoTable(doc, {
      startY,
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
            3: { halign: 'right' },
          },
          tableWidth: 'auto',
          margin: { left: 14, right: 14 },
          theme: 'grid',
    });

    const safeLabel = (proposalLabel || `proposal-${proposalId}`)
      .toString()
      .replace(/[^a-z0-9-_]+/gi, '-');

    doc.save(`proposal-bom-${safeLabel}.pdf`);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Proposal BOM{proposalLabel ? ` - ${proposalLabel}` : ''}
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
          {(proposalName || companyName) && (
            <div className={styles.metaRow}>
              {proposalName && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Proposal Name:</span>{' '}
                  <span className={styles.metaValue}>{proposalName}</span>
                </div>
              )}
              {companyName && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Company Name:</span>{' '}
                  <span className={styles.metaValue}>{companyName}</span>
                </div>
              )}
            </div>
          )}

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