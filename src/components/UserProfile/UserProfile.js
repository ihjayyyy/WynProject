'use client';

import { useEffect, useState } from 'react';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { getAuthData, storeAuthData } from '../../services/Auth';
import { changePassword, updateUser } from '../../services/User';
import styles from './UserProfile.module.scss';

export default function UserProfile() {
  const [authValues, setAuthValues] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedAuth = getAuthData();
    if (storedAuth) {
      setAuthValues({
        employeeNumber: storedAuth.employeeNumber ?? '',
        firstName: storedAuth.firstName ?? '',
        lastName: storedAuth.lastName ?? '',
        email: storedAuth.email ?? '',
        role: storedAuth.role ?? '',
        userId: storedAuth.userId ?? '',
      });
    }
  }, []);

  const resetMessages = () => {
    setErrorMessage('');
    setStatusMessage('');
  };

  const handleProfileUpdate = async (values) => {
    resetMessages();

    const payload = {
      employeeNumber: values.employeeNumber ?? '',
      firstName: values.firstName ?? '',
      lastName: values.lastName ?? '',
      email: values.email ?? '',
      role: values.role ?? 0,
      receiveNotification: true,
    };

    const response = await updateUser(authValues.userId, payload);
    if (response.error) {
      setErrorMessage(
        response.error || 'Unable to update profile. Please try again.',
      );
      return;
    }

    const result = response.data;
    if (!result || result.isSuccess === false) {
      setErrorMessage(
        result?.error || result?.message || 'Profile update failed.',
      );
      return;
    }

    const storedAuth = getAuthData() || {};
    const updatedAuth = {
      ...storedAuth,
      employeeNumber: payload.employeeNumber,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      role: payload.role,
      userId: authValues.userId,
    };

    storeAuthData(updatedAuth);
    setAuthValues(updatedAuth);
    setStatusMessage('Profile updated successfully.');
    setIsEditMode(false);
  };

  const handlePasswordChange = async (values) => {
    resetMessages();

    const payload = {
      email: values.email,
      password: values.password,
      newPassword: values.newPassword,
    };

    if (!payload.password || !payload.newPassword) {
      setErrorMessage('Please enter both current and new password.');
      return;
    }

    const response = await changePassword(payload);
    if (response.error) {
      setErrorMessage(
        response.error || 'Unable to change password. Please try again.',
      );
      return;
    }

    const result = response.data;
    if (!result || result.isSuccess === false) {
      setErrorMessage(
        result?.error || result?.message || 'Password change failed.',
      );
      return;
    }

    setStatusMessage('Password changed successfully.');
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
                setErrorMessage('');
                setStatusMessage('');
              }}>
              Cancel
            </Button>
            <Button type="submit" variant="save">
              Save
            </Button>
          </>
        ) : null
      }
      extraContent={
        <div>
          {errorMessage && (
            <div className={styles.errorMessage}>{errorMessage}</div>
          )}
          {statusMessage && (
            <div className={styles.statusMessage}>{statusMessage}</div>
          )}
        </div>
      }
    />
  );
}
