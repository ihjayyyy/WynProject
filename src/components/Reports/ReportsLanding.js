'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Select from '../ui/Select/Select';
import Button from '../ui/Button/Button';
import { getReports } from '../../services/Reports';
import { getSuppliers } from '../../services/Supplier';
import { getRacks } from '../../services/Rack';
import styles from './ReportsLanding.module.scss';

const EMPTY_DATE = '0001-01-01T00:00:00';

const getReferenceNo = (item) =>
  item?.proposalNo ||
  item?.projectNo ||
  item?.salesBillingNo ||
  item?.collectionNo ||
  item?.orderNumber ||
  item?.requestNumber ||
  item?.invoiceNumber ||
  item?.referenceNumber ||
  item?.deliveryNumber ||
  '-';

const getPartyName = (item) =>
  item?.customerName || item?.companyName || item?.supplierName || item?.projectName || item?.materialName || '-';

const getPrimaryDate = (item) =>
  item?.requestDate ||
  item?.forecastedStartDate ||
  item?.startDate ||
  item?.billingDate ||
  item?.date ||
  item?.orderDate ||
  item?.invoiceDate ||
  item?.deliveryDate ||
  item?.createdAt ||
  null;

const getAmount = (item) => {
  const options = [item?.proposalTotal, item?.contractPrice, item?.amount, item?.totalAmountPaid, item?.balance];
  const found = options.find((value) => value !== null && value !== undefined);
  return Number(found) || 0;
};

const formatDate = (value) => {
  if (!value || value === EMPTY_DATE) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value || value === EMPTY_DATE) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const asText = (value, fallback = '-') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatReportCurrency = (value) =>
  `PHP ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)}`;

const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const pad2 = (value) => String(value).padStart(2, '0');

const toDateInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getTodayDate = () => toDateInputValue(new Date());

const getEndOfMonthDate = () => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return toDateInputValue(endOfMonth);
};

const MODULE_OPTIONS = [
  { label: 'Proposal', value: 'proposal' },
  { label: 'Project', value: 'project' },
  { label: 'Sales Billing', value: 'salesbilling' },
  { label: 'Sales Collection', value: 'salescollection' },
  { label: 'Purchase Order', value: 'purchaseorder' },
  { label: 'Purchase Invoice', value: 'purchaseinvoice' },
  { label: 'Purchase Delivery', value: 'purchasedelivery' },
  { label: 'Inventory Movement', value: 'inventoryMovement' },
];

const SUPPLIER_FILTER_MODULES = ['purchaseorder', 'purchaseinvoice', 'purchasedelivery'];
const RACK_FILTER_MODULE = 'inventoryMovement';

export default function ReportsLanding() {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState('proposal');
  const [dateFrom, setDateFrom] = useState(getTodayDate);
  const [dateTo, setDateTo] = useState(getEndOfMonthDate);
  const [supplierId, setSupplierId] = useState('');
  const [supplierOptions, setSupplierOptions] = useState([{ label: 'All Suppliers', value: '' }]);
  const [rackId, setRackId] = useState('');
  const [rackOptions, setRackOptions] = useState([{ label: 'All Racks', value: '' }]);

  const shouldUseSupplierFilter = SUPPLIER_FILTER_MODULES.includes(selectedModule);
  const shouldUseRackFilter = selectedModule === RACK_FILTER_MODULE;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await getSuppliers();
      if (!mounted) return;

      if (res?.error || !Array.isArray(res?.data)) {
        setSupplierOptions([{ label: 'All Suppliers', value: '' }]);
        return;
      }

      const options = res.data.map((item) => ({
        value: String(item?.id ?? ''),
        label: item?.supplierName || item?.name || item?.code || `Supplier ${item?.id ?? ''}`,
      }));

      setSupplierOptions([{ label: 'All Suppliers', value: '' }, ...options.filter((item) => item.value)]);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await getRacks();
      if (!mounted) return;

      if (res?.error || !Array.isArray(res?.data)) {
        setRackOptions([{ label: 'All Racks', value: '' }]);
        return;
      }

      const options = res.data.map((item) => ({
        value: String(item?.id ?? ''),
        label: item?.name || item?.code || `Rack ${item?.id ?? ''}`,
      }));

      setRackOptions([{ label: 'All Racks', value: '' }, ...options.filter((item) => item.value)]);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldUseSupplierFilter && supplierId) {
      setSupplierId('');
    }
  }, [shouldUseSupplierFilter, supplierId]);

  useEffect(() => {
    if (!shouldUseRackFilter && rackId) {
      setRackId('');
    }
  }, [shouldUseRackFilter, rackId]);

  useEffect(() => {
    let mounted = true;
    const effectiveSupplierId = shouldUseSupplierFilter ? supplierId : '';
    const effectiveRackId = shouldUseRackFilter ? rackId : '';

    (async () => {
      if (mounted) {
        setLoading(true);
      }

      try {
        const res = await getReports({
          modules: selectedModule,
          dateFrom,
          dateTo,
          supplierId: effectiveSupplierId,
          rackId: effectiveRackId,
        });
        if (!mounted) return;

        if (res?.error) {
          setRows([]);
          setTotalCount(0);
          setError(String(res.error));
          return;
        }

        const payload = res?.data;
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

        const normalized = items.map((item, index) => {
          const status = item?.status || item?.proposalStatus || '-';
          const detailStatuses = [item?.approvalStatus, item?.paymentStatus, item?.deliveryStatus]
            .filter(Boolean)
            .filter((value) => String(value).toLowerCase() !== String(status).toLowerCase());

          return {
            key: `${item?.module || 'Unknown'}-${getReferenceNo(item)}-${index}`,
            module: item?.module || 'Unknown',
            referenceNo: getReferenceNo(item),
            partyName: getPartyName(item),
            primaryDateRaw: getPrimaryDate(item),
            primaryDate: formatDate(getPrimaryDate(item)),
            amount: getAmount(item),
            status,
            detailStatuses,
            raw: item || {},
            searchableText: JSON.stringify(item || {}).toLowerCase(),
          };
        });

        setRows(normalized);
        setTotalCount(Number(payload?.totalCount) || normalized.length);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setRows([]);
        setTotalCount(0);
        setError(err?.message || 'Failed to load report data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    selectedModule,
    dateFrom,
    dateTo,
    supplierId,
    shouldUseSupplierFilter,
    rackId,
    shouldUseRackFilter,
  ]);

  const columns = useMemo(() => {
    const commonStatus = {
      header: 'Status',
      key: 'status',
      render: (item) => <StatusBadge status={item.status} />,
    };

    const moduleKey = String(selectedModule || 'all').toLowerCase();

    if (moduleKey === 'proposal') {
      return [
        { header: 'Proposal No', key: 'proposalNo', render: (item) => asText(item.raw?.proposalNo) },
        { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
        { header: 'Start Date', key: 'forecastedStartDate', render: (item) => formatDate(item.raw?.forecastedStartDate) },
        {
          header: 'Proposal Total',
          key: 'proposalTotal',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.proposalTotal),
        },
        commonStatus,
        {
          header: 'Approval',
          key: 'approvalStatus',
          render: (item) => <StatusBadge status={asText(item.raw?.approvalStatus)} />,
        },
      ];
    }

    if (moduleKey === 'project') {
      return [
        { header: 'Project No', key: 'projectNo', render: (item) => asText(item.raw?.projectNo) },
        { header: 'Company', key: 'companyName', render: (item) => asText(item.raw?.companyName) },
        { header: 'Start Date', key: 'startDate', render: (item) => formatDate(item.raw?.startDate) },
        { header: 'End Date', key: 'endDate', render: (item) => formatDate(item.raw?.endDate) },
        {
          header: 'Contract Price',
          key: 'contractPrice',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.contractPrice),
        },
        {
          header: 'Progress %',
          key: 'overallProgress',
          align: 'right',
          render: (item) => `${Number(item.raw?.overallProgress || 0).toFixed(2)}%`,
        },
        commonStatus,
      ];
    }

    if (moduleKey === 'salesbilling') {
      return [
        { header: 'Billing No', key: 'salesBillingNo', render: (item) => asText(item.raw?.salesBillingNo) },
        { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
        { header: 'Billing Date', key: 'billingDate', render: (item) => formatDate(item.raw?.billingDate) },
        { header: 'Due Date', key: 'dueDate', render: (item) => formatDate(item.raw?.dueDate) },
        {
          header: 'Amount',
          key: 'amount',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.amount),
        },
        {
          header: 'Balance',
          key: 'balance',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.balance),
        },
        commonStatus,
        {
          header: 'Payment',
          key: 'paymentStatus',
          render: (item) => <StatusBadge status={asText(item.raw?.paymentStatus)} />,
        },
      ];
    }

    if (moduleKey === 'salescollection') {
      return [
        { header: 'Collection No', key: 'collectionNo', render: (item) => asText(item.raw?.collectionNo) },
        { header: 'Receipt No', key: 'receiptNumber', render: (item) => asText(item.raw?.receiptNumber) },
        { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
        { header: 'Date', key: 'date', render: (item) => formatDate(item.raw?.date) },
        {
          header: 'Amount',
          key: 'amount',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.amount),
        },
        {
          header: 'Total Paid',
          key: 'totalAmountPaid',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.totalAmountPaid),
        },
        commonStatus,
      ];
    }

    if (moduleKey === 'purchaseorder') {
      return [
        { header: 'Order No', key: 'orderNumber', render: (item) => asText(item.raw?.orderNumber) },
        { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
        { header: 'Order Date', key: 'orderDate', render: (item) => formatDate(item.raw?.orderDate) },
        {
          header: 'Est. Delivery',
          key: 'estimatedDeliveryDate',
          render: (item) => formatDate(item.raw?.estimatedDeliveryDate),
        },
        {
          header: 'Amount',
          key: 'amount',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.amount),
        },
        commonStatus,
        {
          header: 'Delivery',
          key: 'deliveryStatus',
          render: (item) => <StatusBadge status={asText(item.raw?.deliveryStatus)} />,
        },
      ];
    }

    if (moduleKey === 'purchaseinvoice') {
      return [
        { header: 'Invoice No', key: 'invoiceNumber', render: (item) => asText(item.raw?.invoiceNumber) },
        { header: 'PO No', key: 'purchaseOrderNumber', render: (item) => asText(item.raw?.purchaseOrderNumber) },
        { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
        { header: 'Invoice Date', key: 'invoiceDate', render: (item) => formatDate(item.raw?.invoiceDate) },
        { header: 'Due Date', key: 'dueDate', render: (item) => formatDate(item.raw?.dueDate) },
        {
          header: 'Amount',
          key: 'amount',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.amount),
        },
        {
          header: 'Balance',
          key: 'balance',
          align: 'right',
          render: (item) => formatCurrency(item.raw?.balance),
        },
        commonStatus,
        {
          header: 'Payment',
          key: 'paymentStatus',
          render: (item) => <StatusBadge status={asText(item.raw?.paymentStatus)} />,
        },
      ];
    }

    if (moduleKey === 'purchasedelivery') {
      return [
        { header: 'Delivery No', key: 'deliveryNumber', render: (item) => asText(item.raw?.deliveryNumber) },
        { header: 'Order No', key: 'orderNumber', render: (item) => asText(item.raw?.orderNumber) },
        { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
        { header: 'Delivery Date', key: 'deliveryDate', render: (item) => formatDate(item.raw?.deliveryDate) },
        commonStatus,
      ];
    }

    if (moduleKey === 'inventorymovement') {
      return [
        { header: 'Reference No', key: 'referenceNumber', render: (item) => asText(item.raw?.referenceNumber) },
        { header: 'Material', key: 'materialName', render: (item) => asText(item.raw?.materialName) },
        { header: 'Action Type', key: 'actionType', render: (item) => asText(item.raw?.actionType) },
        { header: 'Mode', key: 'mode', render: (item) => asText(item.raw?.mode) },
        {
          header: 'Before',
          key: 'quantityBefore',
          align: 'right',
          render: (item) => Number(item.raw?.quantityBefore || 0).toLocaleString(),
        },
        {
          header: 'Change',
          key: 'quantityChange',
          align: 'right',
          render: (item) => Number(item.raw?.quantityChange || 0).toLocaleString(),
        },
        {
          header: 'After',
          key: 'quantityAfter',
          align: 'right',
          render: (item) => Number(item.raw?.quantityAfter || 0).toLocaleString(),
        },
        { header: 'Created At', key: 'createdAt', render: (item) => formatDateTime(item.raw?.createdAt) },
      ];
    }

    return [
      { header: 'Module', key: 'module' },
      { header: 'Reference No', key: 'referenceNo' },
      { header: 'Party', key: 'partyName' },
      { header: 'Date', key: 'primaryDate' },
      {
        header: 'Amount',
        key: 'amount',
        align: 'right',
        render: (item) => formatCurrency(item.amount),
      },
      commonStatus,
      {
        header: 'Details Status',
        key: 'details',
        render: (item) =>
          item.detailStatuses.length ? (
            <div className={styles.detailsWrap}>
              {item.detailStatuses.map((entry) => (
                <StatusBadge key={`${item.key}-${entry}`} status={entry} className={styles.detailBadge} />
              ))}
            </div>
          ) : (
            '-'
          ),
      },
    ];
  }, [selectedModule]);

  const stats = useMemo(() => {
    const modules = new Set(rows.map((item) => item.module)).size;
    const totalAmount = rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const pendingCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      return statusText.includes('pending') || statusText.includes('draft') || statusText.includes('unpaid');
    }).length;

    return [
      {
        key: 'total',
        label: 'Total Records',
        number: totalCount,
        change: `${rows.length} loaded`,
        isPositive: true,
      },
      {
        key: 'modules',
        label: 'Active Modules',
        number: modules,
        change: `${modules} categories`,
        isPositive: true,
      },
      {
        key: 'amount',
        label: 'Combined Amount',
        number: formatCurrency(totalAmount),
        change: 'Across all modules',
        isPositive: true,
      },
      {
        key: 'pending',
        label: 'Needs Attention',
        number: pendingCount,
        change: 'Pending, draft, unpaid',
        isPositive: pendingCount === 0,
      },
    ];
  }, [rows, totalCount]);

  const filterFn = (item, keyword) => {
    const haystack = [
      item.module,
      item.referenceNo,
      item.partyName,
      item.primaryDate,
      item.status,
      item.detailStatuses.join(' '),
      item.searchableText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  };

  const exportRows = useMemo(
    () =>
      rows.map((item) => ({
        module: item.module,
        referenceNo: item.referenceNo,
        partyName: item.partyName,
        primaryDate: item.primaryDate,
        amount: Number(item.amount) || 0,
        status: item.status,
        details: item.detailStatuses.join(', '),
      })),
    [rows]
  );

  const canExport = exportRows.length > 0;

  const handleGenerateCsv = () => {
    const headers = ['Module', 'Reference No', 'Party', 'Date', 'Amount', 'Status', 'Details Status'];
    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...exportRows.map((item) =>
        [item.module, item.referenceNo, item.partyName, item.primaryDate, formatReportCurrency(item.amount), item.status, item.details]
          .map(escapeCsvValue)
          .join(','),
      ),
    ];

    const blob = new Blob(["\ufeff" + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reports-${selectedModule}-${dateFrom}-${dateTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePdf = () => {
    if (!canExport) return;
    const reportTitle = 'Reports';
    const selectedModuleLabel = MODULE_OPTIONS.find((option) => option.value === selectedModule)?.label || 'All';
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Module: ${selectedModuleLabel}`, pageWidth - 14, 16, { align: 'right' });
    doc.text(`Date From: ${dateFrom || '-'}`, pageWidth - 14, 22, { align: 'right' });
    doc.text(`Date To: ${dateTo || '-'}`, pageWidth - 14, 28, { align: 'right' });

    const totalLoaded = rows.length;
    const combinedAmount = rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    doc.setFontSize(9);
    doc.text(`Total Records: ${totalCount}`, 14, 30);
    doc.text(`Loaded Rows: ${totalLoaded}`, 14, 35);
    doc.text(`Combined Amount: ${formatReportCurrency(combinedAmount)}`, 14, 40);

    autoTable(doc, {
      startY: 46,
      head: [[
        'Module',
        'Reference No',
        'Party',
        'Date',
        'Amount',
        'Status',
        'Details Status',
      ]],
      body: exportRows.map((item) => [
        item.module,
        item.referenceNo,
        item.partyName,
        item.primaryDate,
        formatReportCurrency(item.amount),
        item.status,
        item.details || '-',
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
        4: { halign: 'right', cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
      pageBreak: 'auto',
    });

    doc.save(`reports-${selectedModule}-${dateFrom}-${dateTo}.pdf`);
  };

  const reportActions = (
    <div className={styles.exportActions}>
      <Button variant="secondary" onClick={handleGenerateCsv} icon={<FiDownload size={14} />} disabled={!canExport}>
        CSV
      </Button>
      <Button variant="secondary" onClick={handleGeneratePdf} icon={<FiFileText size={14} />} disabled={!canExport}>
        PDF
      </Button>
    </div>
  );

  const reportFilters = (
    <div className={styles.filtersWrap}>
      <div className={styles.moduleFilterWrap}>
        <label htmlFor='reports-module-filter' className={styles.moduleLabel}>
          Module
        </label>
        <Select
          id='reports-module-filter'
          value={selectedModule}
          onChange={(event) => setSelectedModule(event.target.value)}
          options={MODULE_OPTIONS}
          placeholder='Select module'
          className={styles.moduleSelect}
        />
      </div>

      <div className={styles.dateFilterWrap}>
        <label htmlFor='reports-date-from' className={styles.moduleLabel}>
          Date From
        </label>
        <input
          id='reports-date-from'
          type='date'
          value={dateFrom}
          max={dateTo}
          onChange={(event) => setDateFrom(event.target.value)}
          className={styles.dateInput}
        />
      </div>

      <div className={styles.dateFilterWrap}>
        <label htmlFor='reports-date-to' className={styles.moduleLabel}>
          Date To
        </label>
        <input
          id='reports-date-to'
          type='date'
          value={dateTo}
          min={dateFrom}
          onChange={(event) => setDateTo(event.target.value)}
          className={styles.dateInput}
        />
      </div>

      {shouldUseSupplierFilter ? (
        <div className={styles.supplierFilterWrap}>
          <label htmlFor='reports-supplier-filter' className={styles.moduleLabel}>
            Supplier
          </label>
          <Select
            id='reports-supplier-filter'
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            options={supplierOptions}
            placeholder='All Suppliers'
            className={styles.supplierSelect}
          />
        </div>
      ) : null}

      {shouldUseRackFilter ? (
        <div className={styles.rackFilterWrap}>
          <label htmlFor='reports-rack-filter' className={styles.moduleLabel}>
            Rack
          </label>
          <Select
            id='reports-rack-filter'
            value={rackId}
            onChange={(event) => setRackId(event.target.value)}
            options={rackOptions}
            placeholder='All Racks'
            className={styles.rackSelect}
          />
        </div>
      ) : null}
    </div>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <Landing
      title='Reports'
      data={rows}
      columns={columns}
      stats={stats}
      searchPlaceholder='Search reports, refs, status, or party'
      emptyMessage={error ? `Error: ${error}` : 'No report records found'}
      width='420px'
      filterFn={filterFn}
      headerAddon={reportActions}
      belowStatsAddon={reportFilters}
    />
  );
}
