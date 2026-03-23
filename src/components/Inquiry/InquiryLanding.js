'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiEdit2, FiEye, FiXCircle } from 'react-icons/fi';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import StatsCard from '../ui/StatsCard/StatsCard';
import { getInquiries, updateInquiry } from '../../services/Inquiry';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Company', key: 'companyName' },
  { header: 'Contact Person', key: 'contactPerson' },
  { header: 'Contact Number', key: 'contactNumber' },
  { header: 'Email', key: 'email' },
  { header: 'Attention', key: 'attention' },
  { header: 'Reference', key: 'reference' },
  { header: 'Date', key: 'date', render: (item) => (item.date ? new Date(item.date).toLocaleString() : '') },
  { header: 'Updated At', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function InquiryLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getInquiries();
      if (!mounted) return;
      if (!res.error) setInquiries(res.data || []);
      setLoading(false);
    })();
    return () => (mounted = false);
  }, []);

  const handleStatusChange = useCallback((id, approvalStatus) => {
    setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, approvalStatus } : item)));
  }, []);

  const closeConfirm = useCallback(() => setConfirmAction(null), []);

  const confirmStatusChange = useCallback(() => {
    if (!confirmAction) return;
    (async () => {
      try {
        const res = await updateInquiry(confirmAction.id, { approvalStatus: confirmAction.approvalStatus });
        if (res?.error) toast.error('Failed to update inquiry status');
        else toast.success('Inquiry status updated');
      } catch (err) {
        toast.error('Failed to update inquiry status');
      }
      handleStatusChange(confirmAction.id, confirmAction.approvalStatus);
      if (confirmAction.approvalStatus === 'Approved') router.push(`/projects/proposal/proposalform?inquiryId=${confirmAction.id}`);
      closeConfirm();
    })();
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
    const companies = new Set(inquiries.map((i) => i.companyName).filter(Boolean)).size;
    const withEmail = inquiries.filter((i) => i.email).length;
    const withContact = inquiries.filter((i) => i.contactNumber).length;
    return [
      { key: 'total', label: 'Total Inquiries', number: total, change: `${total} records`, isPositive: true },
      { key: 'companies', label: 'Companies', number: companies, change: `${companies} unique`, isPositive: true },
      { key: 'email', label: 'With Email', number: withEmail, change: `${withEmail}/${total || 0}`, isPositive: true },
      { key: 'contact', label: 'With Contact', number: withContact, change: `${withContact}/${total || 0}`, isPositive: true },
    ];
  }, [inquiries]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.code,
      item.name,
      item.companyName,
      item.contactPerson,
      item.contactNumber,
      item.email,
      item.attention,
      item.preparedBy,
      item.notedBy,
      item.reference,
      item.details,
    ]
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
