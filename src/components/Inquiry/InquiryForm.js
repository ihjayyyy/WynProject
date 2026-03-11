'use client';

import React, { useMemo, useState } from 'react';
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
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!inquiryId) {
      return initialInquiryFormState;
    }

    const selectedInquiry = sampleInquiries.find((item) => item.id === inquiryId);
    return selectedInquiry || initialInquiryFormState;
  }, [inquiryId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(inquiryId && sampleInquiries.some((item) => item.id === inquiryId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [inquiryId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!inquiryId) return 'Inquiry Form';
    if (isEditMode) return 'Edit Inquiry';
    return 'View Inquiry';
  }, [inquiryId, isEditMode]);

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row 1: Code (left) | spacer | Approval Status (right)
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'approvalStatus', label: 'Approval Status', span: 'span1' },

    // Row 2: Name (left) | spacer | Response By (right)
    { name: 'name', label: 'Name', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'responseBy', label: 'Response By', span: 'span1' },

    // Row 3: Requested By (left) | spacer | Response Date (right)
    { name: 'requestedBy', label: 'Requested By', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'responseDate', label: 'Response Date', type: 'date', span: 'span1' },

    // Row 4: Request Date (left) | spacer | Attention (right)
    { name: 'requestDate', label: 'Request Date', type: 'date', span: 'span1' },
    { name: 'spacer-4', type: 'spacer', span: 'span1' },
    { name: 'attention', label: 'Attention', span: 'span1' },

    // Row 5: Prepared By (left) | spacer | Noted By (right)
    { name: 'preparedBy', label: 'Prepared By', span: 'span1' },
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    { name: 'notedBy', label: 'Noted By', span: 'span1' },

    // Row 6: Reference (left) | spacer | Date (right)
    { name: 'reference', label: 'Reference', span: 'span1' },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    { name: 'date', label: 'Date', type: 'date', span: 'span1' },

    // Details full width
    { name: 'details', label: 'Details', multiline: true, rows: 4, span: 'span3' },

    // Id placed at end so it doesn't disturb the header layout
    { name: 'id', label: 'Id' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiMessageSquare />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!inquiryId) {
          // create new id by incrementing existing numeric suffix
          const nextNumber = (sampleInquiries || []).reduce((max, item) => {
            const parts = (item.id || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `INQ-${String(nextNumber).padStart(4, '0')}`;
          const newItem = {
            ...values,
            id: newId,
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          (sampleInquiries || []).push(newItem);
          return `/inquiry/inquiryform?id=${newId}`;
        }

        // update
        try {
          const idx = (sampleInquiries || []).findIndex((i) => i.id === inquiryId);
          if (idx >= 0) {
            sampleInquiries[idx] = {
              ...sampleInquiries[idx],
              ...values,
              id: inquiryId,
              updatedBy: 'You',
              updatedDate: now,
            };
          }
        } catch (err) {
          console.warn('Failed to update sampleInquiries', err);
        }
        return `/inquiry/inquiryform?id=${inquiryId}`;
      }}
      backPath="/inquiry"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !inquiryId ? (
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
                      router.push(`/inquiry/inquiryform?id=${inquiryId}`);
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
