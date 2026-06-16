import StatusBadge from '../ui/StatusBadge/StatusBadge';
import styles from './Dashboard.module.scss';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso) {
  if (!iso || iso.startsWith('0001')) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

const EXCLUDED_AUTO_KEYS = new Set([
  'id', 'isDeleted', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'children', 'deletedChildren', 'description', 'attachmentUrl',
  'miscellaneousDescription', 'scopeOfWorkDescription', 'warrantyDescription',
  'modeOfPaymentDescription', 'workDurationDescription',
]);

const DATE_KEY_PATTERN = /(date|at)$/i;
const CURRENCY_KEY_PATTERN = /(total|amount|cost|price|margin)$/i;
const STATUS_KEY_PATTERN = /status$/i;

function humanizeKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function autoGenerateColumns(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  const sample = data[0];

  return Object.keys(sample)
    .filter((key) => !EXCLUDED_AUTO_KEYS.has(key))
    .map((key) => {
      const header = humanizeKey(key);

      if (STATUS_KEY_PATTERN.test(key)) {
        return {
          key,
          header,
          render: (item) => <StatusBadge status={item[key]} />,
        };
      }

      if (CURRENCY_KEY_PATTERN.test(key)) {
        return {
          key,
          header,
          render: (item) => formatCurrency(item[key] ?? 0),
        };
      }

      if (DATE_KEY_PATTERN.test(key)) {
        return {
          key,
          header,
          render: (item) => formatDate(item[key]),
        };
      }

      return { key, header };
    });
}

const COLUMN_REGISTRY = {
  // ── Proposal ────────────────────────────────────────────────────
  'Projects.Proposal': [
    {
      key: 'proposalNo',
      header: 'Proposal No.',
      render: (item) => (
        <span className={styles.proposalNo}>{item.proposalNo}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
    },
    {
      key: 'proposalStatus',
      header: 'Status',
      render: (item) => <StatusBadge status={item.proposalStatus} />,
    },
    {
      key: 'expirationDate',
      header: 'Expires',
      render: (item) => formatDate(item.expirationDate),
    },
  ],

  // ── Projects ────────────────────────────────────────────────────
  'Projects.Projects': [
    {
      key: 'projectNo',
      header: 'Project No.',
      render: (item) => (
        <span className={styles.proposalNo}>{item.projectNo}</span>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (item) => item.projectName || '—',
    },
    { key: 'companyName', header: 'Company' },
    {
      key: 'contractPrice',
      header: 'Contract Price',
      render: (item) => formatCurrency(item.contractPrice ?? 0),
    },
    {
      key: 'overallProgress',
      header: 'Progress',
      render: (item) => formatPercent(item.overallProgress ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ],

  // ── Inventory — Material Transfer ───────────────────────────────
  'Inventory.MaterialTransfer': [
    {
      key: 'projectNo',
      header: 'Project No.',
      render: (item) => (
        <span className={styles.proposalNo}>{item.projectNo}</span>
      ),
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (item) => item.projectName || '—',
    },
    {
      key: 'companyName',
      header: 'Company',
    },
    {
      key: 'contractPrice',
      header: 'Contract Price',
      render: (item) => formatCurrency(item.contractPrice ?? 0),
    },
    {
      key: 'overallProgress',
      header: 'Progress',
      render: (item) => formatPercent(item.overallProgress ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ],
};

export function getColumnsForModule(moduleName, data = []) {
  // exact match first
  if (COLUMN_REGISTRY[moduleName]) return COLUMN_REGISTRY[moduleName];

  // prefix match — e.g. "Projects.Test" falls back to "Projects"
  const prefix = Object.keys(COLUMN_REGISTRY).find((key) =>
    moduleName.startsWith(key)
  );
  if (prefix) return COLUMN_REGISTRY[prefix];

  // auto-generate from data shape as last resort
  return autoGenerateColumns(data);
}

export default COLUMN_REGISTRY;