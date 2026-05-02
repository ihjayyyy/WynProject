'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiMessageSquare } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_INQUIRY, getInquiries, createInquiry, updateInquiry } from '../../services/Inquiry';
import { getCustomers } from '../../services/Customer';


export default function InquiryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [inquiries, setInquiries] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  
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
      attention: selected.customerName || prev.attention || '',
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

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(inquiryId && (inquiries || []).some((item) => String(item.id) === String(inquiryId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [inquiryId, isEditMode, inquiries]);

  const formTitle = useMemo(() => {
    if (!inquiryId) return 'Inquiry Form';
    if (isEditMode) return 'Edit Inquiry';
    return 'View Inquiry';
  }, [inquiryId, isEditMode]);

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
    { name: 'preparedBy', label: 'Prepared By', span: 'span1' },

    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'notedBy', label: 'Noted By', span: 'span1' },

    { name: 'contactNumber', label: 'Contact Number', type: 'tel', span: 'span1' },
    { name: 'spacer-4', type: 'spacer', span: 'span1' },
    { name: 'date', label: 'Date', type: 'date', span: 'span1' },

    { name: 'attention', label: 'Attention', span: 'span1',hidden:true },
    { name: 'reference', label: 'Reference', span: 'span1' },

    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },


    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 2 },
    { name: 'details', label: 'Details', multiline: true, rows: 4, span: 'span3' },
  ];

  return (
    <EntityForm
      key={formKey}          // remounts form with fresh initialValues on customer change
      title={formTitle}
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