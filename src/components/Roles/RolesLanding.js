'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import Landing from '../ui/Landing/Landing';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { getAllRoles } from '@/services/Role';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';

const baseColumns = [
  // { header: 'ID', key: 'id' },
  { header: 'Name', key: 'name' },
  // { header: 'Code', key: 'code' },
];

export default function RolesLanding() {
  const PageName = 'Maintenance.Roles';
  const { isAllowed } = useContext(AccessContext);
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoles = async () => {
    setIsLoading(true);
    const res = await getAllRoles();
    if (res.error) {
      setRoles([]);
    } else {
      setRoles(res.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const actionItems = useMemo(
    () => [
      ...(isAllowed(PageName, 'r')
        ? [
            {
              key: 'view',
              label: 'View',
              icon: <FiEye size={14} />,
              onClick: (item) => router.push(`/maintainance/roles/rolesform?id=${item.id}`),
            },
          ]
        : []),
      ...(isAllowed(PageName, 'w')
        ? [
            {
              key: 'edit',
              label: 'Edit',
              icon: <FiEdit2 size={14} />,
              onClick: (item) => router.push(`/maintainance/roles/rolesform?id=${item.id}&mode=edit`),
            },
          ]
        : []),
    ],
    [isAllowed, router],
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

  return isAllowed(PageName, 'r') ? (
    <Landing
      title="Roles"
      data={roles}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search role"
      newButtonLabel={isAllowed(PageName, 'w') ? 'Add Role' : ''}
      onNew={() => isAllowed(PageName, 'w') && router.push('/maintainance/roles/rolesform')}
      emptyMessage={'No roles found'}
      filterFn={filterFn}
      loading={isLoading}
    />
  ) : (
    <InvalidPage />
  );
}