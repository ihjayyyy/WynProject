'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText, FiSend } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Landing from '../ui/Landing/Landing';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { getMaterialTransfers, transferMaterialTransfer, printMaterialTransfer_byId } from '@/services/MaterialTransfer';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import Input from '../ui/Input/Input';

const baseColumns = [
  { header: 'Transfer Number', key: 'transferNumber' },
  {
    header: 'Date',
    key: 'date',
    render: (item) =>
      item.date
        ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
        : '—',
  },
  { header: 'From Type', key: 'transferFromType' },
  { header: 'From', key: 'transferFromName' },
  { header: 'To Type', key: 'transferToType' },
  { header: 'To', key: 'transferToName' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
];

export default function MaterialTransferLanding() {
  const PageName = 'Inventory.MaterialTransfer';
  const { isAllowed } = useContext(AccessContext);
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferRows, setTransferRows] = useState([]);
  const [transferSaving, setTransferSaving] = useState(false);

  const loadTransfers = React.useCallback(async () => {
    setLoading(true);
    const res = await getMaterialTransfers();
    if (res?.error) {
      setTransfers([]);
    } else {
      const data = res.data;
      if (Array.isArray(data)) setTransfers(data);
      else if (data && Array.isArray(data.value)) setTransfers(data.value);
      else setTransfers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadTransfers();
    })();
    return () => (mounted = false);
  }, [loadTransfers]);

  const openTransferModal = (item) => {
    setTransferTarget(item);
    const rows = (item.children || []).map((child) => ({
      transferDetailId: child.id, // auto-filled from child id
      materialName: child.name,
      code: child.code,
      quantity: child.quantity,
      uom: child.uom,
      remarks: child.remarks || '',
    }));
    setTransferRows(rows);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTransferTarget(null);
    setTransferRows([]);
  };

  const handleRowRemarksChange = (index, value) => {
    setTransferRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, remarks: value } : row))
    );
  };

  const applyTransfer = async () => {
    if (transferSaving) return;
    if (!transferTarget?.id) {
      toast.error('No transfer selected.');
      return;
    }
    if (transferRows.length === 0) {
      toast.error('No items to transfer.');
      return;
    }

    try {
      setTransferSaving(true);
      const payload = {
        details: transferRows.map(({ transferDetailId, remarks }) => ({
          transferDetailId,
          remarks,
        })),
      };
      const res = await transferMaterialTransfer(transferTarget.id, payload);
      if (res?.error) throw new Error(res.error);
      toast.success('Transfer marked as transferred.');
      closeTransferModal();
      await loadTransfers();
    } catch (error) {
      toast.error('Failed to transfer.');
    } finally {
      setTransferSaving(false);
    }
  };

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/inventory/materialtransfer/form?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(`/inventory/materialtransfer/form?id=${item.id}&mode=edit`),
      },
    ],
    [router]
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        sortable: false,
        render: (item) => {
          const status = String(item?.status || '').toLowerCase();
          const isDraft = status === 'draft';
          const isTransferred = status === 'transferred';
          const itemsFor = (actionItems || []).map((it) => ({ ...it }));

          if (isDraft && isAllowed(PageName, 'w')) {
            itemsFor.push({
              key: 'transfer',
              label: 'Transfer',
              icon: <FiSend size={14} />,
              onClick: openTransferModal,
            });
          }

          if (isTransferred && isAllowed(PageName, 'r')) {
            var lbl = (item.transferFromType === 'Warehouse' && item.transferToType === 'Project') ? "Print MRT" :
                      (item.transferFromType === 'Project' && item.transferToType === 'Warehouse') ? "Print RIV" :
                      "Print Document"; 
            itemsFor.push(
              { key: 'viewpdf', label: lbl, icon: <FiFileText size={14} />, onClick: () => printMaterialTransfer_byId(item.id) }
            );
          }

          return <DropdownAction item={item} items={itemsFor} />;
        },
      },
    ],
    [actionItems, isAllowed]
  );

  const stats = useMemo(() => {
    const list = Array.isArray(transfers) ? transfers : [];
    const total = list.length;
    const transferredCount = list.filter((d) => String(d?.status || '').toLowerCase() === 'transferred').length;
    const warehouseToProject = list.filter(
      (d) => d.transferFromType === 'Warehouse' && d.transferToType === 'Project'
    ).length;
    const projectToWarehouse = list.filter(
      (d) => d.transferFromType === 'Project' && d.transferToType === 'Warehouse'
    ).length;
    const draftCount = list.filter((d) => String(d?.status || '').toLowerCase() === 'draft').length;
    const attentionCount = draftCount;

    return [
      { key: 'total', label: 'Total Transfers', number: total, change: `${transferredCount} transferred`, isPositive: true },
      { key: 'w2p', label: 'Warehouse → Project', number: warehouseToProject, change: `${warehouseToProject} transfers`, isPositive: true },
      { key: 'p2w', label: 'Project → Warehouse', number: projectToWarehouse, change: `${projectToWarehouse} transfers`, isPositive: true },
      { key: 'attention', label: 'Needs Attention', number: attentionCount, change: `${draftCount} draft`, isPositive: attentionCount === 0 },
    ];
  }, [transfers]);

  const filterFn = (item, keyword) =>
    [item.id, item.name, item.code, item.transferFromType, item.transferToType,
      item.transferFromName, item.transferToName, item.status, item.receivedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

  if (!isAllowed(PageName, 'r')) return <InvalidPage />;

  return (
    <>
      <Landing
        title="Material Transfers"
        data={transfers}
        columns={columns}
        stats={stats}
        searchPlaceholder="Search transfers"
        newButtonLabel="New Transfer"
        onNew={() => router.push('/inventory/materialtransfer/form')}
        emptyMessage="No material transfers found"
        width="320px"
        filterFn={filterFn}
        loading={loading}
      />

      <ConfirmModal
        open={isTransferModalOpen}
        title="Transfer materials?"
        message={`Mark transfer "${transferTarget?.transferNumber || transferTarget?.name || transferTarget?.code || ''}" as transferred? Review remarks for each item below.`}
        confirmText={transferSaving ? 'Transferring...' : 'Confirm Transfer'}
        confirmVariant="primary"
        onConfirm={applyTransfer}
        onCancel={closeTransferModal}
      >
        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Material</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Qty</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {transferRows.map((row, index) => (
                <tr key={row.transferDetailId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500 }}>{row.materialName}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{row.code}</div>
                  </td>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    {row.quantity} {row.uom}
                  </td>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    <Input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => handleRowRemarksChange(index, e.target.value)}
                      placeholder="Add remarks"
                      disabled={transferSaving}
                    />
                  </td>
                </tr>
              ))}
              {transferRows.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>
                    No items to transfer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ConfirmModal>
    </>
  );
}