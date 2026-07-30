'use client';

import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import { getAllUsers } from '@/services/User';
import { getAllRoles } from '@/services/Role';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiEdit2, FiEye, FiXCircle } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';

const baseColumns = [
  { header: 'Employee No.', key: 'employeeNumber' },
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Email', key: 'email' },
  {
    header: 'Is Confirmed',
    key: 'confirmed',
    align: 'center',
    render: (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {item?.confirmed ? (
          <FiCheckCircle
            size={16}
            color="#16a34a"
            title="Confirmed"
            aria-label="Confirmed"
          />
        ) : (
          <FiXCircle
            size={16}
            color="#dc2626"
            title="Not confirmed"
            aria-label="Not confirmed"
          />
        )}
      </div>
    ),
  },
  {
    header: 'Is Active',
    key: 'isActive',
    align: 'center',
    render: (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {item?.isActive ? (
          <FiCheckCircle
            size={16}
            color="#16a34a"
            title="Active"
            aria-label="Active"
          />
        ) : (
          <FiXCircle
            size={16}
            color="#dc2626"
            title="Inactive"
            aria-label="Inactive"
          />
        )}
      </div>
    ),
  },
];

export default function UsersLanding() {
  const [users, setUsers] = useState([]);
  const [roleMap, setRoleMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, rolesRes] = await Promise.all([
        getAllUsers(),
        getAllRoles(),
      ]);

      if (!usersRes.error) {
        setUsers(usersRes.data || []);
      }

      if (!rolesRes.error && Array.isArray(rolesRes.data)) {
        const map = Object.fromEntries(
          rolesRes.data.map((r) => [r.id, r.name]),
        );
        setRoleMap(map);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/maintainance/users/usersform?id=${item.userId}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(
            `/maintainance/users/usersform?id=${item.userId}&mode=edit`,
          ),
      },
    ],
    [router],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Role',
        key: 'role',
        render: (item) => roleMap[item.role] ?? item.role,
      },
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        sortable: false,
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems, roleMap],
  );

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive).length;
    const confirmed = users.filter((item) => item.confirmed).length;
    return [
      {
        key: 'total',
        label: 'Total Users',
        number: total,
        change: `${total} records`,
        isPositive: true,
      },
      {
        key: 'active',
        label: 'Active Users',
        number: active,
        change: `${active}/${total || 0}`,
        isPositive: true,
      },
      {
        key: 'confirmed',
        label: 'Confirmed Users',
        number: confirmed,
        change: `${confirmed}/${total || 0}`,
        isPositive: true,
      },
    ];
  }, [users]);

  const filterFn = (item, keyword) => {
    return [item.employeeNumber, item.firstName, item.lastName, item.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Users"
      data={users}
      columns={columns}
      stats={userStats}
      searchPlaceholder="Search user"
      newButtonLabel="Add User"
      onNew={() => router.push('/maintainance/users/usersform')}
      emptyMessage="No users found"
      filterFn={filterFn}
      loading={isLoading}
    />
  );
}
