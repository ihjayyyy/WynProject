'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { getStaffs } from '../../services/Staff';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Job', key: 'job' },
  { header: 'Department', key: 'department' },
  { header: 'Rate Per Hour', key: 'ratePerHour', render: (item) => Number(item.ratePerHour) || 0 },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function StaffLanding() {
  const [staffs, setStaffs] = useState([]);
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getStaffs();
      if (!mounted) return;
      if (res.error) {
        setStaffs([]);
      } else {
        setStaffs(res.data || []);
      }
    })();
    return () => (mounted = false);
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/staff/staffform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/staff/staffform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const staffStats = useMemo(() => {
    const total = staffs.length;
    const jobs = new Set(staffs.map((item) => item.job).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Staff', number: total, change: `${total} records`, isPositive: true },
      { key: 'jobs', label: 'Job Roles', number: jobs, change: `${jobs} unique`, isPositive: true },
    ];
  }, [staffs]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.name,
      item.job,
      item.ratePerHour,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Staff"
      data={staffs}
      columns={columns}
      stats={staffStats}
      searchPlaceholder="Search staff"
      newButtonLabel="New Staff"
      onNew={() => router.push('/staff/staffform')}
      emptyMessage="No staff found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
