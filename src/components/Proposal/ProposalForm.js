'use client';

import React, { useContext, useMemo, useState, version } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck, FiSend, FiX, FiXCircle, FiArchive, FiFileText, FiPrinter } from 'react-icons/fi';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import EntityForm from '../EntityForm/EntityForm';
import Input from '../ui/Input/Input';
import inputStyles from '../ui/Input/Input.module.scss';
import ProposalMaterialsTable from './ProposalMaterialsTable';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_PROPOSAL, getProposalById, createProposal, updateProposal, submitProposal, approveProposal, rejectProposal, winProposal, loseProposal, cancelProposal, closeProposal, reviseProposal, createRevisedProposal, getProposalPDFById, getProposalBreakdownPDFById } from '../../services/Proposal';
import { getParameter } from '../../services/Parameter';
import { convertProposal } from '../../services/Project';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { getCustomers } from '../../services/Customer';
import { getInquiries } from '../../services/Inquiry';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';
import RichTextEditor from '../ui/RichTextEditor/RichTextEditor';
import formStyles from './ProposalForm.module.scss';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

export default function ProposalForm() {
  const PageName = 'Projects.Proposal';
  const { isAllowed } = useContext(AccessContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const isReviseMode = mode === 'revise';
  const isCopyMode = mode === 'copy';
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || mode === 'revise' || isEditModeLocal;

  // null = not yet loaded
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [childrenState, setChildrenState] = useState([]);
  const [deletedChildrenState, setDeletedChildrenState] = useState([]);
  const [isAdminView, setIsAdminView] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const confirmModal = useConfirmModal();
  const [richText, setRichText] = useState({
    miscellaneousDescription: '',
    scopeOfWorkDescription: '',
    warrantyDescription: '',
    modeOfPaymentDescription: '',
    workDurationDescription: '',
  });
  const [extraFields, setExtraFields] = useState({
    miscellaneousTitle: '',
    attachmentUrl: '',
  });
  const [parameterDefaultsLoaded, setParameterDefaultsLoaded] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!proposalId) {
      // No proposalId = create mode, set items to [] so null guard passes
      setItems([]);
      return;
    }
    (async () => {
      if (isReviseMode) {
        const res = await reviseProposal(proposalId);
        if (!mounted) return;
        if (!res.error) {
          const actual = res.data?.value;
          setItems(actual ? [actual] : []);
        } else {
          setItems([]);
        }
      } else {
        const res = await getProposalById(proposalId);
        if (!mounted) return;
        if (!res.error) {
          const d = res.data;
          if (Array.isArray(d)) setItems(d);
          else if (d === null || d === undefined) setItems([]);
          else setItems([d]);
        } else {
          setItems([]);
        }
      }
    })();
    return () => (mounted = false);
  }, [proposalId, isReviseMode, isCopyMode]);
  

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
      } catch (err) {}
    })();
    return () => (mounted = false);
  }, []);

  const initialValues = useMemo(() => {
    if (!proposalId) return INITIAL_PROPOSAL;

    if (isReviseMode) {
      const d = Array.isArray(items) ? items[0] : items;
      if (!d) return INITIAL_PROPOSAL;
      return d;
    }

    let selected;
    if (Array.isArray(items)) {
      selected = items.find((it) => String(it.id) === String(proposalId));
    } else if (items && typeof items === 'object') {
      selected = String(items.id) === String(proposalId) ? items : undefined;
    }
    return selected || INITIAL_PROPOSAL;
  }, [proposalId, items, isReviseMode]);

  React.useEffect(() => {
    setChildrenState(initialValues?.children || []);
    setDeletedChildrenState([]);

    console.log('Initial proposal values:', initialValues);
    if (initialValues.id === 0 && !isReviseMode) {
      getParameter('Proposal').then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          const paramMap = {};
          res.data.forEach((item) => { paramMap[item.name] = item.value; });
          setRichText({
            miscellaneousDescription: paramMap.MiscellaneousDescription || '',
            scopeOfWorkDescription: paramMap.ScopeOfWorkDescription || '',
            warrantyDescription: paramMap.WarrantyDescription || '',
            modeOfPaymentDescription: paramMap.ModeOfPaymentDescription || '',
            workDurationDescription: paramMap.WorkDurationDescription || '',
          });
          setExtraFields((prev) => ({ ...prev, miscellaneousTitle: paramMap.MiscellaneousTitle || '' }));
        }
        setParameterDefaultsLoaded(true);
      });
    } else {
      setRichText({
        miscellaneousDescription: initialValues?.miscellaneousDescription || '',
        scopeOfWorkDescription: initialValues?.scopeOfWorkDescription || '',
        warrantyDescription: initialValues?.warrantyDescription || '',
        modeOfPaymentDescription: initialValues?.modeOfPaymentDescription || '',
        workDurationDescription: initialValues?.workDurationDescription || '',
      });
      setExtraFields({
        miscellaneousTitle: initialValues?.miscellaneousTitle || '',
        attachmentUrl: initialValues?.attachmentUrl || '',
      });
      setParameterDefaultsLoaded(true);
    }
  }, [initialValues]);

  // Normalize top-level date-only fields for inputs (YYYY-MM-DD)
  const toDateOnlyString = (val) => {
    if (!val && val !== 0) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (err) {
      return '';
    }
  };

  const normalizedInitialValues = useMemo(() => {
    if (!initialValues) return initialValues;
    const today = new Date().toISOString().slice(0, 10);
    return {
      ...initialValues,
      forecastedStartDate: toDateOnlyString(initialValues.forecastedStartDate),
      forecastedEndDate: toDateOnlyString(initialValues.forecastedEndDate),
      expirationDate: toDateOnlyString(initialValues.expirationDate),
      requestDate: toDateOnlyString(initialValues.requestDate) || today,
    };
  }, [initialValues]);

  const dedupeDeleted = (arr = []) => {
    const seen = new Map();
    (arr || []).forEach((c) => {
      if (!c) return;
      const key = (c.id && Number(c.id) !== 0) ? `id:${Number(c.id)}` : `u:${c.code || ''}|${c.name || ''}|${c.parentId || ''}`;
      if (!seen.has(key)) seen.set(key, c);
    });
    return Array.from(seen.values());
  };

  const { isReadOnly, canEnterEditMode, isDraft } = useMemo(() => {
    if (isReviseMode) return { isReadOnly: false, canEnterEditMode: false, isDraft: true };
    if (isCopyMode) return { isReadOnly: false, canEnterEditMode: false, isDraft: true };

    const exists = Boolean(proposalId && (items || []).some((item) => String(item.id) === String(proposalId)));
    const selected = (items || []).find((item) => String(item.id) === String(proposalId));
    const status = selected && selected.proposalStatus ? String(selected.proposalStatus) : '';
    const draft = status.toLowerCase() === 'draft';
    const nonEditable = ['cancelled', 'closed'].includes(status.toLowerCase());
    const readOnly = exists && (!isEditMode || !draft || nonEditable);
    return { isReadOnly: readOnly, canEnterEditMode: exists && draft && !nonEditable, isDraft: draft };
  }, [proposalId, isEditMode, items, isReviseMode, isCopyMode]);

  const status = useMemo(() => {
    if (isReviseMode) return 'draft';
    if (isCopyMode) return 'draft';
    const selected = (items || []).find((item) => String(item.id) === String(proposalId));
    return selected && selected.proposalStatus ? String(selected.proposalStatus).toLowerCase() : '';
  }, [proposalId, items, isReviseMode, isCopyMode]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isReviseMode) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Revise Proposal</span>
          <StatusBadge status="draft" />
        </div>
      );
    }
    if (isCopyMode) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Copy Proposal</span>
          <StatusBadge status="draft" />
        </div>
      );
    }
    const titleText = (initialValues && (initialValues.proposalNo || initialValues.code)) || (isEditMode ? 'Edit Proposal' : 'View Proposal');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{titleText}</span>
        {status && <StatusBadge status={status} />}
      </div>
    );
  }, [proposalId, isEditMode, isReviseMode, isCopyMode, initialValues, status]);

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.customerName || c.name || c.code }));
  const inquiryOptions = inquiries.map((q) => ({ value: q.id, label: q.reference || q.code || q.name || String(q.id) }));

  const totals = React.useMemo(() => {
    const rows = (childrenState || []).filter((c) => !c || !c.__isScope);
    const materialCostTotal = rows.reduce((s, r) => s + (Number(r.materialCost) || 0), 0);
    const laborCostTotal = rows.reduce((s, r) => s + (Number(r.laborCost) || 0), 0);
    const proposalTotal = materialCostTotal + laborCostTotal;
    return { materialCostTotal, laborCostTotal, proposalTotal };
  }, [childrenState]);

  const fields = [
    {
      name: 'inquiryId', label: 'Inquiry', type: 'select', options: inquiryOptions, searchable: true,
      placeholder: 'Select inquiry (optional)', span: 'span1',
      readOnly: isReviseMode,
      onChange: (val, values, setValues) => {
        const sel = (inquiries || []).find((q) => String(q.id) === String(val));
        if (sel) {
          setValues({
            ...values,
            inquiryId: sel.id,
            customerId: sel.customerId != null ? Number(sel.customerId) : null,
            customerName: sel.customerName || sel.name || '',
            customerCode: sel.customerCode || sel.code || '',
            code: sel.code || '',
            contactNumber: sel.contactNumber || values.contactNumber || '',
            address: sel.address || values.address || '',
            contactPerson: sel.contactPerson || values.contactPerson || '',
            email: sel.email || values.email || '',
            customerReferenceNumber: sel.reference || sel.code || values.customerReferenceNumber || '',
          });
        }
      },
    },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'proposalNo', label: 'Proposal Number', span: 'span1', readOnly: true },
    { name: 'name', label: 'Proposal Name', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'customerReferenceNumber', label: 'Customer Reference No.', span: 'span1', hidden: true },
    { name: 'requestDate', label: 'Proposal Date', type: 'date', span: 'span1' },
    {
      name: 'customerId', label: 'Company Name', type: 'select', options: customerOptions,
      searchable: true, placeholder: 'Select customer', span: 'span1',
      readOnly: isReviseMode,
      onChange: (val, values, setValues) => {
        const numVal = val !== undefined && val !== null && val !== '' ? Number(val) : null;
        const sel = numVal != null ? customers.find((c) => c.id === numVal) : null;
        if (sel) {
          setValues({
            ...values,
            customerId: sel.id,
            customerCode: sel.code || String(sel.id || ''),
            code: sel.code || '',
            customerName: sel.customerName || sel.name || '',
            contactNumber: sel.contactNumber || '',
            contactPerson: sel.contactPerson || '',
            address: sel.address || '',
            email: sel.email || '',
          });
        } else {
          setValues({ ...values, customerId: null, customerCode: '', customerName: '', contactNumber: '', address: '', email: '' });
        }
      },
    },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'forecastedStartDate', label: 'Forecast Start', type: 'date', span: 'span1' },

    { name: 'customerCode', label: 'Customer Code', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-4', type: 'spacer', span: 'span1' },
    { name: 'forecastedEndDate', label: 'Forecast End', type: 'date', span: 'span1' },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    { name: 'expirationDate', label: 'Expiration Date', type: 'date', span: 'span1' },

    
    { name: 'contactNumber', label: 'Contact Number', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    {
      name: 'laborPercentage', label: 'Labor (%)', type: 'custom', span: 'span1',
      render: ({ values, setValues }) => (
        <div className={inputStyles.field}>
          <label htmlFor="laborPercentage">Labor (%)</label>
          <Input
            id="laborPercentage"
            type="number"
            value={values.laborPercentage ?? ''}
            readOnly={isReadOnly}
            onChange={(e) => {
              const pct = Number(e.target.value) || 0;
              setValues({ ...values, laborPercentage: pct });
            }}
          />
          {!isReadOnly && (
            <Button
              variant="secondary"
              onClick={() => {
                const pct = Number(values.laborPercentage) || 0;
                confirmModal.show(
                  'Apply Labor % to All',
                  `Apply ${pct}% labor to all scopes and materials? This will overwrite their existing values.`,
                  'Apply', 'primary',
                  () => () => applyLaborPctToChildren(pct)
                );
              }}
            >
              Apply to all
            </Button>
          )}
        </div>
      ),
    },
    { name: 'address', label: 'Address', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },
        (isReadOnly ? {
      name: 'proposalTotal', label: 'Proposal Total', type: 'custom', span: 'span1',
      render: ({ values, setValues }) => {
        const v = Number(values.proposalTotal) || 0;
        if (v !== totals.proposalTotal) setValues({ ...values, proposalTotal: totals.proposalTotal });
        return (
          <div className={inputStyles.field}>
            <label>Proposal Total</label>
            <Input id="proposalTotal" value={totals.proposalTotal} readOnly />
          </div>
        );
      },
    } : { name: 'spacer-proposalTotal', type: 'spacer', span: 'span1' }),
    { name: 'email', label: 'Email', type: 'email', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-11', type: 'spacer', span: 'span1' },
        (isReadOnly ? {
      name: 'laborCostTotal', label: 'Labor Cost Total', type: 'custom', span: 'span1',
      render: ({ values, setValues }) => {
        const v = Number(values.laborCostTotal) || 0;
        if (v !== totals.laborCostTotal) setValues({ ...values, laborCostTotal: totals.laborCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Labor Cost Total</label>
            <Input id="laborCostTotal" value={totals.laborCostTotal} readOnly />
          </div>
        );
      },
    } : { name: 'spacer-laborCostTotal', type: 'spacer', span: 'span1' }),
    { name: 'location', label: 'Location', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-9', type: 'spacer', span: 'span1' },
        (isReadOnly ? {
      name: 'materialCostTotal', label: 'Material Cost Total', type: 'custom', span: 'span1',
      render: ({ values, setValues }) => {
        const v = Number(values.materialCostTotal) || 0;
        if (v !== totals.materialCostTotal) setValues({ ...values, materialCostTotal: totals.materialCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Material Cost Total</label>
            <Input id="materialCostTotal" value={totals.materialCostTotal} readOnly />
          </div>
        );
      },
    } : { name: 'spacer-materialCostTotal', type: 'spacer', span: 'span1' }),
    { name: 'margin', label: 'Margin (%)', type: 'number', span: 'span1', readOnly: (values) => (isReadOnly && !isAdminView), hidden: true },
    { name: 'description', label: 'Description', type: 'textarea', span: 'span2', readOnly: isReviseMode },
  ];

  const applyLaborPctToChildren = (pct) => {
    setChildrenState((prev) =>
      (prev || []).map((c) => {
        if (!c) return c;
        if (c.__isScope) return { ...c, laborPercentage: pct };
        const mc = Number(c.materialCost) || 0;
        const lc = Number((mc * pct / 100).toFixed(2));
        const total = Number((mc + lc).toFixed(2));
        return { ...c, laborPercentage: pct, laborCost: lc, totalAmount: total, extendedCost: total, totalPrice: total };
      })
    );
  };

  const formatPayloadDate = (v, dateOnly = false) => {
    if (v === null || v === undefined || v === '') {
      const now = new Date();
      if (dateOnly) return now.toISOString().slice(0, 10) + 'T00:00:00.000Z';
      return now.toISOString();
    }
    if (v instanceof Date) {
      const pad = (n) => String(n).padStart(2, '0');
      const Y = v.getFullYear(), M = pad(v.getMonth() + 1), D = pad(v.getDate());
      const h = pad(v.getHours()), m = pad(v.getMinutes()), s = pad(v.getSeconds());
      if (dateOnly) return `${Y}-${M}-${D}T00:00:00`;
      return `${Y}-${M}-${D}T${h}:${m}:${s}`;
    }
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
    const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (m) return m[1];
    try {
      const d = new Date(s);
      if (isNaN(d)) return s;
      const pad = (n) => String(n).padStart(2, '0');
      const Y = d.getFullYear(), M = pad(d.getMonth() + 1), D = pad(d.getDate());
      const h = pad(d.getHours()), mm = pad(d.getMinutes()), ss = pad(d.getSeconds());
      if (dateOnly) return `${Y}-${M}-${D}T00:00:00`;
      return `${Y}-${M}-${D}T${h}:${mm}:${ss}`;
    } catch (err) { return s; }
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
    scopeDuration: Number(c.scopeDuration) || 0,
    totalAmount: Number(c.totalAmount) || 0,
    isAssembly: Boolean(c.isAssembly),
    totalPrice: Number(c.totalPrice) || 0,
    forecastedStartDate: formatPayloadDate(c.forecastedStartDate, false),
    forecastedEndDate: formatPayloadDate(c.forecastedEndDate, false),
    scopeOfWork: c.scopeOfWork || '',
    remarks: c.remarks || '',
    laborPercentage: Number(c.laborPercentage) || 0,
  });

  const buildModelPayload = (values) => {
    const rawCustomerId = values.customerId;
    const resolvedCustomerId =
      rawCustomerId !== undefined && rawCustomerId !== null && rawCustomerId !== ''
        ? Number(rawCustomerId) : null;
    return {
      code: values.code || '',
      name: values.name || '',
      customerId: resolvedCustomerId,
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
      requestDate: formatPayloadDate(values.requestDate, true) || null,
      customerReferenceNumber: values.customerReferenceNumber || '',
      margin: Number(values.margin) || 0,
      laborPercentage: Number(values.laborPercentage) || 0,
      inquiryId: values.inquiryId || null,
      proposalTotal: Number(totals.proposalTotal) || 0,
      laborCostTotal: Number(totals.laborCostTotal) || 0,
      materialCostTotal: Number(totals.materialCostTotal) || 0,
      miscellaneousTitle: extraFields.miscellaneousTitle || '',
      miscellaneousDescription: richText.miscellaneousDescription || '',
      scopeOfWorkDescription: richText.scopeOfWorkDescription || '',
      warrantyDescription: richText.warrantyDescription || '',
      modeOfPaymentDescription: richText.modeOfPaymentDescription || '',
      workDurationDescription: richText.workDurationDescription || '',
      attachmentUrl: extraFields.attachmentUrl || '',
    };
  };

  const cleanChildren = (state, defaultParentId) =>
    (state || [])
      .filter((c) => !c || !c.__isScope)
      .map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, defaultParentId));

  const cleanDeleted = (state, defaultParentId) =>
    dedupeDeleted((state || []).filter((c) => !c || !c.__isScope).filter((c) => Number(c.id) !== 0))
      .map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, defaultParentId));

  // Same pattern as SalesBillingForm — don't render EntityForm until data is ready
  if (proposalId && items === null) return null;

  return isAllowed(PageName, 'r') ? (
    <>
      <EntityForm
        title={formTitle}
        breadcrumbLabel='Proposal'
        icon={<FiSend />}
        fields={fields}
        initialValues={normalizedInitialValues}
        extraContent={
          <>
            <ProposalMaterialsTable
              proposalId={proposalId}
              editable={!isReadOnly}
              items={childrenState || []}
              isAdmin={isAdminView}
              hideCostColumns={true}
              parentLaborPercentage={Number(initialValues?.laborPercentage) || 0}
              onChange={(updated, deleted) => {
                setChildrenState(updated || []);
                if (deleted) setDeletedChildrenState((prev) => dedupeDeleted(deleted || []));
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
              }}
            />
            <div className={formStyles.extraSection}>
              <div className={`${inputStyles.field} ${formStyles.fullRow}`}>
                <label>Attachment URL</label>
                <Input
                  id="attachmentUrl"
                  value={extraFields.attachmentUrl}
                  onChange={(e) => setExtraFields((p) => ({ ...p, attachmentUrl: e.target.value }))}
                  readOnly={isReadOnly}
                  placeholder="https://..."
                />
              </div>
              <div className={formStyles.inlineFields}>
                <div className={inputStyles.field}>
                  <label>Miscellaneous Title</label>
                  <Input
                    id="miscellaneousTitle"
                    value={extraFields.miscellaneousTitle}
                    onChange={(e) => setExtraFields((p) => ({ ...p, miscellaneousTitle: e.target.value }))}
                    readOnly={isReadOnly}
                    placeholder="Miscellaneous title..."
                  />
                </div>
              </div>
              <div className={formStyles.richTextGrid}>
                <RichTextEditor label="Miscellaneous Description" value={richText.miscellaneousDescription} onChange={(val) => setRichText((p) => ({ ...p, miscellaneousDescription: val }))} readOnly={isReadOnly} placeholder="Any miscellaneous notes..." />
                <RichTextEditor label="Scope of Work Description" value={richText.scopeOfWorkDescription} onChange={(val) => setRichText((p) => ({ ...p, scopeOfWorkDescription: val }))} readOnly={isReadOnly} placeholder="Describe the scope of work..." />
                <RichTextEditor label="Warranty Description" value={richText.warrantyDescription} onChange={(val) => setRichText((p) => ({ ...p, warrantyDescription: val }))} readOnly={isReadOnly} placeholder="Describe the warranty terms..." />
                <RichTextEditor label="Mode of Payment Description" value={richText.modeOfPaymentDescription} onChange={(val) => setRichText((p) => ({ ...p, modeOfPaymentDescription: val }))} readOnly={isReadOnly} placeholder="Describe the mode of payment..." />
                <RichTextEditor label="Work Duration Description" value={richText.workDurationDescription} onChange={(val) => setRichText((p) => ({ ...p, workDurationDescription: val }))} readOnly={isReadOnly} placeholder="Describe the work duration..." />
              </div>
            </div>
          </>
        }
        onSubmit={async (values) => {
          const modelPayload = buildModelPayload(values);

          // REVISE MODE
          if (isReviseMode) {
            const payload = {
              ...modelPayload,
              proposalNo: initialValues.proposalNo || '',
              proposalStatus: initialValues.proposalStatus || 'draft',
              version: initialValues.version || 1,
              originalProposalId: Number(proposalId),
              children: cleanChildren(childrenState, 0),
              deletedChildren: cleanDeleted(deletedChildrenState, 0),
            };
            const res = await createRevisedProposal(payload);
            if (res?.error) toast.error('Failed to create revised proposal');
            else toast.success('Revised proposal created');
            try { router.push('/projects/proposal'); } catch (err) {}
            return '/projects/proposal';
          }

          // COPY MODE - create a new proposal from existing one
          if (isCopyMode) {
            const cleaned = cleanChildren(childrenState, 0).map((c) => ({ ...c, id: 0 }));
            const payload = {
              ...modelPayload,
              children: cleaned,
              deletedChildren: [],
            };
            const res = await createProposal(payload);
            if (res?.error) toast.error('Failed to create proposal');
            else toast.success('Proposal created');
            try { router.push('/projects/proposal'); } catch (err) {}
            return '/projects/proposal';
          }

          // CREATE MODE
          if (!proposalId) {
            const payload = {
              ...modelPayload,
              children: cleanChildren(childrenState, 0),
              deletedChildren: cleanDeleted(deletedChildrenState, 0),
            };
            const res = await createProposal(payload);
            if (res?.error) toast.error('Failed to create proposal');
            else toast.success('Proposal created');
            try { router.push('/projects/proposal'); } catch (err) {}
            return '/projects/proposal';
          }

          // EDIT/UPDATE MODE
          const payload = {
            ...modelPayload,
            children: cleanChildren(childrenState, Number(proposalId)),
            deletedChildren: cleanDeleted(deletedChildrenState, Number(proposalId)),
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
        readOnly={isReadOnly || !isAllowed(PageName, 'w')}
        headerActions={(() => {
          const proposalStatus = String(initialValues?.proposalStatus || '').toLowerCase();
          const isDraftStatus = proposalStatus === 'draft';
          const isSubmitted = proposalStatus === 'submitted';
          const isApproved = proposalStatus === 'approved';
          const isRejected = proposalStatus === 'rejected';
          const isWon = proposalStatus === 'won' || proposalStatus === 'win';
          const shouldShowGenerateProject = isWon && initialValues?.isProjectCreated === false;

          // REVISE MODE: only Save/Cancel
          if (isReviseMode) {
            return (
              <>
                <Button variant="outlineDanger" onClick={() => router.push('/projects/proposal')}>Cancel</Button>
                {isAllowed(PageName, 'w') ? <Button type="submit" variant="save">Save Revision</Button> : null}
              </>
            );
          }

          // COPY MODE: allow creating a new proposal from this one
          if (isCopyMode) {
            return isAllowed(PageName, 'w') ? (
              <>
                <Button variant="outlineDanger" onClick={() => router.push('/projects/proposal')}>Cancel</Button>
                {isAllowed(PageName, 'w') ? <Button type="submit" variant="save">Create Copy</Button> : null}
              </>
            ) : null;
          }

          if (!proposalId) {
            return isAllowed(PageName, 'w') ? <Button type="submit" variant="save">Create</Button> : null;
          }

          return (
            <>
              {isReadOnly ? (
                <>
                  {canEnterEditMode && isAllowed(PageName, 'w') ? (
                    <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
                  ) : null}
                  {isDraftStatus && isAllowed(PageName, 'w') ? (
                    <Button variant="primary" disabled={actionLoading} onClick={() => {
                      setConfirmTitle('Submit proposal?');
                      setConfirmMessage(`Submit proposal "${initialValues.name || initialValues.code || ''}"?`);
                      setConfirmCallback(() => async () => {
                        setActionLoading(true);
                        const res = await submitProposal(proposalId);
                        if (res?.error) toast.error('Failed to submit proposal');
                        else { toast.success('Proposal submitted'); try { router.push('/projects/proposal'); } catch (err) {} }
                        setActionLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}><FiSend size={14} style={{ marginRight: 4 }} />Submit</Button>
                  ) : null}
                  {isSubmitted && isAllowed(PageName, 'a') ? (
                    <>
                      <Button variant="save" disabled={actionLoading} onClick={() => {
                        setConfirmTitle('Approve proposal?');
                        setConfirmMessage(`Approve proposal "${initialValues.name || initialValues.code || ''}"?`);
                        setConfirmCallback(() => async () => {
                          setActionLoading(true);
                          const res = await approveProposal(proposalId);
                          if (res?.error) toast.error('Failed to approve proposal');
                          else { toast.success('Proposal approved'); try { router.push('/projects/proposal'); } catch (err) {} }
                          setActionLoading(false);
                        });
                        setIsConfirmOpen(true);
                      }}><FiCheck size={14} style={{ marginRight: 4 }} />Approve</Button>
                      <Button variant="outlineDanger" disabled={actionLoading} onClick={() => {
                        setConfirmTitle('Reject proposal?');
                        setConfirmMessage(`Reject proposal "${initialValues.name || initialValues.code || ''}"?`);
                        setConfirmCallback(() => async () => {
                          setActionLoading(true);
                          const res = await rejectProposal(proposalId);
                          if (res?.error) toast.error('Failed to reject proposal');
                          else { toast.success('Proposal rejected'); try { router.push('/projects/proposal'); } catch (err) {} }
                          setActionLoading(false);
                        });
                        setIsConfirmOpen(true);
                      }}><FiX size={14} style={{ marginRight: 4 }} />Reject</Button>
                    </>
                  ) : null}
                  {isApproved && isAllowed(PageName, 'w') ? (
                    <>
                      <Button variant="save" disabled={actionLoading} onClick={() => {
                        setConfirmTitle('Mark proposal as Won?');
                        setConfirmMessage(`Mark proposal "${initialValues.name || initialValues.code || ''}" as Won?`);
                        setConfirmCallback(() => async () => {
                          setActionLoading(true);
                          const res = await winProposal(proposalId);
                          if (res?.error) toast.error('Failed to mark proposal as won');
                          else { toast.success('Proposal marked as won'); try { router.push('/projects/proposal'); } catch (err) {} }
                          setActionLoading(false);
                        });
                        setIsConfirmOpen(true);
                      }}><FiCheck size={14} style={{ marginRight: 4 }} />Win</Button>
                      <Button variant="outlineDanger" disabled={actionLoading} onClick={() => {
                        setConfirmTitle('Mark proposal as Lost?');
                        setConfirmMessage(`Mark proposal "${initialValues.name || initialValues.code || ''}" as Lost?`);
                        setConfirmCallback(() => async () => {
                          setActionLoading(true);
                          const res = await loseProposal(proposalId);
                          if (res?.error) toast.error('Failed to mark proposal as lost');
                          else { toast.success('Proposal marked as lost'); try { router.push('/projects/proposal'); } catch (err) {} }
                          setActionLoading(false);
                        });
                        setIsConfirmOpen(true);
                      }}><FiX size={14} style={{ marginRight: 4 }} />Lose</Button>
                    </>
                  ) : null}
                  {isRejected && isAllowed(PageName, 'w') ? (
                    <Button variant="outlineDanger" disabled={actionLoading} onClick={() => {
                      setConfirmTitle('Mark proposal as Lost?');
                      setConfirmMessage(`Mark proposal "${initialValues.name || initialValues.code || ''}" as Lost?`);
                      setConfirmCallback(() => async () => {
                        setActionLoading(true);
                        const res = await loseProposal(proposalId);
                        if (res?.error) toast.error('Failed to mark proposal as lost');
                        else { toast.success('Proposal marked as lost'); try { router.push('/projects/proposal'); } catch (err) {} }
                        setActionLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}><FiX size={14} style={{ marginRight: 4 }} />Lose</Button>
                  ) : null}
                  {shouldShowGenerateProject && isAllowed(PageName, 'w') ? (
                    <Button variant="primary" disabled={actionLoading} onClick={() => {
                      setConfirmTitle('Generate Project?');
                      setConfirmMessage(`Create a project from proposal "${initialValues.name || initialValues.code || ''}"?`);
                      setConfirmCallback(() => async () => {
                        setActionLoading(true);
                        const res = await convertProposal(proposalId);
                        if (res?.error) toast.error('Failed to create project from proposal');
                        else { toast.success('Project created from proposal'); try { router.push('/projects/proposal'); } catch (err) {} }
                        setActionLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}><FiCheck size={14} style={{ marginRight: 4 }} />Generate Project</Button>
                  ) : null}
                  {proposalId && isAllowed(PageName, 'w') && !['cancelled', 'closed'].includes(String(initialValues?.proposalStatus || '').toLowerCase()) ? (
                    <Button variant="outlineDanger" icon={<FiXCircle size={14} />} disabled={actionLoading} onClick={() => {
                      setConfirmTitle('Cancel Proposal?');
                      setConfirmMessage(`Are you sure you want to cancel proposal "${initialValues.name || initialValues.code || ''}"?`);
                      setConfirmCallback(() => async () => {
                        setActionLoading(true);
                        const res = await cancelProposal(proposalId);
                        if (res?.error) toast.error('Failed to cancel proposal');
                        else {
                          toast.success('Proposal cancelled');
                          const refreshed = await getProposalById(proposalId);
                          if (!refreshed.error) setItems(refreshed.data || []);
                        }
                        setActionLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}>Cancel Proposal</Button>
                  ) : null}
                  {proposalId && isAllowed(PageName, 'w') && String(initialValues?.proposalStatus || '').toLowerCase() === 'cancelled' ? (
                    <Button variant="primary" icon={<FiArchive size={14} />} disabled={actionLoading} onClick={() => {
                      setConfirmTitle('Close Proposal?');
                      setConfirmMessage(`Are you sure you want to close proposal "${initialValues.name || initialValues.code || ''}"?`);
                      setConfirmCallback(() => async () => {
                        setActionLoading(true);
                        const res = await closeProposal(proposalId);
                        if (res?.error) toast.error('Failed to close proposal');
                        else { toast.success('Proposal closed'); router.push('/projects/proposal'); }
                        setActionLoading(false);
                      });
                      setIsConfirmOpen(true);
                    }}>Close Proposal</Button>
                  ) : null}
                </>
              ) : (
                <>
                  <Button variant="outlineDanger" onClick={() => {
                    if (mode === 'edit') {
                      router.push(`/projects/proposal/proposalform?id=${proposalId}`);
                      return;
                    }
                    setIsEditModeLocal(false);
                  }}>Cancel</Button>
                  {isAllowed(PageName, 'w') ? <Button type="submit" variant="save">Save</Button> : null}
                </>
              )}
              {( <>
                {
                  // Documents
                  isAllowed(PageName, 'r') && isReadOnly ? 
                  <>
                  <Button variant="primary" icon={<FiPrinter size={14} />} disabled={actionLoading} onClick={async () => {
                    setActionLoading(true);
                    await getProposalPDFById(proposalId);
                    setActionLoading(false);
                    }}>Print</Button>
                  <Button variant="primary" icon={<FiPrinter size={14} />} disabled={actionLoading} onClick={async () => {
                    setActionLoading(true);
                    await getProposalBreakdownPDFById(proposalId);
                    setActionLoading(false);
                    }}>Print Breakdown</Button>
                  </>
                  : null
                }
              </> )}
            </>
          );
        })()}
      />
      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
        onConfirm={async () => {
          setIsConfirmOpen(false);
          if (confirmCallback) await confirmCallback();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  ) : <InvalidPage />;
}