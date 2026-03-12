'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiEdit2, FiEye, FiXCircle } from 'react-icons/fi';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import StatsCard from '../ui/StatsCard/StatsCard';
import { sampleInquiries } from './inquiryData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Requested By', key: 'requestedBy' },
  { header: 'Request Date', key: 'requestDate' },
  {
    header: 'Approval Status',
    key: 'approvalStatus',
    render: (item) => <StatusBadge status={item.approvalStatus} />,
  },
  { header: 'Reference', key: 'reference' },
  { header: 'Date', key: 'date' },
      { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function InquiryLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inquiries, setInquiries] = useState(sampleInquiries);
  const [confirmAction, setConfirmAction] = useState(null);
  const router = useRouter();

  const handleStatusChange = useCallback((id, approvalStatus) => {
    setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, approvalStatus } : item)));
  }, []);

  const closeConfirm = useCallback(() => setConfirmAction(null), []);

  const confirmStatusChange = useCallback(() => {
    if (!confirmAction) return;
    handleStatusChange(confirmAction.id, confirmAction.approvalStatus);
    if (confirmAction.approvalStatus === 'Approved') router.push(`/projects/proposal/proposalform?inquiryId=${confirmAction.id}`);
    closeConfirm();
  }, [confirmAction, handleStatusChange, closeConfirm, router]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inquiry/inquiryform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/inquiry/inquiryform?id=${item.id}&mode=edit`) },
      {
        key: 'approve',
        label: 'Approve',
        icon: <FiCheckCircle size={14} />,
        onClick: (item) =>
          setConfirmAction({
            id: item.id,
            approvalStatus: 'Approved',
            title: 'Approve Inquiry',
            message: `Are you sure you want to approve ${item.id}? You will be redirected to the Proposal Form and Inquiry Id will be auto-filled.`,
            confirmText: 'Approve',
            confirmVariant: 'primary',
          }),
      },
      {
        key: 'reject',
        label: 'Reject',
        icon: <FiXCircle size={14} />,
        destructive: true,
        onClick: (item) =>
          setConfirmAction({
            id: item.id,
            approvalStatus: 'Cancelled',
            title: 'Reject Inquiry',
            message: `Are you sure you want to reject ${item.id}?`,
            confirmText: 'Reject',
            confirmVariant: 'danger',
          }),
      },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const inquiryStats = useMemo(() => {
    const total = inquiries.length;
    const approved = inquiries.filter((item) => item.approvalStatus === 'Approved').length;
    const pending = inquiries.filter((item) => item.approvalStatus === 'Pending').length;
    const cancelled = inquiries.filter((item) => item.approvalStatus === 'Cancelled').length;
    return [
      { key: 'total', label: 'Total Inquiries', number: total, change: `${total} records`, isPositive: true },
      { key: 'pending', label: 'Pending', number: pending, change: total ? `${Math.round((pending / total) * 100)}%` : '0%', isPositive: pending === 0 },
      { key: 'approved', label: 'Approved', number: approved, change: total ? `${Math.round((approved / total) * 100)}%` : '0%', isPositive: true },
      { key: 'cancelled', label: 'Cancelled', number: cancelled, change: total ? `${Math.round((cancelled / total) * 100)}%` : '0%', isPositive: false },
    ];
  }, [inquiries]);

  const filterFn = (item, keyword) => {
    return [item.id, item.requestedBy, item.approvalStatus, item.responseBy, item.reference, item.code, item.name, item.details]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <>
      <Landing
        title="Inquiry"
        data={inquiries}
        columns={columns}
        stats={inquiryStats}
        searchPlaceholder="Search inquiry"
        newButtonLabel="New Inquiry"
        onNew={() => router.push('/inquiry/inquiryform')}
        emptyMessage="No inquiries found"
        width="320px"
        filterFn={filterFn}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        confirmVariant={confirmAction?.confirmVariant}
        cancelText="Cancel"
        onConfirm={confirmStatusChange}
        onCancel={closeConfirm}
      />
    </>
  );
}
