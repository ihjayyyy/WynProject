'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Select from '../ui/Select/Select';
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
  item?.deliveryNumber ||
  '-';

const getPartyName = (item) =>
  item?.customerName || item?.companyName || item?.supplierName || item?.projectName || '-';

const getPrimaryDate = (item) =>
  item?.requestDate ||
  item?.forecastedStartDate ||
  item?.startDate ||
  item?.billingDate ||
  item?.date ||
  item?.orderDate ||
  item?.invoiceDate ||
  item?.deliveryDate ||
  null;

const getAmount = (item) => {
  const options = [item?.proposalTotal, item?.contractPrice, item?.amount, item?.totalAmountPaid];
  const found = options.find((value) => value !== null && value !== undefined);
  return Number(found) || 0;
};

const formatDate = (value) => {
  if (!value || value === EMPTY_DATE) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

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
  { label: 'All', value: 'all' },
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
  const [selectedModule, setSelectedModule] = useState('all');
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

  const columns = useMemo(
    () => [
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
      {
        header: 'Status',
        key: 'status',
        render: (item) => <StatusBadge status={item.status} />,
      },
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
    ],
    []
  );

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
      belowStatsAddon={reportFilters}
    />
  );
}
