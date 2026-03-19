'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiUsers } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialEmployeeState, sampleEmployees } from './employeesData';

export default function EmployeesForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!employeeId) return initialEmployeeState;
    const selected = sampleEmployees.find((item) => item.id === employeeId);
    return selected || initialEmployeeState;
  }, [employeeId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(employeeId && sampleEmployees.some((item) => item.id === employeeId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [employeeId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!employeeId) return 'Employees Form';
    if (isEditMode) return 'Edit Employee';
    return 'View Employee';
  }, [employeeId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id', span: 'span2' },
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'firstName', label: 'First Name', span: 'span2' },
    { name: 'lastName', label: 'Last Name', span: 'span2' },
    { name: 'position', label: 'Position', span: 'span2' },
    { name: 'department', label: 'Department', span: 'span2' },
    { name: 'contactNumber', label: 'Contact Number', type: 'tel', span: 'span2' },
    { name: 'email', label: 'Email', type: 'email', span: 'span2' },
    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 3 },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Employee Details"
      icon={<FiUsers />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!employeeId) {
          const nextNumber = (sampleEmployees || []).reduce((max, item) => {
            const parts = (item.id || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `EMP-${String(nextNumber).padStart(4, '0')}`;
          const newItem = {
            ...values,
            id: newId,
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          sampleEmployees.push(newItem);
          return '/employees';
        }

        const idx = (sampleEmployees || []).findIndex((i) => i.id === employeeId);
        const updatedItem = {
          ...values,
          id: employeeId,
          updatedBy: 'You',
          updatedDate: now,
        };
        if (idx !== -1) sampleEmployees[idx] = updatedItem;
        return '/employees';
      }}
      backPath="/employees"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={!employeeId ? (
        <Button type="submit" variant="save">Create</Button>
      ) : (
        <>
          {isReadOnly ? (
            canEnterEditMode ? (
              <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
            ) : null
          ) : (
            <>
              <Button
                variant="outlineDanger"
                onClick={() => {
                  if (mode === 'edit') {
                    router.push(`/employees/employeesform?id=${employeeId}`);
                    return;
                  }
                  setIsEditModeLocal(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="save">Save</Button>
            </>
          )}
        </>
      )}
    />
  );
}
