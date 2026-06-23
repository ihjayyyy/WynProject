'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { getUOMConversions } from '../../services/UOMConversion';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  // { header: 'Code', key: 'code' },
  // { header: 'Name', key: 'name' },
  { header: 'From', key: 'convertFrom' },
  { header: 'To', key: 'convertTo' },
  { header: 'Factor', key: 'conversionFactor' },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '') },
];

export default function UOMConversionLanding() {
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push('/maintainance/UOMConvertion/UOMConversionForm?id=' + item.id) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push('/maintainance/UOMConvertion/UOMConversionForm?id=' + item.id + '&mode=edit') },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', sortable: false, align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = conversions.length;
    return [
      { key: 'total', label: 'Total Conversions', number: total, change: `${total} records`, isPositive: true },
    ];
  }, [conversions]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getUOMConversions();
      if (!mounted) return;
      if (res.error) {
        setConversions([]);
      } else {
        setConversions(res.data || []);
      }
      setLoading(false);
    })();
    return () => (mounted = false);
  }, []);

  const filterFn = (item, keyword) => {
    return [item.id, item.code, item.name, item.unitOfMeasurement, item.convertFrom, item.convertTo, item.updatedBy, item.updatedAt]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="UOM Conversion"
      columns={columns}
      data={conversions}
      loading={loading}
      stats={stats}
      filterFn={filterFn}
      newButtonLabel="Add UOM Conversion"
      onNew={() => router.push('/maintainance/UOMConvertion/UOMConversionForm')}
    />
  );
}
