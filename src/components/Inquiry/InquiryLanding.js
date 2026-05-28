'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiEdit2, FiEye, FiFileText, FiXCircle } from 'react-icons/fi';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import StatsCard from '../ui/StatsCard/StatsCard';
import { getInquiries, updateInquiry, acknowledgeInquiry, printInquirySlip_byId } from '../../services/Inquiry';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  { header: 'Date', key: 'date', render: (item) => (item.date ? new Date(item.date).toLocaleString() : '') },
  // { header: 'Reference', key: 'reference' },
  { header: 'Company', key: 'companyName' },
  { header: 'Attention', key: 'attention' },
  { header: 'Contact', key: 'contactPerson', render: (item) => (
    <span>{item.contactPerson}{item.contactPerson && item.contactNumber ? <br /> : null}{item.contactNumber}</span>
  )},
  { header: 'Email', key: 'email' },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />
  }
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
        let res;
        if (confirmAction.action === 'acknowledge') {
          res = await acknowledgeInquiry(confirmAction.id);
          if (res?.error) toast.error('Failed to acknowledge inquiry');
          else {
            toast.success('Inquiry acknowledged');
            const refreshed = await getInquiries();
            if (!refreshed.error) setInquiries(refreshed.data || []);
          }
        } else {
          res = await updateInquiry(confirmAction.id, { approvalStatus: confirmAction.approvalStatus });
          if (res?.error) toast.error('Failed to update inquiry status');
          else toast.success('Inquiry status updated');
          handleStatusChange(confirmAction.id, confirmAction.approvalStatus);
          if (confirmAction.approvalStatus === 'Approved') router.push(`/projects/proposal/proposalform?inquiryId=${confirmAction.id}`);
        }
      } catch (err) {
        toast.error('Failed to update inquiry status');
      }
      closeConfirm();
    })();
  }, [confirmAction, handleStatusChange, closeConfirm, router, toast]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/inquiry/inquiryform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, hidden: (item) => {
        const s = String(item.status).toLowerCase();
        return s === 'acknowledged' || s === 'cancelled' || s === 'closed';
      }, onClick: (item) => router.push(`/inquiry/inquiryform?id=${item.id}&mode=edit`) },
      {
        key: 'acknowledge',
        label: 'Acknowledge',
        icon: <FiCheckCircle size={14} />,
        hidden: (item) => String(item.status).toLowerCase() !== 'created',
        onClick: (item) => setConfirmAction({
          id: item.id,
          action: 'acknowledge',
          title: 'Acknowledge Inquiry',
          message: `Are you sure you want to acknowledge inquiry ${item.id}?`,
          confirmText: 'Acknowledge',
          confirmVariant: 'primary',
        }),
      },
      { 
        key: 'viewpdf',
        label: 'Print Inquiry Slip',
        icon: <FiFileText size={14} />,
        onClick: (item) => (printInquirySlip_byId(item.id))
      },
    ],
    [router]
  );

  const columns = useMemo(() => [
    ...baseColumns,
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (item) => <DropdownAction item={item} items={actionItems.filter(a => !a.hidden || !a.hidden(item))} />
    }
  ], [actionItems]);

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
      item.companyName,
      item.contactPerson,
      item.contactNumber,
      item.email,
      item.attention,
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
