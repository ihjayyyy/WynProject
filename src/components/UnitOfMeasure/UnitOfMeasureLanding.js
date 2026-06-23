'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { getUnitsOfMeasure } from '../../services/UnitOfMeasure';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function UnitOfMeasureLanding() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push('/maintainance/UOM/UOMForm?id=' + item.id) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push('/maintainance/UOM/UOMForm?id=' + item.id + '&mode=edit') },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', sortable: false, align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = units.length;
    return [
      { key: 'total', label: 'Total Units', number: total, change: `${total} records`, isPositive: true },
    ];
  }, [units]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getUnitsOfMeasure();
      if (!mounted) return;
      if (res.error) {
        setUnits([]);
      } else {
        setUnits(res.data || []);
      }
      setLoading(false);
    })();
    return () => (mounted = false);
  }, []);

  const filterFn = (item, keyword) => {
    return [item.id, item.code, item.name, item.updatedBy, item.updatedAt]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Unit of Measure"
      data={units}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search unit of measure"
      newButtonLabel="New Unit"
      onNew={() => router.push('/maintainance/UOM/UOMForm')}
      emptyMessage="No units found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
