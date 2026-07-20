'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { GetAll as GetAllPSR } from '@/services/PurchaseSupplierRequest';
import { useToast } from '../ui/Toast/Toast';

const baseColumns = [
  { header: 'SPR No', key: 'requestNumber' },
  { header: 'PR No', key: 'prNumber' },
  {
    header: 'Date',
    key: 'requestDate',
    render: (item) =>
      item.requestDate
        ? new Date(item.requestDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Request', key: 'name' },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  },
  { header: 'Updated By', key: 'updatedBy' },
  {
    header: 'Updated Date',
    key: 'updatedAt',
    render: (item) =>
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '',
  },
];

export default function PSRLanding() {
  const router = useRouter();
  const toast = useToast();

  const [prs, setPRs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPSRs = async () => {
      setLoading(true);
      const res = await GetAllPSR();
      if (res && !res.error) {
        setPRs(res.data || []);
      } else {
        toast.error('Failed to load purchase supplier requests.');
      }
      setLoading(false);
    };
    fetchPSRs();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(
            `/purchase/supplier-requests/supplierrequestsform?id=${item.id}`,
          ),
      },
    ],
    [router],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        sortable: false,
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const stats = useMemo(() => {
    const total = prs.length;
    const draftCount = prs.filter(
      (p) => String(p?.status || '').toLowerCase() === 'draft',
    ).length;
    const pendingCount = prs.filter((p) =>
      ['pending', 'for approval', 'created', 'submitted'].includes(
        String(p?.status || '').toLowerCase(),
      ),
    ).length;
    const attentionCount = draftCount + pendingCount;

    return [
      {
        key: 'total',
        label: 'Total Requests',
        number: total,
        change: `${draftCount} draft`,
        isPositive: true,
      },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${draftCount} draft, ${pendingCount} pending`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [prs]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.requestNumber,
      item.name,
      item.updatedBy,
      item.updatedAt,
      ...(item.items || []).map((it) => `${it.name}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Purchase Supplier Requests"
      data={prs}
      loading={loading}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search Purchase Supplier Requests"
      newButtonLabel={'New Request'}
      onNew={() =>
        router.push('/purchase/supplier-requests/supplierrequestsform')
      }
      emptyMessage="No supplier request found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
