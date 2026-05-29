'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCompass } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { useToast } from '../ui/Toast/Toast';
import {
  INITIAL_USER,
  registerUser,
  getUserByGuid,
  updateUser,
  deactivateActivateUser,
} from '@/services/User';
import { getAllRoles } from '@/services/Role';

// Utility to generate a random password (12 alphanumeric characters)
const generatePassword = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function UsersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const toast = useToast();
  const isEditMode = mode === 'edit';
  const isViewMode = !isEditMode && userId;

  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]); // <-- new
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    // Fetch roles once on mount
    getAllRoles().then((res) => {
      if (!res.error && Array.isArray(res.data)) {
        setRoles(res.data);
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!userId) return;
    (async () => {
      const res = await getUserByGuid(userId);
      if (!mounted) return;
      if (!res.error) setUser(res.data || {});
    })();
    return () => (mounted = false);
  }, [userId]);

  const initialValues = useMemo(() => {
    if (userId && user) {
      return { ...user, id: user.userId };
    }
    return {
      ...INITIAL_USER,
      password: generatePassword(),
    };
  }, [userId, user]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(userId && user);
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [userId, isEditMode, user]);

  const formTitle = useMemo(() => {
    if (!userId) return 'Users Form';
    return user
      ? `${user.firstName} ${user.lastName}`
      : isEditMode
        ? 'Edit User'
        : 'View User';
  }, [userId, isEditMode, user]);

  // Build role options from fetched roles
  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name })),
    [roles],
  );

  const fields = [
    { name: 'employeeNumber', label: 'Employee No.', span: 'span2', validator: Yup.string().required('Employee number is required') },
    { name: 'firstName', label: 'First Name', span: 'span2', validator: Yup.string().required('First name is required') },
    { name: 'lastName', label: 'Last Name', span: 'span2', validator: Yup.string().required('Last name is required') },
    { name: 'email', label: 'Email', type: 'email', span: 'span2', validator: Yup.string().email('Invalid email').required('Email is required') },
    {
      name: 'role',
      label: 'Role',
      type: 'select', // <-- changed from 'number' to 'select'
      span: 'span2',
      options: roleOptions,
      searchable: true,
      validator: Yup.mixed().required('Role is required'),
    },
    {
      name: 'password',
      label: 'Password',
      span: 'span2',
      readOnly: true,
      hidden: !!userId,
    },
  ];

  const handleSubmit = async (values) => {
    const { employeeNumber, email, firstName, lastName, password, role } =
      values || {};

    if (!userId) {
      const payload = {
        employeeNumber,
        email,
        firstName,
        lastName,
        password,
        role: Number(role) || 0,
      };

      const res = await registerUser(payload);
      if (res?.error) {
        toast.error('Failed to create user');
        return;
      }

      toast.success('User created successfully');
      try {
        router.push('/maintainance/users');
      } catch (_) {}
      return '/maintainance/users';
    } else {
      const payload = {
        employeeNumber,
        email,
        firstName,
        lastName,
        role: Number(role) || 0,
      };

      const res = await updateUser(userId, payload);
      if (res?.error) {
        toast.error('Failed to update user');
        return;
      }

      toast.success('User updated successfully');
      try {
        router.push('/maintainance/users');
      } catch (_) {}
      return '/maintainance/users';
    }
  };

  const handleDeactivateActivate = async () => {
    if (!user?.email) {
      toast.error('Email not found');
      return;
    }

    const res = await deactivateActivateUser(user.email);
    if (res?.error) {
      toast.error(
        user.isActive
          ? 'Failed to deactivate account'
          : 'Failed to activate account',
      );
      return;
    }

    toast.success(
      `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
    );

    const updatedRes = await getUserByGuid(userId);
    if (!updatedRes.error) setUser(updatedRes.data || {});

    setShowDeactivateModal(false);
  };

  return (
    <>
      <EntityForm
        key={userId ? `user-${userId}` : 'new-user'}
        title={formTitle}
        breadcrumbLabel="User"
        icon={<FiCompass />}
        fields={fields}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        backPath="/maintainance/users"
        width="100%"
        columns={3}
        showSubmitButton={false}
        readOnly={isReadOnly}
        headerActions={
          !userId ? (
            <Button type="submit" variant="save">
              Create
            </Button>
          ) : (
            <>
              {isReadOnly ? (
                canEnterEditMode ? (
                  <>
                    <Button
                      variant="outlinedPrimary"
                      onClick={() =>
                        router.push(
                          `/maintainance/users/usersform?id=${userId}&mode=edit`,
                        )
                      }>
                      Edit
                    </Button>
                    <Button
                      variant={
                        user?.isActive ? 'outlineDanger' : 'outlinedPrimary'
                      }
                      onClick={() => setShowDeactivateModal(true)}>
                      {user?.isActive
                        ? 'Deactivate Account'
                        : 'Activate Account'}
                    </Button>
                  </>
                ) : null
              ) : (
                <>
                  <Button
                    variant="outlineDanger"
                    onClick={() => {
                      if (mode === 'edit') {
                        router.push(
                          `/maintainance/users/usersform?id=${userId}`,
                        );
                        return;
                      }
                      router.push('/maintainance/users');
                    }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="save">
                    Save
                  </Button>
                </>
              )}
            </>
          )
        }
      />
      <ConfirmModal
        open={showDeactivateModal}
        title={user?.isActive ? 'Deactivate Account' : 'Activate Account'}
        message={
          user?.isActive
            ? `Are you sure you want to deactivate ${user?.firstName} ${user?.lastName}'s account? They will not be able to log in.`
            : `Are you sure you want to activate ${user?.firstName} ${user?.lastName}'s account?`
        }
        confirmText={user?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={user?.isActive ? 'danger' : 'primary'}
        onConfirm={handleDeactivateActivate}
        onCancel={() => setShowDeactivateModal(false)}
      />
    </>
  );
}
