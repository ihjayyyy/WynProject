'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '../../ui/Landing/Landing';
import { FiEye } from 'react-icons/fi';
import { getMaterialRequests } from '../../../services/MaterialRequest';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Material', key: 'materialId' },
  { header: 'Project', key: 'projectId' },
  { header: 'Qty', key: 'qty' },
  { header: 'Requested By', key: 'requestedBy' },
  { header: 'Status', key: 'status' },
  { header: 'Request Date', key: 'requestDate' },
];

export default function MaterialRequestLanding() {
  const router = useRouter();
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
      { header: 'Action', key: 'actions', align: 'right', render: (item) => (
        <button onClick={() => router.push(`/inventory/material-request/${item.id}`)} title="View"><FiEye size={14} /></button>
      ) },
    ];
  }, [router]);

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
