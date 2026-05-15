'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import { FiMessageSquare, FiXCircle, FiArchive } from 'react-icons/fi';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_INQUIRY, getInquiries, createInquiry, updateInquiry, acknowledgeInquiry, cancelInquiry, closeInquiry } from '../../services/Inquiry';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getCustomers } from '../../services/Customer';
import { getStaffs } from '../../services/Staff';


export default function InquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const confirmModal = useConfirmModal();
  // Only allow edit mode if not acknowledged
  const [status, setStatus] = useState('');
  const [inquiries, setInquiries] = useState(null);
  React.useEffect(() => {
    if (!inquiryId || !inquiries) return;
    const selected = (inquiries || []).find((item) => String(item.id) === String(inquiryId));
    setStatus(selected && selected.status ? String(selected.status).toLowerCase() : '');
  }, [inquiryId, inquiries]);
  const isEditMode = (mode === 'edit' || isEditModeLocal) && !['acknowledged', 'cancelled', 'closed'].includes(status);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customersData, setCustomersData] = useState([]);

  const [staffOptions, setStaffOptions] = useState([]);
  
  // Track auto-filled overrides and a key to remount the form when customer changes
  const [autoFillOverrides, setAutoFillOverrides] = useState({});
  const [formKey, setFormKey] = useState(0);
  
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!inquiryId) return;
    (async () => {
      const res = await getInquiries();
      if (!mounted) return;
      if (!res.error) setInquiries(res.data || []);
    })();
    return () => (mounted = false);
  }, [inquiryId]);
  
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getCustomers();
      if (!mounted) return;
      if (!res.error) {
        setCustomersData(res.data || []);
        setCustomerOptions((res.data || []).map(c => ({
          label: c.name || c.companyName || c.code || c.customerName,
          value: c.id
        })));

      }
    })();
    return () => (mounted = false);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getStaffs();
      if (!mounted) return;
      if (!res.error) {
        setStaffOptions((res.data || []).map(s => ({
          label: s.name || s.code || '',
          value: s.name || s.code || '',
        })));
      }
    })();
    return () => (mounted = false);
  }, []);

  const baseInitialValues = useMemo(() => {
    if (!inquiryId) return INITIAL_INQUIRY;
    const selectedInquiry = (inquiries || []).find((item) => String(item.id) === String(inquiryId));
    return selectedInquiry || INITIAL_INQUIRY;
  }, [inquiryId, inquiries]);

  // Merge base values with any auto-fill overrides
  const initialValues = useMemo(() => ({
    ...baseInitialValues,
    ...autoFillOverrides,
  }), [baseInitialValues, autoFillOverrides]);

  // Called when the customer dropdown changes
  const handleCustomerChange = useCallback((customerId) => {
    const selected = customersData.find(c => String(c.id) === String(customerId));
    if (!selected) return;

    setAutoFillOverrides(prev => ({
      ...prev,
      customerId,
      contactPerson: selected.customerName || prev.contactPerson || '',
      // attention: selected.customerName || prev.attention || '',
      name: selected.name || prev.name || '',
      companyName: selected.name || prev.companyName || '',
      address:       selected.address       || prev.address       || '',
      email:         selected.email         || prev.email         || '',
      contactNumber: selected.contactNumber || prev.contactNumber || '',
      code:          selected.code          || prev.code          || '',
    }));

    // Remount the form so EntityForm picks up the new initialValues
    setFormKey(k => k + 1);
  }, [customersData]);

  const { isReadOnly, canEnterEditMode, isAcknowledge } = useMemo(() => {
    const exists = Boolean(inquiryId && (inquiries || []).some((item) => String(item.id) === String(inquiryId)));
    const selected = (inquiries || []).find((item) => String(item.id) === String(inquiryId));
    const status = selected && selected.status ? String(selected.status).toLowerCase() : '';
    const acknowledge = status === 'acknowledged';
    const nonEditable = acknowledge || status === 'cancelled' || status === 'closed';
    const readOnly = exists && (!isEditMode || nonEditable);
    return { isReadOnly: readOnly, canEnterEditMode: exists && !nonEditable, isAcknowledge: acknowledge };
  }, [inquiryId, isEditMode, inquiries]);

  const handleCancel = async () => {
    confirmModal.show(
      'Cancel Inquiry',
      `Are you sure you want to cancel inquiry "${inquiryId}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const res = await cancelInquiry(inquiryId);
        if (res?.error) {
          toast.error('Failed to cancel inquiry');
        } else {
          toast.success('Inquiry cancelled');
          const refreshed = await getInquiries();
          if (!refreshed.error) setInquiries(refreshed.data || []);
            setIsEditModeLocal(false);
            setStatus('cancelled');
        }
      }
    );
  };

  const handleClose = async () => {
    confirmModal.show(
      'Close Inquiry',
      `Are you sure you want to close inquiry "${inquiryId}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const res = await closeInquiry(inquiryId);
        if (res?.error) {
          toast.error('Failed to close inquiry');
        } else {
          toast.success('Inquiry closed');
          const refreshed = await getInquiries();
          if (!refreshed.error) setInquiries(refreshed.data || []);
          setIsEditModeLocal(false);
          setStatus('closed');
          router.push('/inquiry');
        }
      }
    );
  };

  const formTitle = useMemo(() => {
    if (!inquiryId) return 'Inquiry Form';
    const titleText = (baseInitialValues && (baseInitialValues.inquiryNo || baseInitialValues.code)) || (isEditMode ? 'Edit Inquiry' : 'View Inquiry');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{titleText}</span>
        {status && <StatusBadge status={status} />}
      </div>
    );
  }, [inquiryId, isEditMode, baseInitialValues, status]);

  const fields = [
{
  name: 'customerId',
  label: 'Customer',
  type: 'select',
  span: 'span1',
  options: customerOptions,
  searchable: true,
  required: true,
  onChange: handleCustomerChange,
  hidden: () => !!inquiryId && !isEditMode, // hide in view mode
},
{
  name: 'companyName',
  label: 'Company Name',
  span: 'span1',
  hidden: () => !inquiryId || isEditMode, // hide in create or edit mode
},
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'code', label: 'Code', span: 'span1', readOnly:true },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1',hidden:true },

    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'date', label: 'Date', type: 'date', span: 'span1' },
    { name: 'preparedBy', label: 'Prepared By', span: 'span1', hidden: true },

    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span2' },
    { name: 'notedBy', label: 'Noted By', span: 'span1', hidden: true },

    { name: 'contactNumber', label: 'Contact Number', type: 'tel', span: 'span1' },
    { name: 'spacer-4', type: 'spacer', span: 'span2' },

    { name: 'attention', label: 'Attention', type: 'select', options: staffOptions, searchable: true, span: 'span1' },
    { name: 'reference', label: 'Reference', span: 'span1',hidden:true },

    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },


    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 2 },
    { name: 'details', label: 'Details', multiline: true, rows: 4, span: 'span3' },
  ];

  return (
    <EntityForm
      key={formKey}          // remounts form with fresh initialValues on customer change
      title={formTitle}
      breadcrumbLabel='Inquiry'
      icon={<FiMessageSquare />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString();
        // Default date to now in ISO format if blank, and always use ISO string
        let dateValue;
        if (values.date && values.date.trim()) {
          // If date is already in ISO format with time, use as is; if only date, add time
          if (/T/.test(values.date)) {
            dateValue = values.date;
          } else {
            // Assume format YYYY-MM-DD, convert to ISO string
            dateValue = new Date(values.date).toISOString();
          }
        } else {
          dateValue = new Date().toISOString();
        }
        const modelPayload = {
          code:          values.code          || '',
          name:          values.name          || '',
          customerId:    values.customerId    || 0,
          companyName:   values.companyName   || '',
          contactNumber: values.contactNumber || '',
          address:       values.address       || '',
          contactPerson: values.contactPerson || '',
          email:         values.email         || '',
          attention:     values.attention     || '',
          preparedBy:    values.preparedBy    || '',
          notedBy:       values.notedBy       || '',
          reference:     values.reference     || '',
          date:          dateValue,
          details:       values.details       || '',
        };

        if (!inquiryId) {
          const payload = { ...modelPayload, createdBy: 'You', createdAt: now, updatedBy: 'You', updatedAt: now };
          const res = await createInquiry(payload);
          if (res?.error) toast.error('Failed to create inquiry');
          else toast.success('Inquiry created');
          try { router.push('/inquiry'); } catch (err) {}
          return '/inquiry';
        }

        const payload = { ...modelPayload, updatedBy: 'You', updatedAt: now };
        const res = await updateInquiry(inquiryId, payload);
        if (res?.error) toast.error('Failed to save inquiry');
        else toast.success('Inquiry saved');
        try { router.push('/inquiry'); } catch (err) {}
        return '/inquiry';
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
            {/* Cancel/Close actions */}
            {inquiryId && (status || '').toLowerCase() !== 'cancelled' && (
              <Button variant="outlineDanger" icon={<FiXCircle />} onClick={handleCancel}>Cancel Inquiry</Button>
            )}
            {inquiryId && (status || '').toLowerCase() === 'cancelled' && (
              <Button variant="primary" icon={<FiArchive />} onClick={handleClose}>Close Inquiry</Button>
            )}

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