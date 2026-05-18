'use client';

import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import { getAllRoles } from '@/services/Role';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { useRouter } from 'next/navigation';

const baseColumns = [
  { header: 'ID', key: 'id' },
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
];

export default function RolesLanding() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await getAllRoles();
      if (res.error) {
        setRoles([]);
      } else {
        setRoles(res.data || []);
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
      },
    ],
    [],
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

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: 'Total Roles',
        number: roles.length,
        change: `${roles.length} records`,
        isPositive: true,
      },
    ],
    [roles.length],
  );

  const filterFn = (item, keyword) => {
    return [item.name, item.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Roles"
      data={roles}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search role"
      // newButtonLabel="Add Role"
      // onNew={() => router.push('/maintainance/roles/rolesform')}
      emptyMessage={isLoading ? 'Loading roles...' : 'No roles found'}
      filterFn={filterFn}
    />
  );
}
