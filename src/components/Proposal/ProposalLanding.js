'use client';

import React, { useMemo, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiCheckCircle, FiEdit2, FiEye, FiFileText, FiSend, FiX, FiXCircle, FiArchive, FiCopy } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getProposals, submitProposal, approveProposal, rejectProposal, winProposal, loseProposal, printProposal_byId as printProposal_byId, cancelProposal, closeProposal, printProposalBreakdown_byId as printProposalBreakdown_byId, printJobOrder_byProposal } from '../../services/Proposal';
import { convertProposal } from '../../services/Project';
import { useToast } from '../ui/Toast/Toast';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  { header: 'Proposal No', key: 'proposalNo' },
  { header: 'Version', key: 'version', render: (item) => (
    <div style={{ textAlign: 'right' }}>{item?.version ?? ''}</div>
  )  },
  { header: 'Name', key: 'name' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Total', key: 'proposalTotal', render: (item) => (
    <div style={{ textAlign: 'right' }}>{item?.proposalTotal ?? ''}</div>
  ) },
  { header: 'Status', key: 'proposalStatus', render: (item) => <StatusBadge status={item.proposalStatus} /> },
  {
    header: 'Project Created',
    key: 'isProjectCreated',
    align: 'center',
    render: (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {item?.isProjectCreated
          ? <FiCheckCircle size={16} color="#16a34a" title="Project created" aria-label="Project created" />
          : <FiXCircle size={16} color="#dc2626" title="Project not created" aria-label="Project not created" />}
      </div>
    ),
  },
  // { header: 'Updated By', key: 'updatedBy' },
  // { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function ProposalLanding() {
  const PageName = 'Projects.Proposal';
  const { isAllowed } = useContext(AccessContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmIncludeCreateProject, setConfirmIncludeCreateProject] = useState(false);
  const [createProjectChecked, setCreateProjectChecked] = useState(false);

  const actionItems = useMemo(
    () => [
      ...(isAllowed(PageName, 'r') ? [{ key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}`) }] : []),
      ...(isAllowed(PageName, 'w') ? [{
        key: 'revise',
        label: 'Revise',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=revise`),
        hidden: (item) => {
          const ps = String(item?.proposalStatus || '').toLowerCase();
          const as = String(item?.approvalStatus || '').toLowerCase();
          // Show revise when Draft, For Approval, Approved, or Won
          return !(ps === 'draft' || as === 'for approval' || ps === 'approved' || ps === 'won' || ps === 'win');
        }
      }] : []),
      ...(isAllowed(PageName, 'w') ? [{
        key: 'copy',
        label: 'Copy',
        icon: <FiCopy size={14} />,
        onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=copy`),
        hidden: (item) => {
          const ps = String(item?.proposalStatus || '').toLowerCase();
          const as = String(item?.approvalStatus || '').toLowerCase();
          return !(ps === 'draft' || as === 'for approval' || ps === 'approved' || ps === 'won' || ps === 'win');
        }
      }] : []),
      ...(isAllowed(PageName, 'r') ? [{ key: 'viewpdf', label: 'Print Document', icon: <FiFileText size={14} />, onClick: (item) => (printProposal_byId(item.id))}] : []),
      ...(isAllowed(PageName, 'r') ? [{ key: 'viewpdfbreakdown', label: 'Print Breakdown', icon: <FiFileText size={14} />, onClick: (item) => (printProposalBreakdown_byId(item.id))}] : []),
      ...(isAllowed(PageName, 'r') ? [{
          key: 'viewpdfjoborder',
          label: 'Print Job Order',
          icon: <FiFileText size={14} />,
          onClick: (item) => (printJobOrder_byProposal(item.id)),
          hidden: (item) => {
            const ps = String(item?.proposalStatus || '').toLowerCase();
            return !(ps === 'won' || ps === 'win');
          }
        }] : []),
      ...(isAllowed(PageName, 'w') ? [{ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/projects/proposal/proposalform?id=${item.id}&mode=edit`), hidden: (item) => { const s = String(item.proposalStatus || '').toLowerCase(); return s !== 'draft'; } }] : []),
    ],
    [isAllowed, router]
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
      const proposalStatus = String(item?.proposalStatus || '').toLowerCase();
      const isDraft = item && String((item.proposalStatus || '').toLowerCase()) === 'draft';
      const itemsFor = (actionItems || []).map((it) => ({
        ...it,
        hidden: it.key === 'edit' ? !isDraft : it.hidden,
      }));

      if (isDraft && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'submit', label: 'Submit', icon: <FiSend size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Submit proposal?');
          setConfirmMessage(`Submit proposal "${it.name || it.code || ''}"?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await submitProposal(target.id);
            if (res?.error) toast.error('Failed to submit proposal');
            else { toast.success('Proposal submitted'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }
      const isSubmitted = proposalStatus === 'submitted';
      if (isSubmitted && isAllowed(PageName, 'a')) {
        itemsFor.push({ key: 'approve', label: 'Approve', icon: <FiCheck size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Approve proposal?');
          setConfirmMessage(`Approve proposal \"${it.name || it.code || ''}\"?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
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
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
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
      const isApproved = proposalStatus === 'approved';
      const isRejected = proposalStatus === 'rejected';
      const isWon = proposalStatus === 'won' || proposalStatus === 'win';
      const shouldShowGenerateProject = isWon && item?.isProjectCreated === false;

      if (isApproved && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'win', label: 'Win', icon: <FiCheck size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Mark proposal as Won?');
          setConfirmMessage(`Mark proposal "${it.name || it.code || ''}" as Won?`);
          setConfirmIncludeCreateProject(true);
          setCreateProjectChecked(false);
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

      if (shouldShowGenerateProject && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'generate-project', label: 'Generate Project', icon: <FiCheck size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Generate Project?');
          setConfirmMessage(`Create a project from proposal "${it.name || it.code || ''}"?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await convertProposal(target.id);
            if (res?.error) toast.error('Failed to create project from proposal');
            else { toast.success('Project created from proposal'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }

      if ((isApproved || isRejected) && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'lose', label: 'Lose', icon: <FiX size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Mark proposal as Lost?');
          setConfirmMessage(`Mark proposal "${it.name || it.code || ''}" as Lost?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
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

      // Cancel Proposal — hidden when already cancelled
      const isCancelled = proposalStatus === 'cancelled';
      if (!isCancelled && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'cancel', label: 'Cancel Proposal', icon: <FiXCircle size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Cancel Proposal?');
          setConfirmMessage(`Are you sure you want to cancel proposal "${it.name || it.code || ''}"?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await cancelProposal(target.id);
            if (res?.error) toast.error('Failed to cancel proposal');
            else { toast.success('Proposal cancelled'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }

      // Close Proposal — shown only when status is cancelled
      if (isCancelled && isAllowed(PageName, 'w')) {
        itemsFor.push({ key: 'close', label: 'Close Proposal', icon: <FiArchive size={14} />, onClick: (it) => {
          setConfirmTarget(it);
          setConfirmTitle('Close Proposal?');
          setConfirmMessage(`Are you sure you want to close proposal "${it.name || it.code || ''}"?`);
          setConfirmIncludeCreateProject(false);
          setCreateProjectChecked(false);
          setConfirmAction(() => async (target) => {
            setLoading(true);
            const res = await closeProposal(target.id);
            if (res?.error) toast.error('Failed to close proposal');
            else { toast.success('Proposal closed'); await loadProposals(); }
            setLoading(false);
          });
          setIsConfirmOpen(true);
        }});
      }

      return <DropdownAction item={item} items={itemsFor} />;
    } }], [actionItems, isAllowed, loadProposals, toast]);

  const stats = useMemo(() => {
    const total = items.length;
    const wonCount = items.filter((it) => {
      const proposalStatus = String(it?.proposalStatus || '').toLowerCase();
      return proposalStatus === 'won' || proposalStatus === 'win';
    }).length;
    const totalValue = items.reduce((s, it) => s + (Number(it.proposalTotal) || 0), 0);
    const draftCount = items.filter((it) => {
      const approvalStatus = String(it?.approvalStatus || '').toLowerCase();
      const proposalStatus = String(it?.proposalStatus || '').toLowerCase();
      const isDraft = proposalStatus === 'draft';
      return isDraft;
    }).length;
    const forApprovalCount = items.filter((it) => {
      const approvalStatus = String(it?.approvalStatus || '').toLowerCase();
      const forApproval = approvalStatus === 'for approval';
      return forApproval;
    }).length;
    const generateProjectCount = items.filter((it) => {
      const proposalStatus = String(it?.proposalStatus || '').toLowerCase();
      const needsProjectGeneration = (proposalStatus === 'won' || proposalStatus === 'win') && it?.isProjectCreated === false;
      return needsProjectGeneration;
    }).length;
    const attentionCount = items.filter((it) => {
      const approvalStatus = String(it?.approvalStatus || '').toLowerCase();
      const proposalStatus = String(it?.proposalStatus || '').toLowerCase();
      const isDraft = proposalStatus === 'draft';
      const forApproval = approvalStatus === 'for approval';
      const needsProjectGeneration = (proposalStatus === 'won' || proposalStatus === 'win') && it?.isProjectCreated === false;
      return isDraft || forApproval || needsProjectGeneration;
    }).length;
    return [
      { key: 'total', label: 'Total Proposals', number: total, change: `${wonCount} won`, isPositive: true },
      { key: 'value', label: 'Total Value', number: totalValue, change: `PHP ${totalValue.toFixed(2)}`, isPositive: true },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${draftCount} draft, ${forApprovalCount} for approval, ${generateProjectCount} generate project`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [items]);

  const filterFn = (item, keyword) => {
    return [item.id, item.proposalNo, item.name, item.customerName, item.customerReferenceNumber]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));
  };

return isAllowed(PageName, 'r') ? (
  <>
    <Landing
      title="Proposals"
      data={items}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search proposals"
      newButtonLabel={isAllowed(PageName, 'w') ? 'New Proposal' : ''}
      onNew={() => isAllowed(PageName, 'w') && router.push('/projects/proposal/proposalform')}
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

          if (confirmIncludeCreateProject && createProjectChecked) {
            const conv = await convertProposal(confirmTarget.id);
            if (conv?.error) toast.error('Failed to create project from proposal');
            else toast.success('Project created from proposal');
          }
        }
        setConfirmIncludeCreateProject(false);
        setCreateProjectChecked(false);
      }}
      onCancel={() => {
        setIsConfirmOpen(false);
        setConfirmIncludeCreateProject(false);
        setCreateProjectChecked(false);
      }}
    >
      {confirmIncludeCreateProject && (
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={createProjectChecked} onChange={(e) => setCreateProjectChecked(e.target.checked)} />
            <span>Create project from this proposal</span>
          </label>
        </div>
      )}
    </ConfirmModal>
  </>
) : <InvalidPage />;
}
 
