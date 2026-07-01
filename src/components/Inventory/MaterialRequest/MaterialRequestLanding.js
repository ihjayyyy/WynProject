'use client';

import React, { useMemo, useState, useEffect } from 'react';
// no router needed for view-only landing
import Landing from '../../ui/Landing/Landing';
import StatusBadge from '../../ui/StatusBadge/StatusBadge';
// no action icons or dropdown needed
import { getMaterialRequests, printMaterialRequest_byObj } from '../../../services/MaterialRequest';
import Button from '@/components/ui/Button/Button';
import { FiPrinter } from 'react-icons/fi';

const baseColumns = [
  { header: 'RIV No.', key: 'rivNumber' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Req. Qty', key: 'requestedQty', render: (item) => (<div style={{textAlign:"end"}}>{item.requestedQty}</div>) },
  { header: 'Request Notes', key: 'reasonOrProject' },
  { header: 'Requested By', key: 'requestedBy' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
  { header: 'Request Date', key: 'requestDate', render: (item) => (item.requestDate ? new Date(item.requestDate).toLocaleString() : '') },
  { header: 'Deadline', key: 'deadline', render: (item) => (item.deadline ? new Date(item.deadline  ).toLocaleString() : '') },

  {
    header: 'Print RV',
    key: '__actions',
    sortable: false,
    render: (item) =>
      <div>
        {(item.rivNumber != "" && item.rivNumber != null) && (
          <Button
            size="sm"
            variant="outlinedPrimary"
            icon={<FiPrinter size={14} />}
            title="Print Request Voucher"
            onClick={() => { printMaterialRequest_byObj(item); }}
            style={{ marginLeft: '6px' }}
          />
        )}
      </div>
  },
];

export default function MaterialRequestLanding() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMaterialRequests();
        if (!cancelled && !res?.error) setRequests(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const columns = useMemo(() => {
    return [
      ...baseColumns,
    ];
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const totalQty = requests.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    return [
      { key: 'total', label: 'Requests', number: total, change: `${total} records`, isPositive: true },
      { key: 'qty', label: 'Total Qty', number: totalQty, change: `${totalQty} units`, isPositive: true },
    ];
  }, [requests]);

  const filterFn = (it, k) => {
    const keyword = k;
    return [
      it.id,
      it.name,
      it.code,
      it.requestedBy,
      it.status,
      it.requestDate,
    ].filter(Boolean).some((v) => String(v).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Material Requests"
      data={requests}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search requests"
      emptyMessage="No material requests found"
      width="320px"
      filterFn={filterFn}
      hideNewButton
    />
  );
}
