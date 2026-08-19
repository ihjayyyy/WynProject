'use client';

import React, { useContext, useMemo, useState, version } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck, FiSend, FiX, FiXCircle, FiArchive, FiFileText, FiPrinter } from 'react-icons/fi';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import EntityForm from '../EntityForm/EntityForm';
import Input from '../ui/Input/Input';
import inputStyles from '../ui/Input/Input.module.scss';
import ProposalMaterialsTable from './ProposalMaterialsTable';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_PROPOSAL, getProposalById, createProposal, updateProposal, submitProposal, approveProposal, rejectProposal, winProposal, loseProposal, cancelProposal, closeProposal, reviseProposal, createRevisedProposal, printProposal_byId, printProposalBreakdown_byId } from '../../services/Proposal';
import { getParameter, getParameterByName } from '../../services/Parameter';
import { convertProposal } from '../../services/Project';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { getCustomers } from '../../services/Customer';
import { getInquiries } from '../../services/Inquiry';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';
import RichTextEditor from '../ui/RichTextEditor/RichTextEditor';
import formStyles from './ProposalForm.module.scss';
import ProposalBOMModal from './ProposalBOMModal';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import DropdownAction from '../ui/DropdownAction/DropdownAction';

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

  // Finance permission - lowercase 'f'. When missing, finance fields
  // (Labor %, Margin) are still shown but rendered non-editable.
  const canEditFinance = isAllowed(PageName, 'f');
  const canWinOrLose = isAllowed(PageName, 'f');

  // null = not yet loaded
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [childrenState, setChildrenState] = useState([]);
  const [deletedChildrenState, setDeletedChildrenState] = useState([]);
  const [childrenError, setChildrenError] = useState('');
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
  // Days-to-expire default pulled from Parameter (module: Proposal, name: ExpiresIn).
  // Used to compute expirationDate = today + expiresInDays for brand-new proposals.
  const [expiresInDays, setExpiresInDays] = useState(null);
  // Default labor % pulled from Parameter (module: ProposalScope, name: LaborPercent).
  // API returns a fraction (e.g. "0.1"); we convert to a whole-number percentage (10)
  // to match how laborPercentage is edited/displayed elsewhere in this form.
  const [defaultLaborPercentage, setDefaultLaborPercentage] = useState(null);
  // Live mirror of the parent form's Labor (%) field, kept in sync via the field's
  // onChange below. Needed because ProposalMaterialsTable/ProposalScopeModal read
  // this as the default for brand-new scopes, and initialValues.laborPercentage is
  // only a load-time snapshot — it doesn't reflect what the user is currently typing.
  const [liveLaborPercentage, setLiveLaborPercentage] = useState(0);
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

    // COPY MODE: append "- copy" to the proposal name so it's clear this is
    // a duplicate of the source proposal, without mutating the original data.
    if (isCopyMode && selected) {
      const baseName = selected.name || '';
      return { ...selected, name: baseName ? `${baseName} - copy` : baseName };
    }

    return selected || INITIAL_PROPOSAL;
  }, [proposalId, items, isReviseMode, isCopyMode]);

  React.useEffect(() => {
    setChildrenState(initialValues?.children || []);
    setDeletedChildrenState([]);

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
          // If ExpiresIn happens to be included in the bulk parameter list, use it directly.
          if (paramMap.ExpiresIn !== undefined) {
            const days = Number(paramMap.ExpiresIn);
            if (!isNaN(days)) setExpiresInDays(days);
          }
        }
        setParameterDefaultsLoaded(true);
      });

      // Dedicated fetch for the ExpiresIn parameter (module: Proposal, name: ExpiresIn).
      // Response shape: { value: { value: "30", module, code, id, name, updatedAt, updatedBy }, isSuccess, ... }
      getParameterByName('Proposal', 'ExpiresIn').then((res) => {
        if (!res.error && res.data !== null && res.data !== undefined && res.data !== '') {
          const days = Number(res.data);
          if (!isNaN(days)) setExpiresInDays(days);
        }
      });

      // Dedicated fetch for the LaborPercent parameter (module: ProposalScope, name: LaborPercent).
      // Response shape: { value: { value: "0.1", module, code, id, name, updatedAt, updatedBy }, isSuccess, ... }
      // "0.1" is a fraction representing 10% — multiply by 100 to get the whole-number
      // percentage this form's laborPercentage field expects.
      getParameterByName('ProposalScope', 'LaborPercent').then((res) => {
        if (!res.error && res.data !== null && res.data !== undefined && res.data !== '') {
          const fraction = Number(res.data);
          if (!isNaN(fraction)) setDefaultLaborPercentage(fraction * 100);
        }
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
  // fallbackToday: when true, blank/invalid values resolve to today's date
  // instead of an empty string (used for new/draft proposals so date pickers
  // start populated rather than triggering "Invalid date" validation errors).
  const toDateOnlyString = (val, fallbackToday = false) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!val && val !== 0) return fallbackToday ? todayStr : '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallbackToday ? todayStr : '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (err) {
      return fallbackToday ? todayStr : '';
    }
  };

  // Returns today + days as a YYYY-MM-DD string.
  const addDaysToTodayString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(days) || 0));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const normalizedInitialValues = useMemo(() => {
    if (!initialValues) return initialValues;
    const today = new Date().toISOString().slice(0, 10);
    // Only default to "today" for brand-new proposals (no proposalId yet),
    // or when in revise/copy mode (both effectively create a new draft).
    // Existing saved proposals keep a genuinely blank date as blank.
    const shouldDefaultToToday = !proposalId || isReviseMode || isCopyMode;

    // Expiration date default: today + expiresInDays (from the Proposal_ExpiresIn
    // parameter), falling back to plain "today" if the parameter hasn't loaded
    // yet or is not a valid number. Only applies when we'd otherwise default to
    // today AND there isn't already a real expirationDate on the record (so we
    // never clobber a genuinely saved value on revise/copy of an existing proposal).
    const hasExistingExpiration = Boolean(initialValues.expirationDate);
    let expirationDateValue;
    if (shouldDefaultToToday && !hasExistingExpiration) {
      expirationDateValue = expiresInDays != null && !isNaN(expiresInDays)
        ? addDaysToTodayString(expiresInDays)
        : today;
    } else {
      expirationDateValue = toDateOnlyString(initialValues.expirationDate, shouldDefaultToToday);
    }

    // Labor % default: only for a genuinely brand-new proposal (no proposalId at all,
    // and not revise/copy — those already carry over the source proposal's real value).
    // Only applies when the record doesn't already have a non-zero laborPercentage.
    const isBrandNew = !proposalId && !isReviseMode && !isCopyMode;
    const hasExistingLaborPercentage = Boolean(initialValues.laborPercentage);
    const laborPercentageValue = (isBrandNew && !hasExistingLaborPercentage && defaultLaborPercentage != null && !isNaN(defaultLaborPercentage))
      ? defaultLaborPercentage
      : initialValues.laborPercentage;

    return {
      ...initialValues,
      forecastedStartDate: toDateOnlyString(initialValues.forecastedStartDate, shouldDefaultToToday),
      forecastedEndDate: toDateOnlyString(initialValues.forecastedEndDate, shouldDefaultToToday),
      expirationDate: expirationDateValue,
      requestDate: toDateOnlyString(initialValues.requestDate) || today,
      laborPercentage: laborPercentageValue,
    };
  }, [initialValues, proposalId, isReviseMode, isCopyMode, expiresInDays, defaultLaborPercentage]);

  React.useEffect(() => {
    setLiveLaborPercentage(Number(normalizedInitialValues?.laborPercentage) || 0);
  }, [normalizedInitialValues]);

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
  const [isProposalBOMOpen, setIsProposalBOMOpen] = useState(false);

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

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name}));
  const inquiryOptions = inquiries.map((q) => ({ value: q.id, label: q.inquiryNo || q.reference || q.code || q.name || String(q.id) }));

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
    { name: 'name', label: 'Proposal Name', span: 'span1', validator: Yup.string().typeError('Proposal Name is required').required('Proposal Name is required') },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'customerReferenceNumber', label: 'Customer Reference No.', span: 'span1', hidden: true },
    { name: 'requestDate', label: 'Proposal Date', type: 'date', span: 'span1', validator: Yup.date().typeError('Invalid date').required('Proposal Date is required') },
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
            customerName: sel.customerName,
            contactNumber: sel.contactNumber || '',
            contactPerson: sel.customerName || '',
            address: sel.address || '',
            email: sel.email || '',
          });
        } else {
          setValues({ ...values, customerId: null, customerCode: '', customerName: '', contactNumber: '', address: '', email: '' });
        }
      },
      validator: Yup.number().typeError('Customer is required').required('Customer is required'),
    },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'forecastedStartDate', label: 'Forecast Start', type: 'date', span: 'span1', validator: Yup.date().typeError('Invalid date').nullable() },

    // { name: 'customerCode', label: 'Customer Code', span: 'span1', readOnly: isReviseMode },
    // { name: 'spacer-4', type: 'spacer', span: 'span1' },
    // { name: 'forecastedEndDate', label: 'Forecast End', type: 'date', span: 'span1', validator: Yup.date().typeError('Invalid date').nullable() },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    { name: 'expirationDate', label: 'Expiration Date', type: 'date', span: 'span1', validator: Yup.date().typeError('Invalid date').nullable() },

    
    { name: 'contactNumber', label: 'Contact Number', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },
    {
      // FINANCE FIELD: still shown to everyone, but the input and the
      // "Apply to all" action are only enabled for users with 'f' permission.
      name: 'laborPercentage', label: 'Labor (%)', type: 'custom', span: 'span1',
      render: ({ values, setValues }) => {
        const fieldDisabled = isReadOnly || !canEditFinance;
        return (
          <div className={inputStyles.field}>
            <label htmlFor="laborPercentage">Labor (%)</label>
            <Input
              id="laborPercentage"
              type="number"
              value={values.laborPercentage ?? ''}
              readOnly={fieldDisabled}
              onChange={(e) => {
                if (fieldDisabled) return;
                const pct = Number(e.target.value) || 0;
                setValues({ ...values, laborPercentage: pct });
                setLiveLaborPercentage(pct);
              }}
            />
            {!isReadOnly && canEditFinance && (
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => {
                  const pct = Number(values.laborPercentage) || 0;
                  confirmModal.show(
                    'Apply Labor % to All',
                    `Apply ${pct}% labor to all scopes and materials? This will overwrite their existing values.`,
                    'Apply', 'primary',
                    () => applyLaborPctToChildren(pct)   // was: () => () => applyLaborPctToChildren(pct)
                  );
                }}
              >
                Apply to all
              </Button>
            )}
          </div>
        );
      },
      validator: Yup.number().typeError('Labor % must be a number').min(0, 'Labor % cannot be less than 0').max(100, 'Labor % cannot be greater than 100').nullable(),
    },
    { name: 'address', label: 'Address', span: 'span1', readOnly: isReviseMode },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },
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

    { name: 'email', label: 'Email', type: 'email', span: 'span1', readOnly: isReviseMode, validator: Yup.string().email('Invalid email').nullable() },
    { name: 'spacer-7b', type: 'spacer', span: 'span1' },

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
    { name: 'spacer-11', type: 'spacer', span: 'span1' },
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

    {
      // FINANCE FIELD: still shown, but non-editable without 'f' permission.
      name: 'margin', label: 'Margin (%)', type: 'number', span: 'span1',
      readOnly: (values) => (isReadOnly && !isAdminView) || !canEditFinance,
      hidden: true,
      validator: Yup.number().typeError('Margin must be a number').min(0, 'Margin cannot be less than 0').max(100, 'Margin cannot be greater than 100').nullable(),
    },
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

  // Returns a full ISO-8601 UTC string with milliseconds, e.g. "2026-06-19T07:13:30.283Z",
  // which is the format the API expects.
  // dateOnly = true forces the time portion to midnight UTC (00:00:00.000Z) for the given date,
  // rather than using "now".
  const formatPayloadDate = (v, dateOnly = false) => {
    if (v === null || v === undefined || v === '') {
      const now = new Date();
      if (dateOnly) {
        const yyyy = now.getUTCFullYear();
        const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(now.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
      }
      return now.toISOString();
    }

    // Plain "YYYY-MM-DD" strings (e.g. from <input type="date">) should be
    // treated as that calendar date at UTC midnight, not parsed in local time
    // (new Date('YYYY-MM-DD') is already UTC-midnight per spec, but we build
    // it explicitly here to be safe and to support dateOnly truncation).
    if (typeof v === 'string') {
      const dateOnlyMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const [, Y, M, D] = dateOnlyMatch;
        return `${Y}-${M}-${D}T00:00:00.000Z`;
      }
    }

    let d;
    if (v instanceof Date) {
      d = v;
    } else {
      d = new Date(v);
    }

    if (isNaN(d.getTime())) {
      // Fall back to "now" if we can't parse it
      d = new Date();
    }

    if (dateOnly) {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    }

    return d.toISOString();
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
    marginQuantity: Number(c.marginQuantity) || 0,
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
      inquiryId: values.inquiryId || 0,
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
        // Force a remount once the ExpiresIn parameter resolves so EntityForm
        // re-seeds its internal form state from the freshly computed
        // normalizedInitialValues (it only reads initialValues once on mount).
        key={`proposal-${proposalId || 'new'}-${mode || 'view'}-${expiresInDays ?? 'pending'}-${defaultLaborPercentage ?? 'pending'}`}
        title={formTitle}
        breadcrumbLabel='Proposal'
        icon={<FiSend />}
        fields={fields}
        initialValues={normalizedInitialValues}
        onValidate={async (values) => {
          const errors = {};
          const materials = (childrenState || []).filter((c) => !c || !c.__isScope);
          if (!materials || materials.length === 0) {
            errors.customerId = 'At least one scope of work or material item is required';
            setChildrenError(errors.customerId);
          } else {
            setChildrenError('');
          }

          // Cross-field date validations
          try {
            const start = values.forecastedStartDate ? new Date(values.forecastedStartDate) : null;
            const end = values.forecastedEndDate ? new Date(values.forecastedEndDate) : null;
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              if (end < start) {
                errors.forecastedEndDate = 'Forecast End must be the same or after Forecast Start';
              }
            }
          } catch (err) {}

          try {
            const req = values.requestDate ? new Date(values.requestDate) : null;
            const exp = values.expirationDate ? new Date(values.expirationDate) : null;
            if (req && exp && !isNaN(req.getTime()) && !isNaN(exp.getTime())) {
              if (exp < req) {
                errors.expirationDate = 'Expiration Date must be on or after Proposal Date';
              }
            }
          } catch (err) {}

          return errors;
        }}
        extraContent={
          <>
            <ProposalMaterialsTable
              proposalId={proposalId}
              editable={!isReadOnly}
              items={childrenState || []}
              isAdmin={isAdminView}
              hideCostColumns={true}
              canEditFinance={canEditFinance}
              parentLaborPercentage={liveLaborPercentage}
              onChange={(updated, deleted) => {
                setChildrenState(updated || []);
                // clear table-level error when user modifies children
                const materialsUpdated = (updated || []).filter((c) => !c || !c.__isScope);
                if (materialsUpdated.length > 0) setChildrenError('');
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
            {childrenError ? <div style={{ color: 'red', marginTop: 8 }}>{childrenError}</div> : null}
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
          // Guard against double-submits from fast double-clicks on the
          // Save/Create/Copy/Revise buttons — mirrors the actionLoading
          // guard already used for the status-transition buttons below.
          if (actionLoading) return;
          setActionLoading(true);
          try {
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
          } finally {
            setActionLoading(false);
          }
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
  const isCancelled = proposalStatus === 'cancelled';
  const shouldShowGenerateProject = isWon && initialValues?.isProjectCreated === false;

  // ── Shared confirm-modal helper ──────────────────────────────────────
  // Called as confirmAndRun(title, message, action, { successMsg, errorMsg }) —
  // the 4th arg is an options object, not a bare string.
  const confirmAndRun = (title, message, action, options = {}) => {
  const { successMsg = 'Done', errorMsg = 'Action failed' } = options;
  setConfirmTitle(title);
  setConfirmMessage(message);
  setConfirmCallback(() => async () => {
    // Guard: ignore if an action is already in flight (e.g. the confirm
    // modal's own button was double-clicked before the disabled state
    // re-rendered).
    if (actionLoading) return;
    setActionLoading(true);
    const res = await action();
    if (res?.error) toast.error(errorMsg);
    else {
      toast.success(successMsg);
      try { router.push('/projects/proposal'); } catch (err) {}
    }
    setActionLoading(false);
  });
  setIsConfirmOpen(true);
};

  // ── Document/reference actions — always available once a record exists,
  // regardless of status, so they live in the overflow menu in every branch ──
  const documentMenuItems = isAllowed(PageName, 'r')
    ? [
        {
          key: 'view-bom',
          label: 'View BOM',
          icon: <FiFileText size={14} />,
          disabled: () => !proposalId || actionLoading,
          onClick: () => setIsProposalBOMOpen(true),
        },
        {
          key: 'print',
          label: 'Print',
          icon: <FiPrinter size={14} />,
          disabled: () => actionLoading,
          onClick: async () => {
            if (actionLoading) return;
            setActionLoading(true);
            await printProposal_byId(proposalId);
            setActionLoading(false);
          },
        },
        {
          key: 'print-breakdown',
          label: 'Print Breakdown',
          icon: <FiPrinter size={14} />,
          disabled: () => actionLoading,
          onClick: async () => {
            if (actionLoading) return;
            setActionLoading(true);
            await printProposalBreakdown_byId(proposalId);
            setActionLoading(false);
          },
        },
      ]
    : [];

  // ── REVISE MODE: only Save/Cancel — no menu needed ──────────────────────
  if (isReviseMode) {
    return (
      <>
        <Button variant="outlineDanger" disabled={actionLoading} onClick={() => router.push('/projects/proposal')}>Cancel</Button>
        {isAllowed(PageName, 'w') ? <Button type="submit" variant="save" disabled={actionLoading}>Save Revision</Button> : null}
      </>
    );
  }

  // ── COPY MODE ────────────────────────────────────────────────────────────
  if (isCopyMode) {
    return isAllowed(PageName, 'w') ? (
      <>
        <Button variant="outlineDanger" disabled={actionLoading} onClick={() => router.push('/projects/proposal')}>Cancel</Button>
        <Button type="submit" variant="save" disabled={actionLoading}>Create Copy</Button>
      </>
    ) : null;
  }

  // ── CREATE MODE (no proposalId yet) ─────────────────────────────────────
  if (!proposalId) {
    return isAllowed(PageName, 'w') ? <Button type="submit" variant="save" disabled={actionLoading}>Create</Button> : null;
  }

  // ── EDIT MODE (form is currently editable) ──────────────────────────────
  if (!isReadOnly) {
    return (
      <>
        <Button variant="outlineDanger" disabled={actionLoading} onClick={() => {
          if (mode === 'edit') {
            router.push(`/projects/proposal/proposalform?id=${proposalId}`);
            return;
          }
          setIsEditModeLocal(false);
        }}>Cancel</Button>
        {isAllowed(PageName, 'w') ? <Button type="submit" variant="save" disabled={actionLoading}>Save</Button> : null}
        {documentMenuItems.length > 0 ? (
          <DropdownAction item={initialValues} items={documentMenuItems} />
        ) : null}
      </>
    );
  }

  // ── READ-ONLY VIEW: one primary action per status + everything else in the menu ──
  const menuItems = [...documentMenuItems];
  let primaryAction = null;

  if (canEnterEditMode && isAllowed(PageName, 'w')) {
    primaryAction = (
      <Button variant="outlinedPrimary" disabled={actionLoading} onClick={() => setIsEditModeLocal(true)}>Edit</Button>
    );
  }

  if (isDraftStatus && isAllowed(PageName, 'w')) {
    primaryAction = (
      <Button variant="primary" disabled={actionLoading} onClick={() => confirmAndRun(
        'Submit proposal?',
        `Submit proposal "${initialValues.name || initialValues.code || ''}"?`,
        () => submitProposal(proposalId),
        { successMsg: 'Proposal submitted' },
      )}>
        <FiSend size={14} style={{ marginRight: 4 }} />Submit
      </Button>
    );
    if (isAllowed(PageName, 'w') && !isCancelled) {
      menuItems.push({
        key: 'cancel',
        label: 'Cancel Proposal',
        icon: <FiXCircle size={14} />,
        destructive: true,
        disabled: () => actionLoading,
        onClick: () => confirmAndRun(
          'Cancel Proposal?',
          `Are you sure you want to cancel proposal "${initialValues.name || initialValues.code || ''}"?`,
          async () => {
            const res = await cancelProposal(proposalId);
            if (!res?.error) {
              const refreshed = await getProposalById(proposalId);
              if (!refreshed.error) setItems(refreshed.data || []);
            }
            return res;
          },
          { successMsg: 'Proposal cancelled' },
        ),
      });
    }
  }

  if (isSubmitted && isAllowed(PageName, 'a')) {
    primaryAction = (
      <Button variant="save" disabled={actionLoading} onClick={() => confirmAndRun(
        'Approve proposal?',
        `Approve proposal "${initialValues.name || initialValues.code || ''}"?`,
        () => approveProposal(proposalId),
        { successMsg: 'Proposal approved' },
      )}>
        <FiCheck size={14} style={{ marginRight: 4 }} />Approve
      </Button>
    );
    menuItems.push({
      key: 'reject',
      label: 'Reject Proposal',
      icon: <FiX size={14} />,
      destructive: true,
      disabled: () => actionLoading,
      onClick: () => confirmAndRun(
        'Reject proposal?',
        `Reject proposal "${initialValues.name || initialValues.code || ''}"?`,
        () => rejectProposal(proposalId),
        { successMsg: 'Proposal rejected' },
      ),
    });
  }

  if (isApproved && canWinOrLose) {
    primaryAction = (
      <Button variant="save" disabled={actionLoading} onClick={() => confirmAndRun(
        'Mark proposal as Won?',
        `Mark proposal "${initialValues.name || initialValues.code || ''}" as Won?`,
        () => winProposal(proposalId),
        { successMsg: 'Proposal marked as won' },
      )}>
        <FiCheck size={14} style={{ marginRight: 4 }} />Win
      </Button>
    );
    menuItems.push({
      key: 'lose',
      label: 'Mark as Lost',
      icon: <FiX size={14} />,
      destructive: true,
      disabled: () => actionLoading,
      onClick: () => confirmAndRun(
        'Mark proposal as Lost?',
        `Mark proposal "${initialValues.name || initialValues.code || ''}" as Lost?`,
        () => loseProposal(proposalId),
        { successMsg: 'Proposal marked as lost' },
      ),
    });
  }

  if (isRejected && canWinOrLose) {
    primaryAction = (
      <Button variant="outlineDanger" disabled={actionLoading} onClick={() => confirmAndRun(
        'Mark proposal as Lost?',
        `Mark proposal "${initialValues.name || initialValues.code || ''}" as Lost?`,
        () => loseProposal(proposalId),
        { successMsg: 'Proposal marked as lost' },
      )}>
        <FiX size={14} style={{ marginRight: 4 }} />Lose
      </Button>
    );
  }

  if (shouldShowGenerateProject && isAllowed(PageName, 'w')) {
    primaryAction = (
      <Button variant="primary" disabled={actionLoading} onClick={() => confirmAndRun(
        'Generate Project?',
        `Create a project from proposal "${initialValues.name || initialValues.code || ''}"?`,
        () => convertProposal(proposalId),
        { successMsg: 'Project created from proposal' },
      )}>
        <FiCheck size={14} style={{ marginRight: 4 }} />Generate Project
      </Button>
    );
  }

  if (proposalId && isAllowed(PageName, 'w') && isCancelled) {
    menuItems.push({
      key: 'close-proposal',
      label: 'Close Proposal',
      icon: <FiArchive size={14} />,
      disabled: () => actionLoading,
      onClick: () => confirmAndRun(
        'Close Proposal?',
        `Are you sure you want to close proposal "${initialValues.name || initialValues.code || ''}"?`,
        () => closeProposal(proposalId),
        { successMsg: 'Proposal closed' },
      ),
    });
  }

  return (
    <>
      {primaryAction}
      {menuItems.length > 0 ? <DropdownAction item={initialValues} items={menuItems} /> : null}
    </>
  );
})()}
      />
      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Confirm"
        confirmDisabled={actionLoading}
        onConfirm={async () => {
          if (actionLoading) return;
          setIsConfirmOpen(false);
          if (confirmCallback) await confirmCallback();
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
      <ProposalBOMModal
        open={isProposalBOMOpen}
        proposalId={proposalId}
        proposalLabel={initialValues?.proposalNo || initialValues?.name || initialValues?.code || ''}
        proposalName={initialValues?.name || ''}
        companyName={initialValues?.customerName || ''}
        onClose={() => setIsProposalBOMOpen(false)}
      />
    </>
  ) : <InvalidPage />;
}