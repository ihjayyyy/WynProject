'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEye, FiEdit2 } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { sampleProposals } from './proposalData';

const baseColumns = [
  { header: 'Date', key: 'createdDate' },
  { header: 'Proposal Number', key: 'proposalNumber' },
  { header: 'Customer Name', key: 'customerName' },
  { header: 'Proposal Total', key: 'proposalTotal' },
  { header: 'Status', key: 'status' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function ProposalLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proposals] = useState(sampleProposals);
  const router = useRouter();

  const columns = useMemo(() => {
    const cols = baseColumns.map((col) => (col.key === 'status' ? { ...col, render: (item) => <StatusBadge status={item.status} /> } : col));
    cols.push({ header: 'Action', key: 'action', align: 'right', render: (item) => {
      const items = [ { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: () => router.push(`/projects/proposal/proposalform?id=${item.id}`) } ];
      const statusRaw = String(item.status || '').toLowerCase();
      const normalized = statusRaw.replace(/\s+/g, '');
      const locked = normalized === 'approved' || normalized === 'forapproval';
      if (!locked) items.push({ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: () => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=edit`) });
      return <DropdownAction item={item} items={items} />;
    } });
    return cols;
  }, [router]);

  const proposalStats = useMemo(() => {
    const statuses = ['Draft', 'Approved', 'forApproval'];
    return statuses.map((s) => {
      const count = proposals.filter((p) => (p.status || '').toString().toLowerCase() === s.toLowerCase()).length;
      return { key: s.toLowerCase(), label: s === 'forApproval' ? 'For Approval' : s, number: count, change: `${count} proposals`, isPositive: true };
    });
  }, [proposals]);

  const filterFn = (item, keyword) => {
    return [
      item.inquiryId,
      item.proposalNumber,
      item.proposalTotal,
      item.location,
      item.projectName,
      item.id,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.name,
      item.customerName,
      item.contactNumber,
      item.address,
      item.companyName,
      item.email,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Proposal"
      data={proposals}
      columns={columns}
      stats={proposalStats}
      searchPlaceholder="Search proposal"
      newButtonLabel="New Proposal"
      onNew={() => router.push('/projects/proposal/proposalform')}
      emptyMessage="No proposals found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
