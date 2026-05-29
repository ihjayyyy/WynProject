'use client';

import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { GetAll, printPurchaseRequest_byId } from '@/services/PurchaseRequest';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

const baseColumns = [
  { header: 'PR No', key: 'requestNumber' },
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
  { header: 'Project', key: 'name' },
  { header: 'Requested By', key: 'requestedBy' },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedDate' },
];

export default function PRLanding() {
  const PageName = 'Purchase.Requests';
  const { isAllowed } = useContext(AccessContext);

  const router = useRouter();
  const [prList, setprList] = useState([]);

  const getPR = async () => {
    const prs = await GetAll();
    console.log(prs.data);
    setprList(prs.data);
  };
  useEffect(() => {
    getPR();
  }, []);

  const actionItems = useMemo(
    () => [
      ...(isAllowed(PageName, 'r')
        ? [
            {
              key: 'view',
              label: 'View',
              icon: <FiEye size={14} />,
              onClick: (item) =>
                router.push(`/purchase/requests/form?id=${item.id}`),
            },
          ]
        : []),
      ...(isAllowed(PageName, 'r')
        ? [
            {
              key: 'viewpdf',
              label: 'Print Document',
              icon: <FiFileText size={14} />,
              onClick: (item) => printPurchaseRequest_byId(item.id),
            },
          ]
        : []),
      // ...(isAllowed(PageName,'w')  ? [{ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/purchase/orders/ordersform?id=${item.id}&mode=edit`) }]: []),
    ],
    [router],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const orderStats = [];

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.requestNumber,
      item.code,
      item.name,
      item.jobOrder,
      item.requestedBy,
      item.requestDate,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      ...(item.items || []).map((it) => `${it.name} ${it.projectId}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return isAllowed(PageName, 'r') ? (
    <Landing
      title="Purchase Requests"
      data={prList}
      columns={columns}
      stats={orderStats}
      searchPlaceholder="Search Purchase Requests"
      newButtonLabel={isAllowed(PageName, 'w') ? 'New Request' : ''}
      onNew={() => router.push('/purchase/requests/form?mode=edit')}
      emptyMessage="No orders found"
      width="320px"
      filterFn={filterFn}
    />
  ) : (
    <InvalidPage />
  );
}
