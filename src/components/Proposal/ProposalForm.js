'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Input from '../ui/Input/Input';
import inputStyles from '../ui/Input/Input.module.scss';
import ProposalMaterialsTable from './ProposalMaterialsTable';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_PROPOSAL, getProposalById, createProposal, updateProposal } from '../../services/Proposal';
import { getCustomers } from '../../services/Customer';
import { getInquiries } from '../../services/Inquiry';

export default function ProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [childrenState, setChildrenState] = useState([]);
  const [deletedChildrenState, setDeletedChildrenState] = useState([]);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!proposalId) return;
    (async () => {
      const res = await getProposalById(proposalId);
      if (!mounted) return;
      if (!res.error) setItems(res.data ? [res.data] : []);
    })();
    return () => (mounted = false);
  }, [proposalId]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getCustomers();
      if (!mounted) return;
      if (!res.error) setCustomers(res.data || []);
    })();
    return () => (mounted = false);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getInquiries();
        if (!mounted) return;
        if (!res.error && Array.isArray(res.data)) setInquiries(res.data || []);
      } catch (err) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, []);

  const initialValues = useMemo(() => {
    if (!proposalId) return INITIAL_PROPOSAL;
    const selected = (items || []).find((it) => String(it.id) === String(proposalId));
    return selected || INITIAL_PROPOSAL;
  }, [proposalId, items]);

  React.useEffect(() => {
    setChildrenState(initialValues?.children || []);
    setDeletedChildrenState([]);
  }, [initialValues]);

  // dedupe deleted children by id (when present) or by code+name+parentId for unsaved items
  const dedupeDeleted = (arr = []) => {
    const seen = new Map();
    (arr || []).forEach((c) => {
      if (!c) return;
      const key = (c.id && Number(c.id) !== 0) ? `id:${Number(c.id)}` : `u:${c.code||''}|${c.name||''}|${c.parentId||''}`;
      if (!seen.has(key)) seen.set(key, c);
    });
    return Array.from(seen.values());
  };

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(proposalId && (items || []).some((item) => String(item.id) === String(proposalId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [proposalId, isEditMode, items]);

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isEditMode) return 'Edit Proposal';
    return 'View Proposal';
  }, [proposalId, isEditMode]);

  const customerOptions = customers.map((c) => ({ value: c.customerName || c.name || c.code, label: c.customerName || c.name || c.code }));
  const inquiryOptions = inquiries.map((q) => ({ value: q.id, label: q.reference || q.code || q.name || String(q.id) }));

  const totals = React.useMemo(() => {
    const rows = (childrenState || []).filter((c) => !c || !c.__isScope);
    const materialCostTotal = rows.reduce((s, r) => s + (Number(r.materialCost) || 0), 0);
    const laborCostTotal = rows.reduce((s, r) => s + (Number(r.laborCost) || 0), 0);
    const proposalTotal = materialCostTotal + laborCostTotal;
    return { materialCostTotal, laborCostTotal, proposalTotal };
  }, [childrenState]);

  const fields = [
    // Customer name select (full width)
    {
      name: 'customerName',
      label: 'Customer',
      type: 'select',
      options: customerOptions,
      searchable: true,
      placeholder: 'Select customer',
      span: 'span1',
      onChange: (val, values, setValues) => {
        const sel = customers.find((c) => (c.customerName || c.name || c.code) === val);
        if (sel) {
          setValues({
            ...values,
            customerCode: sel.code || String(sel.id || ''),
            customerName: sel.customerName || sel.name || '',
            contactNumber: sel.contactNumber || '',
            address: sel.address || '',
            email: sel.email || '',
          });
        } else {
          // clear customer-related fields if no selection
          setValues({
            ...values,
            customerCode: '',
            customerName: '',
            contactNumber: '',
            address: '',
            email: '',
          });
        }
      },
    },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'inquiryId', label: 'Inquiry', type: 'select', options: inquiryOptions, searchable: true, placeholder: 'Select inquiry (optional)', span: 'span1', onChange: (val, values, setValues) => {
        const sel = (inquiries || []).find((q) => String(q.id) === String(val));
        if (sel) {
          setValues({
            ...values,
            inquiryId: sel.id,
            contactNumber: sel.contactNumber || values.contactNumber || '',
            address: sel.address || values.address || '',
            contactPerson: sel.contactPerson || values.contactPerson || '',
            email: sel.email || values.email || '',
            customerReferenceNumber: sel.reference || sel.code || values.customerReferenceNumber || '',
          });
        }
      } },

    { name: 'customerCode', label: 'Customer Code', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Proposal Name', span: 'span1' },

    { name: 'contactNumber', label: 'Contact Number', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'code', label: 'Proposal Code', span: 'span1' },

    { name: 'address', label: 'Address', span: 'span1' },
    { name: 'spacer-4', type: 'spacer', span: 'span1' },
    { name: 'forecastedStartDate', label: 'Forecast Start', type: 'date', span: 'span1' },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1' },
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    { name: 'forecastedEndDate', label: 'Forecast End', type: 'date', span: 'span1' },

    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    { name: 'expirationDate', label: 'Expiration Date', type: 'date', span: 'span1' },

    { name: 'location', label: 'Location', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },
    { name: 'margin', label: 'Margin (%)', type: 'number', span: 'span1' },

    { name: 'customerReferenceNumber', label: 'Customer Reference No.', span: 'span1' },
    { name: 'spacer-8', type: 'spacer', span: 'span1' },
    { name: 'proposalTotal', label: 'Proposal Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.proposalTotal) || 0;
        if (v !== totals.proposalTotal) setValues({ ...values, proposalTotal: totals.proposalTotal });
        return (
          <div className={inputStyles.field}>
            <label>Proposal Total</label>
            <Input id="proposalTotal" value={totals.proposalTotal} readOnly />
          </div>
        );
      } },


    { name: 'spacer-9', type: 'spacer', span: 'span1' },
    { name: 'spacer-10', type: 'spacer', span: 'span1' },
    { name: 'laborCostTotal', label: 'Labor Cost Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.laborCostTotal) || 0;
        if (v !== totals.laborCostTotal) setValues({ ...values, laborCostTotal: totals.laborCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Labor Cost Total</label>
            <Input id="laborCostTotal" value={totals.laborCostTotal} readOnly />
          </div>
        );
      } },

      { name: 'spacer-11', type: 'spacer', span: 'span1' },
      { name: 'spacer-12', type: 'spacer', span: 'span1' },
      { name: 'materialCostTotal', label: 'Material Cost Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.materialCostTotal) || 0;
        if (v !== totals.materialCostTotal) setValues({ ...values, materialCostTotal: totals.materialCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Material Cost Total</label>
            <Input id="materialCostTotal" value={totals.materialCostTotal} readOnly />
          </div>
        );
      } },
  ];

  // sanitize child objects before sending to API (fill defaults, coerce types)
  // normalize dates to `YYYY-MM-DDTHH:MM:SS` (use midnight for date-only values)
  const formatPayloadDate = (v, dateOnly = false) => {
    if (v === null || v === undefined || v === '') return null;
    if (v instanceof Date) {
      const pad = (n) => String(n).padStart(2, '0');
      const Y = v.getFullYear();
      const M = pad(v.getMonth() + 1);
      const D = pad(v.getDate());
      const h = pad(v.getHours());
      const m = pad(v.getMinutes());
      const s = pad(v.getSeconds());
      if (dateOnly) return `${Y}-${M}-${D}T00:00:00`;
      return `${Y}-${M}-${D}T${h}:${m}:${s}`;
    }
    const s = String(v).trim();
    // date-only like 2026-03-31 -> add midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
    // datetime without seconds: 2026-03-25T08:00 -> add :00
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    // datetime with seconds (possibly with fraction) -> strip fraction
    const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (m) return m[1];
    // fallback: try to parse and format in local time
    try {
      const d = new Date(s);
      if (isNaN(d)) return s;
      const pad = (n) => String(n).padStart(2, '0');
      const Y = d.getFullYear();
      const M = pad(d.getMonth() + 1);
      const D = pad(d.getDate());
      const h = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      if (dateOnly) return `${Y}-${M}-${D}T00:00:00`;
      return `${Y}-${M}-${D}T${h}:${mm}:${ss}`;
    } catch (err) {
      return s;
    }
  };

  const sanitizeChild = (c = {}, defaultParentId = 0) => ({
    id: Number(c.id) || 0,
    name: c.name || '',
    code: c.code || '',
    parentId: c.parentId !== undefined && c.parentId !== null ? Number(c.parentId) : defaultParentId,
    materialId: Number(c.materialId) || 0,
    materialType: c.materialType || '',
    uom: c.uom || '',
    unitCost: Number(c.unitCost) || 0,
    quantity: Number(c.quantity) || 0,
    vat: Number(c.vat) || 0,
    materialCost: Number(c.materialCost) || 0,
    margin: Number(c.margin) || 0,
    discount: Number(c.discount) || 0,
    laborCost: Number(c.laborCost) || 0,
    extendedCost: Number(c.extendedCost) || 0,
    totalAmount: Number(c.totalAmount) || 0,
    isAssembly: Boolean(c.isAssembly),
    totalPrice: Number(c.totalPrice) || 0,
    forecastedStartDate: formatPayloadDate(c.forecastedStartDate, false),
    forecastedEndDate: formatPayloadDate(c.forecastedEndDate, false),
    scopeOfWork: c.scopeOfWork || '',
    remarks: c.remarks || '',
  });

  return (
    <EntityForm
      title={formTitle}
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialValues}
      extraContent={<ProposalMaterialsTable proposalId={proposalId} editable={!isReadOnly} items={childrenState || []} onChange={(updated, deleted) => {
        setChildrenState(updated || []);
        if (deleted) setDeletedChildrenState((prev) => dedupeDeleted(deleted || []));
        // debug: log full proposal form data when materials/scopes change
        try {
          const filteredChildren = (updated || []).filter((c) => !c || !c.__isScope);
          console.log('Proposal form data (debug):', {
            ...initialValues,
            children: filteredChildren,
            deletedChildren: dedupeDeleted(deleted || []),
          });
        } catch (err) {
          console.log('Failed to log proposal data', err);
        }
      }} />}
      onSubmit={async (values) => {
        const now = new Date().toISOString();
        const modelPayload = ({
          code: values.code || '',
          name: values.name || '',
          customerCode: values.customerCode || '',
          customerName: values.customerName || '',
          contactNumber: values.contactNumber || '',
          address: values.address || '',
          contactPerson: values.contactPerson || '',
          email: values.email || '',
          location: values.location || '',
          forecastedStartDate: formatPayloadDate(values.forecastedStartDate, false) || null,
          forecastedEndDate: formatPayloadDate(values.forecastedEndDate, false) || null,
          expirationDate: formatPayloadDate(values.expirationDate, true) || null,
          customerReferenceNumber: values.customerReferenceNumber || '',
          margin: Number(values.margin) || 0,
          inquiryId: values.inquiryId || null,
          proposalTotal: Number(values.proposalTotal) || 0,
          laborCostTotal: Number(values.laborCostTotal) || 0,
          materialCostTotal: Number(values.materialCostTotal) || 0,
        });

        if (!proposalId) {
          const payload = {
            id: 0,
            ...modelPayload,
            children: (childrenState || []).filter((c) => !c || !c.__isScope).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
            deletedChildren: dedupeDeleted((deletedChildrenState || []).filter((c) => !c || !c.__isScope)).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
          };
          const res = await createProposal(payload);
          if (res?.error) {
            toast.error('Failed to create proposal');
          } else {
            toast.success('Proposal created');
          }
          try { router.push('/projects/proposal'); } catch (err) {}
          return '/projects/proposal';
        }

        const payload = {
          id: Number(proposalId),
          ...modelPayload,
          children: (childrenState || []).filter((c) => !c || !c.__isScope).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
          deletedChildren: dedupeDeleted((deletedChildrenState || []).filter((c) => !c || !c.__isScope)).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
        };
        const res = await updateProposal(proposalId, payload);
        if (res?.error) toast.error('Failed to save proposal');
        else toast.success('Proposal saved');
        try { router.push('/projects/proposal'); } catch (err) {}
        return '/projects/proposal';
      }}
      backPath="/projects/proposal"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !proposalId ? (
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
                      router.push(`/projects/proposal/proposalform?id=${proposalId}`);
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
