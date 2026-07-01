'use client';

import React, { useCallback, useMemo, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText, FiPlay, FiCheckSquare, FiXCircle, FiArchive } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing, { applyLandingFilters } from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getProjects, printCompletion_byId, startProject, completeProject, cancelProject, closeProject } from '../../services/Project';
import { useToast } from '../ui/Toast/Toast';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  { header: 'Project No', key: 'projectNo' },
  { header: 'Name', key: 'name' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status || item.projectStatus || item.state} /> },
  { header: 'Company', key: 'companyName' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Contract Price', key: 'contractPrice', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.contractPrice ? Number(item.contractPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Start', key: 'startDate', render: (item) => (item.startDate ? new Date(item.startDate).toLocaleDateString() : '') },
  { header: 'End', key: 'endDate', render: (item) => (item.endDate ? new Date(item.endDate).toLocaleDateString() : '') },
  { header: 'Progress', key: 'overallProgress', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {`${(Number(item.overallProgress) || 0).toFixed(2)}%`}
    </div>
  ) },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function ProjectLanding() {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  // Confirm modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const [filterValues, setFilterValues] = useState({
    status: '',
    companyName: '',
  });

  const loadProjects = React.useCallback(async () => {
    setLoading(true);
    const res = await getProjects();
    if (res.error) {
      setItems([]);
      toast.error('Failed to load projects');
    } else {
      setItems(res.data || []);
    }
    setLoading(false);
  }, [toast]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadProjects();
    })();
    return () => (mounted = false);
  }, [loadProjects]);

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        sortable: false,
        render: (item) => {
          const status = (item.status || '').toString().toUpperCase().replace(/\s+/g, '');
          const toFinite = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
          const prog = toFinite(item.overallProgress) ?? toFinite(item.progress) ?? 0;

          const isNotStarted = status === 'NOTSTARTED';
          const isComplete = prog >= 100;
          const isCompleted = status === 'COMPLETED';
          const isCancelled = status === 'CANCELLED';

          const rowActions = [
            ...(isAllowed(PageName, 'r')
              ? [{ key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: () => router.push(`/projects/project/projectdetails?id=${item.id}`) }]
              : []),
            // ...(isAllowed(PageName, 'w')
            //   ? [{ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: () => router.push(`/projects/project/projectdetails?id=${item.id}&mode=edit`) }]
            //   : []),
            ...(isAllowed(PageName, 'r') && !isNotStarted
              ? [{
                  key: 'viewpdf',
                  label: 'Print Accomplishment Report',
                  icon: <FiFileText size={14} />,
                  onClick: () => printCompletion_byId(item.id)
                }]
              : []),

            // Start Project — only shown when status is NotStarted
            ...(isAllowed(PageName, 'w') && isNotStarted
              ? [{
                  key: 'start',
                  label: 'Start Project',
                  icon: <FiPlay size={14} />,
                  onClick: () => {
                    setConfirmTarget(item);
                    setConfirmTitle('Start Project?');
                    setConfirmMessage(`Start project "${item.name || item.code || ''}"?`);
                    setConfirmAction(() => async (target) => {
                      setLoading(true);
                      const res = await startProject(target.id);
                      if (res?.error) toast.error('Failed to start project');
                      else { toast.success('Project started'); await loadProjects(); }
                      setLoading(false);
                    });
                    setIsConfirmOpen(true);
                  },
                }]
              : []),

            // Complete Project — only shown when overallProgress is 100
            ...(isAllowed(PageName, 'w') && isComplete
              ? [{
                  key: 'complete',
                  label: 'Complete Project',
                  icon: <FiCheckSquare size={14} />,
                  onClick: () => {
                    setConfirmTarget(item);
                    setConfirmTitle('Complete Project?');
                    setConfirmMessage(`Mark project "${item.name || item.code || ''}" as complete?`);
                    setConfirmAction(() => async (target) => {
                      setLoading(true);
                      const res = await completeProject(target.id);
                      if (res?.error) toast.error('Failed to complete project');
                      else { toast.success('Project marked complete'); await loadProjects(); }
                      setLoading(false);
                    });
                    setIsConfirmOpen(true);
                  },
                }]
              : []),

            // Cancel Project — hidden when already Cancelled
            ...(isAllowed(PageName, 'w') && !isCancelled
              ? [{
                  key: 'cancel',
                  label: 'Cancel Project',
                  icon: <FiXCircle size={14} />,
                  onClick: () => {
                    setConfirmTarget(item);
                    setConfirmTitle('Cancel Project?');
                    setConfirmMessage(`Cancel project "${item.name || item.code || ''}"?`);
                    setConfirmAction(() => async (target) => {
                      setLoading(true);
                      const res = await cancelProject(target.id);
                      if (res?.error) toast.error('Failed to cancel project');
                      else { toast.success('Project cancelled'); await loadProjects(); }
                      setLoading(false);
                    });
                    setIsConfirmOpen(true);
                  },
                }]
              : []),

            // Close Project — shown when status is Completed or Cancelled
            ...(isAllowed(PageName, 'w') && (isCompleted || isCancelled)
              ? [{
                  key: 'close',
                  label: 'Close Project',
                  icon: <FiArchive size={14} />,
                  onClick: () => {
                    setConfirmTarget(item);
                    setConfirmTitle('Close Project?');
                    setConfirmMessage(`Close project "${item.name || item.code || ''}"?`);
                    setConfirmAction(() => async (target) => {
                      setLoading(true);
                      const res = await closeProject(target.id);
                      if (res?.error) toast.error('Failed to close project');
                      else { toast.success('Project closed'); await loadProjects(); }
                      setLoading(false);
                    });
                    setIsConfirmOpen(true);
                  },
                }]
              : []),
          ];

          return <DropdownAction item={item} items={rowActions} />;
        },
      },
    ],
    [isAllowed, router, loadProjects, toast]
  );

  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(items.map((item) => String(item?.status || item?.projectStatus || item?.state || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [{ label: 'All Status', value: '' }, ...uniqueStatuses.map((status) => ({ label: status, value: status }))];
  }, [items]);

  const companyOptions = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set(items.map((item) => String(item?.companyName || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [{ label: 'All Companies', value: '' }, ...uniqueCompanies.map((company) => ({ label: company, value: company }))];
  }, [items]);

  const landingFilters = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions,
        placeholder: 'All Status',
        accessor: (item) => item?.status || item?.projectStatus || item?.state,
        match: 'equals',
      },
      {
        key: 'companyName',
        label: 'Company',
        type: 'select',
        options: companyOptions,
        placeholder: 'All Companies',
        accessor: (item) => item?.companyName,
        match: 'equals',
      },
    ],
    [statusOptions, companyOptions]
  );

  const filteredItems = useMemo(
    () => applyLandingFilters(items, landingFilters, filterValues),
    [items, landingFilters, filterValues]
  );

  const stats = useMemo(() => {
    const total = filteredItems.length;
    const completedCount = filteredItems.filter((it) => {
      const status = String(it?.status || it?.projectStatus || it?.state || '').toUpperCase().replace(/\s+/g, '');
      return status === 'COMPLETED';
    }).length;
    const totalValue = filteredItems.reduce((s, it) => s + (Number(it.contractPrice) || 0), 0);
    const inProgress = filteredItems.filter((it) => (Number(it.overallProgress) || 0) < 100).length;
    const notStartedCount = filteredItems.filter((it) => {
      const status = String(it?.status || it?.projectStatus || it?.state || '').toUpperCase().replace(/\s+/g, '');
      const isNotStarted = status === 'NOTSTARTED';
      return isNotStarted;
    }).length;
    const readyToCompleteCount = filteredItems.filter((it) => {
      const status = String(it?.status || it?.projectStatus || it?.state || '').toUpperCase().replace(/\s+/g, '');
      const progress = Number(it?.overallProgress ?? it?.progress) || 0;
      const readyToComplete = progress >= 100 && status !== 'COMPLETED' && status !== 'CLOSED';
      return readyToComplete;
    }).length;
    const attentionCount = filteredItems.filter((it) => {
      const status = String(it?.status || it?.projectStatus || it?.state || '').toUpperCase().replace(/\s+/g, '');
      const progress = Number(it?.overallProgress ?? it?.progress) || 0;
      const isNotStarted = status === 'NOTSTARTED';
      const readyToComplete = progress >= 100 && status !== 'COMPLETED' && status !== 'CLOSED';
      return isNotStarted || readyToComplete;
    }).length;
    return [
      { key: 'Total', label: 'Total Projects', number: total, change: `${completedCount} completed`, isPositive: true },
      { key: 'value', label: 'Total Contract', number: totalValue, change: `PHP ${totalValue.toFixed(2)}`, isPositive: true },
      { key: 'progress', label: 'In Progress', number: inProgress, change: `${inProgress} ongoing`, isPositive: false },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${notStartedCount} not started, ${readyToCompleteCount} ready to complete`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [filteredItems]);

  const hasActiveFilters = Object.values(filterValues).some((value) => String(value || '').trim() !== '');

  const clearFilters = useCallback(() => {
    setFilterValues({ status: '', companyName: '' });
  }, []);

  const filterFn = (item, keyword) => {
    return [item.id, item.projectNo, item.name, item.companyName, item.status]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

  return isAllowed(PageName, 'r') ? (
    <>
      <Landing
        title="Projects"
        data={items}
        columns={columns}
        stats={stats}
        searchPlaceholder="Search projects"
        emptyMessage={hasActiveFilters ? 'No projects found for the selected filters' : 'No projects found'}
        width="320px"
        filterFn={filterFn}
        filters={landingFilters}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        loading={loading}
      />

      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
        onConfirm={async () => {
          setIsConfirmOpen(false);
          if (confirmAction && confirmTarget) {
            await confirmAction(confirmTarget);
          }
        }}
        onCancel={() => {
          setIsConfirmOpen(false);
          setConfirmTarget(null);
          setConfirmAction(null);
        }}
      />
    </>
  ) : (
    <InvalidPage />
  );
}