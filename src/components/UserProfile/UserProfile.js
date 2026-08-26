'use client';

import { useEffect, useState } from 'react';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { getAuthData, storeAuthData } from '../../services/Auth';
import { changePassword, updateUser } from '../../services/User';
import styles from './UserProfile.module.scss';

export default function UserProfile() {
  const [authValues, setAuthValues] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const storedAuth = getAuthData();
    console.log('Retrieved auth data from localStorage:', storedAuth);
    if (storedAuth) {
      setAuthValues({
        employeeNumber: storedAuth.employeeNumber ?? '',
        firstName: storedAuth.firstName ?? '',
        lastName: storedAuth.lastName ?? '',
        email: storedAuth.email ?? '',
        role: storedAuth.role?.name ?? '',
        userId: storedAuth.userId ?? '',
        roleId: storedAuth.role?.id ?? 0,
      });
    }
  }, []);

  const handleProfileUpdate = async (values) => {
    const payload = {
      employeeNumber: values.employeeNumber ?? '',
      firstName: values.firstName ?? '',
      lastName: values.lastName ?? '',
      email: values.email ?? '',
      role: authValues?.roleId ?? 0,
      receiveNotification: true,
    };

    const response = await updateUser(authValues.userId, payload);
    if (response.error) {
      toast.error(response.error || 'Unable to update profile. Please try again.');
      return;
    }

    const result = response.data;
    if (!result || result.isSuccess === false) {
      toast.error(result?.error || result?.message || 'Profile update failed.');
      return;
    }

    const storedAuth = getAuthData() || {};
    const updatedAuth = {
      ...storedAuth,
      employeeNumber: payload.employeeNumber,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      userId: authValues.userId,
    };

    storeAuthData(updatedAuth);
    setAuthValues(updatedAuth);
    toast.success('Profile updated successfully.');
    setIsEditMode(false);
  };

  const handlePasswordChange = async (values) => {
    const payload = {
      employeeNumber: authValues.employeeNumber,
      oldPassword: values.password,
      newPassword: values.newPassword,
    };

    if (!payload.oldPassword || !payload.newPassword) {
      toast.error('Please enter both current and new password.');
      return;
    }

    const response = await changePassword(payload);
    if (response.error) {
      toast.error(response.error || 'Unable to change password. Please try again.');
      return;
    }

    const result = response.data;
    if (!result || result.isSuccess === false) {
      toast.error(result?.error || result?.message || 'Password change failed.');
      return;
    }

    toast.success('Password changed successfully.');
    setShowPasswordFields(false);
  };

  const handleSubmit = async (values) => {
    if (isEditMode) {
      await handleProfileUpdate(values);
      return;
    }

    if (showPasswordFields) {
      await handlePasswordChange(values);
    }
  };

  const fields = [
    {
      name: 'employeeNumber',
      label: 'Employee Number',
      readOnly: !isEditMode,
      readOnlyDisplay: (allValues) => {
        const value = allValues.employeeNumber;
        return !value || value === 'string' ? '—' : value;
      },
      span: 'span2',
    },
    {
      name: 'firstName',
      label: 'First Name',
      readOnly: !isEditMode,
      span: 'span2',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      readOnly: !isEditMode,
      span: 'span2',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      readOnly: true,
      span: 'span2',
    },
    { name: 'role', label: 'Role', readOnly: true, span: 'span2' },
    {
      name: 'password',
      label: 'Current Password',
      type: 'password',
      hidden: !showPasswordFields,
      span: 'span2',
    },
    {
      name: 'newPassword',
      label: 'New Password',
      type: 'password',
      hidden: !showPasswordFields,
      span: 'span2',
    },
  ];

  return (
    <EntityForm
      title="User Profile"
      fields={fields}
      initialValues={authValues || {}}
      onSubmit={handleSubmit}
      readOnly={false}
      showSubmitButton={false}
      showBreadcrumbs={false}
      showCloseButton={false}
      columns={3}
      headerActions={
        <div className={styles.headerActions}>
          {!showPasswordFields && !isEditMode && (
            <>
              <Button
                type="button"
                variant="outlinedPrimary"
                onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowPasswordFields(true)}>
                Change Password
              </Button>
            </>
          )}
        </div>
      }
      rightActions={
        isEditMode || showPasswordFields ? (
          <>
            <Button
              type="button"
              variant="outlineDanger"
              onClick={() => {
                setIsEditMode(false);
                setShowPasswordFields(false);
              }}>
              Cancel
            </Button>
            <Button type="submit" variant="save">
              Save
            </Button>
          </>
        ) : null
      }
    />
  );
}