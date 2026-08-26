'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiMessageSquare, FiXCircle, FiArchive, FiPrinter } from 'react-icons/fi';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_INQUIRY, getInquiries, createInquiry, updateInquiry, acknowledgeInquiry, cancelInquiry, closeInquiry, printInquirySlip_byId } from '../../services/Inquiry';
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

  // Use a ref to hold the latest overrides so the formKey remount always
  // reads the most up-to-date values regardless of React batching.
  const autoFillOverridesRef = useRef({});
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
    date:
      baseInitialValues?.date ||
      new Date().toISOString().split('T')[0],
    ...autoFillOverrides,
  }), [baseInitialValues, autoFillOverrides]);

  // Called when the customer dropdown changes.
  // We update the ref first so the value is immediately available when
  // the remounted form reads `initialValues` (which depends on state).
  const handleCustomerChange = useCallback((customerId) => {
    const selected = customersData.find(c => String(c.id) === String(customerId));
    if (!selected) return;

    const newOverrides = {
      ...autoFillOverridesRef.current,
      customerId,
      contactPerson: selected.customerName || autoFillOverridesRef.current.contactPerson || '',
      name:          selected.name          || autoFillOverridesRef.current.name          || '',
      companyName:   selected.name          || autoFillOverridesRef.current.companyName   || '',
      address:       selected.address       || autoFillOverridesRef.current.address       || '',
      email:         selected.email         || autoFillOverridesRef.current.email         || '',
      contactNumber: selected.contactNumber || autoFillOverridesRef.current.contactNumber || '',
      code:          selected.code          || autoFillOverridesRef.current.code          || '',
    };

    // Persist in the ref so the next render cycle can read it synchronously
    autoFillOverridesRef.current = newOverrides;

    // Update state (triggers re-render + re-computation of initialValues)
    // then bump the key so EntityForm remounts with the fresh initialValues
    setAutoFillOverrides(newOverrides);
    setFormKey(k => k + 1);
  }, [customersData]);

  const { isReadOnly, canEnterEditMode, isAcknowledge } = useMemo(() => {
    const exists = Boolean(inquiryId && (inquiries || []).some((item) => String(item.id) === String(inquiryId)));
    const selected = (inquiries || []).find((item) => String(item.id) === String(inquiryId));
    const currentStatus = selected && selected.status ? String(selected.status).toLowerCase() : '';
    const acknowledge = currentStatus === 'acknowledged';
    const nonEditable = acknowledge || currentStatus === 'cancelled' || currentStatus === 'closed';
    const readOnly = exists && (!isEditMode || nonEditable);
    return { isReadOnly: readOnly, canEnterEditMode: exists && !nonEditable, isAcknowledge: acknowledge };
  }, [inquiryId, isEditMode, inquiries]);

  // FIXED: confirmModal.show's 5th arg is a factory that runs immediately —
  // it must return the real handler, not run the action directly.
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

  // FIXED: same double-thunk fix applied here
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
      validator: Yup.mixed().required('Customer is required'),
      onChange: handleCustomerChange,
      hidden: () => !!inquiryId && !isEditMode,
    },
    {
      name: 'companyName',
      label: 'Company Name',
      span: 'span1',
      hidden: () => !inquiryId || isEditMode,
    },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'code', label: 'Code', span: 'span1', readOnly: true },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1', validator: Yup.string().required('Contact person is required') },
    { name: 'name', label: 'Name', span: 'span1', hidden: true },

    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      span: 'span1',
      validator: Yup.mixed()
        .required('Date is required')
        .test('is-valid-date', 'Invalid date', (v) => {
          if (!v) return false;
          try {
            if (v instanceof Date) return !isNaN(v.getTime());
            if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
              const d = new Date(String(v) + 'T00:00:00');
              return !isNaN(d.getTime());
            }
            const d = new Date(String(v));
            return !isNaN(d.getTime());
          } catch {
            return false;
          }
        }),
    },
    { name: 'preparedBy', label: 'Prepared By', span: 'span1', hidden: true },

    { name: 'email', label: 'Email', type: 'email', span: 'span1', validator: Yup.string().email('Invalid email') },
    { name: 'spacer-3', type: 'spacer', span: 'span2' },
    { name: 'notedBy', label: 'Noted By', span: 'span1', hidden: true },

    { name: 'contactNumber', label: 'Contact Number', type: 'tel', span: 'span1', validator: Yup.string().required('Contact number is required') },
    { name: 'spacer-4', type: 'spacer', span: 'span2' },

    { name: 'attention', label: 'Attention', type: 'select', options: staffOptions, searchable: true, span: 'span1', validator: Yup.mixed().required('Attention is required') },
    { name: 'reference', label: 'Reference', span: 'span1', hidden: true },

    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },

    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 2 },
    { name: 'details', label: 'Details', multiline: true, rows: 4, span: 'span3', validator: Yup.string().required('Details are required') },
  ];

  const PrintButton = () => {
    if (!isReadOnly || !inquiryId) return null;
    return (
      <Button
        variant="primary"
        icon={<FiPrinter size={14} />}
        onClick={async () => {
          await printInquirySlip_byId(inquiryId);
        }}
      >
        Print Inquiry Slip
      </Button>
    );
  };

  const headerActions = (() => {
    if (!inquiryId) {
      return <Button type="submit" variant="save">Create</Button>;
    }

    if (!isReadOnly) {
      return (
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
      );
    }

    const menuItems = [];
    let primaryAction = null;
    const lowerStatus = (status || '').toLowerCase();

    if (canEnterEditMode) {
      primaryAction = (
        <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
      );
    }

    if (inquiryId && lowerStatus !== 'cancelled') {
      menuItems.push({
        key: 'cancel-inquiry',
        label: 'Cancel Inquiry',
        icon: <FiXCircle size={14} />,
        destructive: true,
        onClick: handleCancel,
      });
    }

    if (inquiryId && lowerStatus === 'cancelled') {
      menuItems.push({
        key: 'close-inquiry',
        label: 'Close Inquiry',
        icon: <FiArchive size={14} />,
        onClick: handleClose,
      });
    }

    if (isReadOnly && inquiryId) {
      menuItems.push({
        key: 'print',
        label: 'Print Inquiry Slip',
        icon: <FiPrinter size={14} />,
        onClick: async () => {
          await printInquirySlip_byId(inquiryId);
        },
      });
    }

    return (
      <>
        {primaryAction}
        {menuItems.length > 0 ? <DropdownAction item={initialValues} items={menuItems} /> : null}
      </>
    );
  })();

  return (
    <EntityForm
      key={formKey}
      title={formTitle}
      breadcrumbLabel='Inquiry'
      icon={<FiMessageSquare />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString();
        let dateValue;
        if (values.date && String(values.date).trim()) {
          dateValue = /T/.test(values.date)
            ? values.date
            : new Date(values.date).toISOString();
        } else {
          dateValue = now;
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
          try { router.push('/inquiry'); } catch {}
          return '/inquiry';
        }

        const payload = { ...modelPayload, updatedBy: 'You', updatedAt: now };
        const res = await updateInquiry(inquiryId, payload);
        if (res?.error) toast.error('Failed to save inquiry');
        else toast.success('Inquiry saved');
        try { router.push('/inquiry'); } catch {}
        return '/inquiry';
      }}
      backPath="/inquiry"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={headerActions}
    />
  );
}