'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiSend } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Landing from '../ui/Landing/Landing';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { getReceivedMaterialTransfers, transferMaterialTransfer } from '@/services/MaterialTransfer';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  { header: 'Id', key: 'id' },
  {header: 'Transfer Number', key: 'transferNo'},

  // { header: 'Name', key: 'name' },
  // { header: 'Code', key: 'code' },
    {
    header: 'Date',
    key: 'date',
    render: (item) =>
      item.date
        ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
        : '—',
  },
  { header: 'From', key: 'transferFromName' },
  { header: 'To', key: 'transferToName' },
  { header: 'Quantity', key: 'quantity', render: (item) => {
    const qty = item.children?.reduce((s, c) => s + (Number(c.quantity) || 0), 0) || 0;
    return qty;
  }},
  { header: 'Quantity Received', key: 'quantityReceived', render: (item) => {
    const qty = item.children?.reduce((s, c) => s + (Number(c.receivedQuantity) || 0), 0) || 0;
    return qty;
  }},
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
];

export default function MaterialReceivedLanding() {
  const PageName = 'Inventory.MaterialReceivedLanding';
  const { isAllowed } = useContext(AccessContext);
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadTransfers = React.useCallback(async () => {
    setLoading(true);
    const res = await getReceivedMaterialTransfers();
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

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/inventory/materialreceived/form?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(`/inventory/materialreceived/form?id=${item.id}&mode=edit`),
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
        render: (item) => {
          const status = String(item?.status || '').toLowerCase();
          const isDraft = status === 'draft';
          const itemsFor = (actionItems || []).map((it) => ({ ...it }));

          if (isDraft && isAllowed(PageName, 'w')) {
            itemsFor.push({ key: 'transfer', label: 'Transfer', icon: <FiSend size={14} />, onClick: (it) => {
              setConfirmTarget(it);
              setConfirmTitle('Transfer materials?');
              setConfirmMessage(`Mark transfer "${it.name || it.code || ''}" as transferred?`);
              setConfirmAction(() => async (target) => {
                setLoading(true);
                const res = await transferMaterialTransfer(target.id);
                if (res?.error) toast.error('Failed to transfer');
                else { toast.success('Transfer marked as transferred'); await loadTransfers(); }
                setLoading(false);
              });
              setIsConfirmOpen(true);
            }});
          }

          return <DropdownAction item={item} items={itemsFor} />;
        },
      },
    ],
    [actionItems, isAllowed, loadTransfers, toast]
  );

  const stats = useMemo(() => {
    const list = Array.isArray(transfers) ? transfers : [];
    const total = list.length;
    const totalItems = list.reduce(
      (s, d) => s + (d.children || []).length,
      0
    );
    const totalQty = list.reduce(
      (s, d) =>
        s + (d.children || []).reduce((ss, it) => ss + (Number(it.receivedQuantity) || 0), 0),
      0
    );
    const warehouseToProject = list.filter(
      (d) =>
        d.transferFromType === 'Warehouse' && d.transferToType === 'Project'
    ).length;
    const projectToWarehouse = list.filter(
      (d) =>
        d.transferFromType === 'Project' && d.transferToType === 'Warehouse'
    ).length;

return [
  { key: 'total', label: 'Total Received', number: total, change: `${total} records`, isPositive: true },
  { key: 'qty', label: 'Total Qty Received', number: totalQty, change: `${totalQty} units`, isPositive: true },
  { key: 'w2p', label: 'Warehouse → Project', number: warehouseToProject, change: `${warehouseToProject} received`, isPositive: true },
  { key: 'p2w', label: 'Project → Warehouse', number: projectToWarehouse, change: `${projectToWarehouse} received`, isPositive: true },
];
  }, [transfers]);

  const filterFn = (item, keyword) =>
    [item.id, item.name, item.code, item.transferFromType, item.transferToType,
      item.transferFromName, item.transferToName, item.status, item.receivedBy]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

  return (
    <>
    <Landing
      title="Material Received"
      data={transfers}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search received materials"
      newButtonLabel="New Received Material"
      onNew={() => router.push('/inventory/materialreceived/form?mode=new')}
      emptyMessage="No material received found"
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
        if (confirmAction && confirmTarget) await confirmAction(confirmTarget);
      }}
      onCancel={() => { setIsConfirmOpen(false); }}
    />
    </>
  );
}