'use client';

import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import { getAllUsers, resetPassword, deactivateActivateUser } from '@/services/User';
import { getAllRoles } from '@/services/Role';
import { useRouter } from 'next/navigation';
import {
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiXCircle,
  FiKey,
  FiUserX,
  FiUserCheck,
} from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { useToast } from '../ui/Toast/Toast';

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
  const toast = useToast();

  // Reset password confirm state
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Deactivate/activate confirm state
  const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchUsers = async () => {
    const usersRes = await getAllUsers();
    if (!usersRes.error) {
      setUsers(usersRes.data || []);
    }
    return usersRes;
  };

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

  // --- Reset password ---
  const handleResetPasswordClick = (item) => {
    setResetTarget(item);
    setResetConfirmOpen(true);
  };

  const handleResetCancel = () => {
    setResetConfirmOpen(false);
    setResetTarget(null);
  };

  const handleResetConfirm = async () => {
    if (!resetTarget) {
      setResetConfirmOpen(false);
      return;
    }

    setResetConfirmOpen(false);
    setIsResetting(true);

    const response = await resetPassword({
      employeeNumber: resetTarget.employeeNumber,
    });

    setIsResetting(false);
    setResetTarget(null);

    if (response.error) {
      toast.error(response.error || 'Unable to reset password.');
      return;
    }

    const result = response.data;
    if (result && result.isSuccess === false) {
      toast.error(result.error || result.message || 'Unable to reset password.');
      return;
    }

    toast.success('Password reset successfully');

    setIsLoading(true);
    await fetchUsers();
    setIsLoading(false);
  };

  // --- Deactivate / Activate ---
  const handleStatusClick = (item) => {
    setStatusTarget(item);
    setStatusConfirmOpen(true);
  };

  const handleStatusCancel = () => {
    setStatusConfirmOpen(false);
    setStatusTarget(null);
  };

  const handleStatusConfirm = async () => {
    if (!statusTarget) {
      setStatusConfirmOpen(false);
      return;
    }

    setStatusConfirmOpen(false);
    setIsTogglingStatus(true);

    const wasActive = statusTarget.isActive;
    const response = await deactivateActivateUser(statusTarget.employeeNumber);

    setIsTogglingStatus(false);
    setStatusTarget(null);

    if (response.error) {
      toast.error(
        wasActive ? 'Failed to deactivate account' : 'Failed to activate account',
      );
      return;
    }

    toast.success(`User ${wasActive ? 'deactivated' : 'activated'} successfully`);

    setIsLoading(true);
    await fetchUsers();
    setIsLoading(false);
  };

  // Per-row action items — must be a plain function called at render time,
  // NOT a useMemo'd static array, since label/icon depend on each row's state
  // and DropdownAction renders them directly (not as invoked functions).
  const getActionItems = (item) => [
    {
      key: 'view',
      label: 'View',
      icon: <FiEye size={14} />,
      onClick: () => router.push(`/maintainance/users/usersform?id=${item.userId}`),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <FiEdit2 size={14} />,
      onClick: () =>
        router.push(`/maintainance/users/usersform?id=${item.userId}&mode=edit`),
    },
    {
      key: 'resetPassword',
      label: 'Reset Password',
      icon: <FiKey size={14} />,
      onClick: () => handleResetPasswordClick(item),
    },
    {
      key: 'toggleStatus',
      label: item?.isActive ? 'Deactivate' : 'Activate',
      icon: item?.isActive ? <FiUserX size={14} /> : <FiUserCheck size={14} />,
      onClick: () => handleStatusClick(item),
    },
  ];

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
        render: (item) => (
          <DropdownAction item={item} items={getActionItems(item)} />
        ),
      },
    ],
    [roleMap],
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
    <>
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

      <ConfirmModal
        open={isResetConfirmOpen}
        title="Reset Password"
        message={
          resetTarget
            ? `Reset password for ${resetTarget.firstName || ''} ${
                resetTarget.lastName || ''
              } (${resetTarget.employeeNumber})? This will invalidate their current password.`
            : ''
        }
        confirmText={isResetting ? 'Resetting…' : 'Reset Password'}
        confirmVariant="danger"
        onConfirm={handleResetConfirm}
        onCancel={handleResetCancel}
      />

      <ConfirmModal
        open={isStatusConfirmOpen}
        title={statusTarget?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={
          statusTarget
            ? statusTarget.isActive
              ? `Are you sure you want to deactivate ${statusTarget.firstName} ${statusTarget.lastName}'s account? They will not be able to log in.`
              : `Are you sure you want to activate ${statusTarget.firstName} ${statusTarget.lastName}'s account?`
            : ''
        }
        confirmText={
          isTogglingStatus
            ? 'Please wait…'
            : statusTarget?.isActive
              ? 'Deactivate'
              : 'Activate'
        }
        confirmVariant={statusTarget?.isActive ? 'danger' : 'primary'}
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </>
  );
}