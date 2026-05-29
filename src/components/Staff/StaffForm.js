'use client';

import React, { useMemo, useState } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUserCheck } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_STAFF, getStaffs, createStaff, updateStaff } from '@/services/Staff';

export default function StaffForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [staffs, setStaffs] = useState(null);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!staffId) return;
    (async () => {
      const res = await getStaffs();
      if (!mounted) return;
      if (!res.error) setStaffs(res.data || []);
    })();
    return () => (mounted = false);
  }, [staffId]);

  const initialValues = useMemo(() => {
    if (!staffId) return INITIAL_STAFF;
    const selectedStaff = (staffs || []).find((item) => String(item.id) === String(staffId));
    return selectedStaff || INITIAL_STAFF;
  }, [staffId, staffs]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(staffId && (staffs || []).some((item) => String(item.id) === String(staffId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [staffId, isEditMode, staffs]);

  const formTitle = useMemo(() => {
    if (!staffId) return 'Staff Form';
    if (isEditMode) return 'Edit Staff';
    return 'View Staff';
  }, [staffId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2', validator: Yup.string().required('Code is required') },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
    { name: 'job', label: 'Job', span: 'span2', validator: Yup.string().required('Job is required') },
    { name: 'department', label: 'Department', span: 'span2', validator: Yup.string().required('Department is required') },
    { name: 'ratePerHour', label: 'Rate Per Hour', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Rate per hour must be 0 or more') },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Staff Details"
      icon={<FiUserCheck />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const payload = {
          name: values.name || '',
          code: values.code || '',
          job: values.job || '',
          department: values.department || '',
          ratePerHour: Number(values.ratePerHour) || 0,
        };

        if (!staffId) {
          const res = await createStaff(payload);
          if (res?.error) toast.error('Failed to create staff');
          else toast.success('Staff created');
          try { router.push('/staff'); } catch (err) { }
          return '/staff';
        }

        const res = await updateStaff(staffId, payload);
        if (res?.error) toast.error('Failed to save staff');
        else toast.success('Staff saved');
        try { router.push('/staff'); } catch (err) { }
        return '/staff';
      }}
      backPath="/staff"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !staffId ? (
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
                      router.push(`/staff/staffform?id=${staffId}`);
                      return;
                    }
                    setIsEditModeLocal(false);
                  }}>
                  Cancel
                </Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
  );
}
