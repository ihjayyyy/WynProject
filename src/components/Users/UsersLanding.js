'use client';

import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import { getAllUsers } from '@/services/User';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiEdit2, FiEye, FiXCircle } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';

const baseColumns = [
  { header: 'User Id', key: 'userId' },
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
            title="Project created"
            aria-label="Project created"
          />
        ) : (
          <FiXCircle
            size={16}
            color="#dc2626"
            title="Project not created"
            aria-label="Project not created"
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
            title="Project created"
            aria-label="Project created"
          />
        ) : (
          <FiXCircle
            size={16}
            color="#dc2626"
            title="Project not created"
            aria-label="Project not created"
          />
        )}
      </div>
    ),
  },
  { header: 'Role', key: 'role' },
];

export default function UsersLanding() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await getAllUsers();
      if (res.error) {
        setUsers([]);
      } else {
        setUsers(res.data || []);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/customers/customersform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(`/customers/customersform?id=${item.id}&mode=edit`),
      },
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
    return [
      item.userId,
      item.employeeNumber,
      item.firstName,
      item.lastName,
      item.email,
    ]
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
      emptyMessage="No users found"
      filterFn={filterFn}
    />
  );
}
