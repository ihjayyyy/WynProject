import React from 'react';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getProposals } from '../../services/Proposal';
import { getProjects } from '../../services/Project';

export const DASHBOARD_PREVIEW_LIMIT = 5;

const toTime = (value) => {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

const sortByRecent = (items = []) => {
  return [...items].sort(
    (a, b) => toTime(b?.updatedAt || b?.createdAt) - toTime(a?.updatedAt || a?.createdAt)
  );
};

const formatCurrency = (amount = 0) => {
  const value = Number(amount) || 0;
  return `PHP ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const proposalColumns = [
  { header: 'Proposal No', key: 'proposalNo' },
  { header: 'Name', key: 'name' },
  { header: 'Customer', key: 'customerName' },
  {
    header: 'Status',
    key: 'proposalStatus',
    render: (item) => <StatusBadge status={item.proposalStatus} />,
  },
];

const projectColumns = [
  { header: 'Project No', key: 'projectNo' },
  { header: 'Name', key: 'name' },
  { header: 'Company', key: 'companyName' },
  {
    header: 'Progress',
    key: 'overallProgress',
    align: 'right',
    render: (item) => `${(Number(item.overallProgress) || 0).toFixed(2)}%`,
  },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status || item.projectStatus || item.state} />,
  },
];

export const DASHBOARD_MODULES = [
  // HOW TO ADD A NEW MODULE:
  // 1) Copy one module object below.
  // 2) Set a unique `key` and section `title`.
  // 3) Set `redirectPath` and `redirectLabel` for the landing page button.
  // 4) Define `columns` using DataTable column format.
  // 5) Set `fetcher` to the service function that returns { data, error }.
  // 6) Implement `buildStats(items)` and return StatsCard objects:
  //    { number, label, change, isPositive }.
  // 7) Optional: set `emptyMessage` for no-record state.
  // The dashboard page renders modules in this array order.
  {
    key: 'proposals',
    accessCode: 'Projects.Proposal',
    title: 'Proposals',
    redirectPath: '/projects/proposal',
    redirectLabel: 'View All Proposals',
    emptyMessage: 'No proposals found',
    columns: proposalColumns,
    fetcher: getProposals,
    buildStats: (items = []) => {
      const totalProposalAmount = items.reduce(
        (sum, item) => sum + (Number(item?.proposalTotal) || 0),
        0
      );
      const wonCount = items.filter((item) => {
        const status = String(item?.proposalStatus || '').toLowerCase();
        return status === 'won' || status === 'win';
      }).length;

      return [
        {
          number: items.length,
          label: 'Total Proposals',
          change: `${items.length} records`,
          isPositive: true,
        },
        {
          number: formatCurrency(totalProposalAmount),
          label: 'Proposal Value',
          change: 'Total amount',
          isPositive: true,
        },
        {
          number: wonCount,
          label: 'Won Proposals',
          change: `${wonCount} won`,
          isPositive: true,
        },
      ];
    },
  },
  {
    key: 'projects',
    accessCode: 'Projects.Projects',
    title: 'Projects',
    redirectPath: '/projects/project',
    redirectLabel: 'View All Projects',
    emptyMessage: 'No projects found',
    columns: projectColumns,
    fetcher: getProjects,
    buildStats: (items = []) => {
      const totalProjectContract = items.reduce(
        (sum, item) => sum + (Number(item?.contractPrice) || 0),
        0
      );
      const inProgress = items.filter((item) => {
        const status = String(item?.status || item?.projectStatus || item?.state || '').toLowerCase();
        return status === 'in progress' || status === 'ongoing' || status === 'started';
      }).length;

      return [
        {
          number: items.length,
          label: 'Total Projects',
          change: `${items.length} records`,
          isPositive: true,
        },
        {
          number: formatCurrency(totalProjectContract),
          label: 'Project Contract Value',
          change: 'Total contract',
          isPositive: true,
        },
        {
          number: inProgress,
          label: 'In Progress',
          change: `${inProgress} ongoing`,
          isPositive: true,
        },
      ];
    },
  },
];

export const getDashboardPreviewItems = (items = [], limit = DASHBOARD_PREVIEW_LIMIT) => {
  return sortByRecent(items).slice(0, limit);
};
