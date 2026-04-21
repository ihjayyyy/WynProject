'use client';

import React, { useMemo, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getProjects } from '../../services/Project';
import { useToast } from '../ui/Toast/Toast';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Company', key: 'companyName' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Contract Price', key: 'contractPrice', render: (item) => item.contractPrice ? Number(item.contractPrice).toLocaleString() : '' },
  { header: 'Start', key: 'startDate', render: (item) => (item.startDate ? new Date(item.startDate).toLocaleDateString() : '') },
  { header: 'End', key: 'endDate', render: (item) => (item.endDate ? new Date(item.endDate).toLocaleDateString() : '') },
  { header: 'Progress', key: 'overallProgress', render: (item) => `${item.overallProgress ?? 0}%` },
  { header: 'UpdatedAt', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function ProjectLanding() {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  const actionItems = useMemo(() => [
    ...(isAllowed(PageName, 'r') ? [{ key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/projects/project/projectdetails?id=${item.id}`) }] : []),
    ...(isAllowed(PageName, 'w') ? [{ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/projects/project/projectdetails?id=${item.id}&mode=edit`) }] : []),
  ], [isAllowed, router]);

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

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => {
    const isDraft = false;
    const itemsFor = (actionItems || []).map((it) => ({ ...it, hidden: it.key === 'edit' ? !isDraft : it.hidden }));
    return <DropdownAction item={item} items={itemsFor} />;
  } }], [actionItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const totalValue = items.reduce((s, it) => s + (Number(it.contractPrice) || 0), 0);
    const inProgress = items.filter((it) => (Number(it.overallProgress) || 0) < 100).length;
    return [
      { key: 'Total', label: 'Total Projects', number: total, change: `${total} records`, isPositive: true },
      { key: 'value', label: 'Total Contract', number: totalValue, change: `PHP ${totalValue.toFixed(2)}`, isPositive: true },
      { key: 'progress', label: 'In Progress', number: inProgress, change: `${inProgress} ongoing`, isPositive: false },
    ];
  }, [items]);

  const filterFn = (item, keyword) => {
    return [item.id, item.code, item.name, item.companyName, item.contactNumber, item.address, item.reference, item.updatedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

  return isAllowed(PageName, 'r') ? (
    <Landing
      title="Projects"
      data={items}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search projects"
      emptyMessage="No projects found"
      width="320px"
      filterFn={filterFn}
      loading={loading}
    />
  ) : <InvalidPage />;
}
