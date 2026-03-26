'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiSend } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getProposals, submitProposal, approveProposal, rejectProposal, winProposal, loseProposal } from '../../services/Proposal';
import { useToast } from '../ui/Toast/Toast';
import { FiCheck, FiX } from 'react-icons/fi';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Total', key: 'proposalTotal' },
  { header: 'Status', key: 'proposalStatus', render: (item) => <StatusBadge status={item.proposalStatus} /> },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedAt', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function ProposalLanding() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  
  const loadProposals = React.useCallback(async () => {
    setLoading(true);
    const res = await getProposals();
    if (res.error) {
      setItems([]);
    } else {
      setItems(res.data || []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadProposals();
    })();
    return () => (mounted = false);
  }, [loadProposals]);

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => {
      const isDraft = item && String((item.proposalStatus || '').toLowerCase()) === 'draft';
      const itemsFor = (actionItems || []).map((it) => ({
        ...it,
        hidden: it.key === 'edit' ? !isDraft : it.hidden,
      }));
      if (isDraft) {
        itemsFor.push({ key: 'submit', label: 'Submit', icon: <FiSend size={14} />, onClick: async (it) => {
          setLoading(true);
          const res = await submitProposal(it.id);
          if (res?.error) {
            toast.error('Failed to submit proposal');
          } else {
            toast.success('Proposal submitted');
            await loadProposals();
          }
          setLoading(false);
        }});
      }
      const isSubmitted = item && String((item.proposalStatus || '').toLowerCase()) === 'submitted';
      if (isSubmitted) {
        itemsFor.push({ key: 'approve', label: 'Approve', icon: <FiCheck size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Approve proposal?');
          setConfirmMessage(`Approve proposal \"${it.name || it.code || ''}\"?`);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await approveProposal(target.id);
            if (res?.error) toast.error('Failed to approve proposal');
            else { toast.success('Proposal approved'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
        itemsFor.push({ key: 'reject', label: 'Reject', icon: <FiX size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Reject proposal?');
          setConfirmMessage(`Reject proposal \"${it.name || it.code || ''}\"?`);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await rejectProposal(target.id);
            if (res?.error) toast.error('Failed to reject proposal');
            else { toast.success('Proposal rejected'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }
      const isApproved = item && String((item.proposalStatus || '').toLowerCase()) === 'approved';
      const isRejected = item && String((item.proposalStatus || '').toLowerCase()) === 'rejected';

      if (isApproved) {
        itemsFor.push({ key: 'win', label: 'Win', icon: <FiCheck size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Mark proposal as Won?');
          setConfirmMessage(`Mark proposal "${it.name || it.code || ''}" as Won?`);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await winProposal(target.id);
            if (res?.error) toast.error('Failed to mark proposal as won');
            else { toast.success('Proposal marked as won'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }

      if (isApproved || isRejected) {
        itemsFor.push({ key: 'lose', label: 'Lose', icon: <FiX size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Mark proposal as Lost?');
          setConfirmMessage(`Mark proposal "${it.name || it.code || ''}" as Lost?`);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await loseProposal(target.id);
            if (res?.error) toast.error('Failed to mark proposal as lost');
            else { toast.success('Proposal marked as lost'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }
      return <DropdownAction item={item} items={itemsFor} />;
    } }], [actionItems, loadProposals, toast]);

  const stats = useMemo(() => {
    const total = items.length;
    const totalValue = items.reduce((s, it) => s + (Number(it.proposalTotal) || 0), 0);
    const pending = items.filter((it) => it.approvalStatus === 'For Approval').length;
    return [
      { key: 'total', label: 'Total Proposals', number: total, change: `${total} records`, isPositive: true },
      { key: 'value', label: 'Total Value', number: totalValue, change: `PHP ${totalValue.toFixed(2)}`, isPositive: true },
      { key: 'pending', label: 'Pending', number: pending, change: `${pending} pending`, isPositive: false },
    ];
  }, [items]);

  const filterFn = (item, keyword) => {
    return [item.id, item.code, item.name, item.customerName, item.contactNumber, item.address, item.customerReferenceNumber, item.updatedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

return (
  <>
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
      onCancel={() => setIsConfirmOpen(false)}
    />
  </>
);
}
 
