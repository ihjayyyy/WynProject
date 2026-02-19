'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiMessageSquare } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialInquiryFormState, sampleInquiries } from './inquiryData';

export default function InquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!inquiryId) {
      return initialInquiryFormState;
    }

    const selectedInquiry = sampleInquiries.find((item) => item.id === inquiryId);
    return selectedInquiry || initialInquiryFormState;
  }, [inquiryId]);

  const isReadOnly = useMemo(
    () => Boolean(inquiryId && !isEditMode && sampleInquiries.some((item) => item.id === inquiryId)),
    [inquiryId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!inquiryId) return 'Inquiry Form';
    if (isEditMode) return 'Edit Inquiry';
    return 'View Inquiry';
  }, [inquiryId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'requestedBy', label: 'Requested By' },
    { name: 'requestDate', label: 'Request Date', type: 'date' },
    { name: 'approvalStatus', label: 'Approval Status' },
    { name: 'responseBy', label: 'Response By' },
    { name: 'responseDate', label: 'Response Date', type: 'date' },
    { name: 'attention', label: 'Attention' },
    { name: 'preparedBy', label: 'Prepared By' },
    { name: 'notedBy', label: 'Noted By' },
    { name: 'reference', label: 'Reference' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'details', label: 'Details', multiline: true, rows: 4, span: 'span8' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiMessageSquare />}
      fields={fields}
      initialValues={initialValues}
      backPath="/inquiry"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !inquiryId ? (
          <Button type="submit" variant="save">
            Create
          </Button>
        ) : isReadOnly ? (
          <Button
            variant="outlinedPrimary"
            onClick={() => router.push(`/inquiry/inquiryform?id=${inquiryId}&mode=edit`)}>
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="outlineDanger"
              onClick={() => router.push(`/inquiry/inquiryform?id=${inquiryId}`)}>
              Cancel
            </Button>
            <Button type="submit" variant="save">
              Save
            </Button>
          </>
        )
      }
    />
  );
}
