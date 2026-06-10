'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Select from '../ui/Select/Select';
import Button from '../ui/Button/Button';
import { AccessContext } from '@/app/contextProviders/accessContext';
import {
  DEFAULT_MODULE_OPTIONS,
  MODULE_ACCESS_REQUIREMENTS,
  SUPPLIER_FILTER_MODULES,
  RACK_FILTER_MODULE,
  normalizeModuleValue,
  toModuleLabel,
  getStatusOptionsForModule,
  getReportColumns,
} from './ReportsModels';
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

const getReportItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export default function ReportsLanding() {
  const { isAllowed } = useContext(AccessContext);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState('proposal');
  const [status, setStatus] = useState('');
  const [moduleOptions, setModuleOptions] = useState(DEFAULT_MODULE_OPTIONS);
  const [dateFrom, setDateFrom] = useState(getTodayDate);
  const [dateTo, setDateTo] = useState(getEndOfMonthDate);
  const [supplierId, setSupplierId] = useState('');
  const [supplierOptions, setSupplierOptions] = useState([{ label: 'All Suppliers', value: '' }]);
  const [rackId, setRackId] = useState('');
  const [rackOptions, setRackOptions] = useState([{ label: 'All Racks', value: '' }]);

  const accessibleModuleOptions = useMemo(
    () =>
      moduleOptions.filter((option) => {
        const optionValue = normalizeModuleValue(option.value);
        const requiredAccessNames = MODULE_ACCESS_REQUIREMENTS[optionValue] || [];
        if (!requiredAccessNames.length) return true;
        return requiredAccessNames.some((accessName) => isAllowed(accessName, 'r'));
      }),
    [moduleOptions, isAllowed]
  );

  const hasAccessibleModule = accessibleModuleOptions.length > 0;

  const shouldUseSupplierFilter = SUPPLIER_FILTER_MODULES.includes(selectedModule);
  const shouldUseRackFilter = selectedModule === RACK_FILTER_MODULE;
  const statusOptions = useMemo(() => getStatusOptionsForModule(selectedModule), [selectedModule]);

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

    (async () => {
      const res = await getReports({ modules: 'all', dateFrom, dateTo });
      if (!mounted) return;

      if (res?.error) {
        setModuleOptions(DEFAULT_MODULE_OPTIONS);
        return;
      }

      const items = getReportItems(res?.data);
      const discovered = new Map();

      items.forEach((item) => {
        const value = normalizeModuleValue(item?.module);
        if (!value) return;
        discovered.set(value, toModuleLabel(item?.module || value));
      });

      const defaultValues = new Set(DEFAULT_MODULE_OPTIONS.map((option) => normalizeModuleValue(option.value)));
      const dynamicExtras = Array.from(discovered.entries())
        .filter(([value]) => !defaultValues.has(value))
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const mergedOptions = [
        ...DEFAULT_MODULE_OPTIONS.map((option) => ({
          ...option,
          label: discovered.get(normalizeModuleValue(option.value)) || option.label,
        })),
        ...dynamicExtras,
      ];

      setModuleOptions(mergedOptions);
      setSelectedModule((current) =>
        mergedOptions.some((option) => normalizeModuleValue(option.value) === normalizeModuleValue(current))
          ? current
          : mergedOptions[0]?.value || 'proposal'
      );
    })();

    return () => {
      mounted = false;
    };
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!hasAccessibleModule) {
      if (selectedModule) setSelectedModule('');
      return;
    }

    if (!accessibleModuleOptions.some((option) => option.value === selectedModule)) {
      setSelectedModule(accessibleModuleOptions[0]?.value || '');
    }
  }, [accessibleModuleOptions, hasAccessibleModule, selectedModule]);

  useEffect(() => {
    if (status && !statusOptions.some((option) => option.value === status)) {
      setStatus('');
    }
  }, [status, statusOptions]);

  useEffect(() => {
    let mounted = true;
    const effectiveSupplierId = shouldUseSupplierFilter ? supplierId : '';
    const effectiveRackId = shouldUseRackFilter ? rackId : '';

    (async () => {
      if (!selectedModule) {
        if (mounted) {
          setRows([]);
          setTotalCount(0);
          setError(hasAccessibleModule ? null : 'No report modules available for your role access');
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }

      try {
        const res = await getReports({
          modules: selectedModule,
          dateFrom,
          dateTo,
          status,
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
        const items = getReportItems(payload);

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
    hasAccessibleModule,
    dateFrom,
    dateTo,
    status,
    supplierId,
    shouldUseSupplierFilter,
    rackId,
    shouldUseRackFilter,
  ]);

  const columns = useMemo(() => {
    const moduleKey = String(selectedModule || 'all').toLowerCase();
    return getReportColumns({
      moduleKey,
      asText,
      formatDate,
      formatDateTime,
      formatCurrency,
      StatusBadge,
      styles,
    });
  }, [selectedModule]);

  const stats = useMemo(() => {
    const modules = new Set(rows.map((item) => item.module)).size;
    const totalAmount = rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const normalizedStatus = String(status || '').toLowerCase();
    const statusLabel = normalizedStatus || 'all statuses';
    const statusCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      if (!normalizedStatus) return true;
      return statusText.includes(normalizedStatus);
    }).length;
    const statusAmount = rows.reduce((sum, item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      if (!normalizedStatus) return sum + (Number(item.amount) || 0);
      return statusText.includes(normalizedStatus) ? sum + (Number(item.amount) || 0) : sum;
    }, 0);
    const draftCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      return statusText.includes('draft');
    }).length;
    const pendingCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      return statusText.includes('pending');
    }).length;
    const unpaidCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      return statusText.includes('unpaid');
    }).length;
    const attentionCount = rows.filter((item) => {
      const statusText = `${item.status} ${item.detailStatuses.join(' ')}`.toLowerCase();
      return statusText.includes('pending') || statusText.includes('draft') || statusText.includes('unpaid');
    }).length;

    return [
      {
        key: 'total',
        label: 'Total Records',
        number: totalCount,
        change: `${statusCount} ${statusLabel}`,
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
        change: `${formatCurrency(statusAmount)} ${statusLabel}`,
        isPositive: true,
      },
      {
        key: 'pending',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${draftCount} draft, ${pendingCount} pending, ${unpaidCount} unpaid`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [rows, totalCount, status]);

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

  const selectedModuleLabel = useMemo(
    () => accessibleModuleOptions.find((option) => option.value === selectedModule)?.label || 'All',
    [accessibleModuleOptions, selectedModule]
  );

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
          options={accessibleModuleOptions}
          placeholder='Select module'
          className={styles.moduleSelect}
        />
      </div>

      <div className={styles.dateFilterWrap}>
        <label htmlFor='reports-status-filter' className={styles.moduleLabel}>
          Status
        </label>
        <Select
          id='reports-status-filter'
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={statusOptions}
          placeholder='All Status'
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
