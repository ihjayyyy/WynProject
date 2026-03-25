'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { getProposals } from '../../services/Proposal';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Total', key: 'proposalTotal' },
  { header: 'Status', key: 'proposalStatus' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedAt', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function ProposalLanding() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const totalValue = items.reduce((s, it) => s + (Number(it.proposalTotal) || 0), 0);
    const pending = items.filter((it) => it.proposalStatus === 'Pending').length;
    return [
      { key: 'total', label: 'Total Proposals', number: total, change: `${total} records`, isPositive: true },
      { key: 'value', label: 'Total Value', number: totalValue, change: `PHP ${totalValue.toFixed(2)}`, isPositive: true },
      { key: 'pending', label: 'Pending', number: pending, change: `${pending} pending`, isPositive: false },
    ];
  }, [items]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getProposals();
      if (!mounted) return;
      if (res.error) {
        setItems([]);
      } else {
        setItems(res.data || []);
      }
      setLoading(false);
    })();
    return () => (mounted = false);
  }, []);

  const filterFn = (item, keyword) => {
    return [item.id, item.code, item.name, item.customerName, item.contactNumber, item.address, item.customerReferenceNumber, item.updatedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Proposals"
      data={items}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search proposals"
      newButtonLabel="New Proposal"
      onNew={() => router.push('/projects/proposal/proposalform')}
      emptyMessage="No proposals found"
      width="320px"
      filterFn={filterFn}
      loading={loading}
    />
  );
}
