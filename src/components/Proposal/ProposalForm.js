'use client';

import React, { useContext, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheck, FiFileText, FiSend, FiX } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Input from '../ui/Input/Input';
import inputStyles from '../ui/Input/Input.module.scss';
import ProposalMaterialsTable from './ProposalMaterialsTable';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_PROPOSAL, getProposalById, createProposal, updateProposal, submitProposal, approveProposal, rejectProposal, winProposal, loseProposal } from '../../services/Proposal';
import { convertProposal } from '../../services/Project';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { getCustomers } from '../../services/Customer';
import { getInquiries } from '../../services/Inquiry';
import { AccessContext } from '@/app/contextProviders/accessContext';
import InvalidPage from '@/components/InvalidPage/page';

export default function ProposalForm() {
  const PageName = 'Projects.Proposal';
  const { isAllowed } = useContext(AccessContext);
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
  const [isAdminView, setIsAdminView] = useState(false); // toggle for testing admin view
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!proposalId) return;
    (async () => {
      const res = await getProposalById(proposalId);
      if (!mounted) return;
      if (!res.error) setItems(res.data || []);
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

  const { isReadOnly, canEnterEditMode, isDraft } = useMemo(() => {
    const exists = Boolean(proposalId && (items || []).some((item) => String(item.id) === String(proposalId)));
    const selected = (items || []).find((item) => String(item.id) === String(proposalId));
    const status = selected && selected.proposalStatus ? String(selected.proposalStatus) : '';
    const draft = status.toLowerCase() === 'draft';
    const readOnly = exists && (!isEditMode || !draft);
    return { isReadOnly: readOnly, canEnterEditMode: exists && draft, isDraft: draft };
  }, [proposalId, isEditMode, items]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isEditMode) return 'Edit Proposal';
    return 'View Proposal';
  }, [proposalId, isEditMode]);

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

    { name: 'inquiryId', label: 'Inquiry', type: 'select', options: inquiryOptions, searchable: true, placeholder: 'Select inquiry (optional)', span: 'span1', onChange: (val, values, setValues) => {
      const sel = (inquiries || []).find((q) => String(q.id) === String(val));
      if (sel) {
        setValues({
          ...values,
          inquiryId: sel.id,
          // FIX: use null instead of '' when customerId is missing
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
    } },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'proposalNo', label: 'Proposal Number', span: 'span1', readOnly: true },

   
    { name: 'name', label: 'Proposal Name', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'customerReferenceNumber', label: 'Customer Reference No.', span: 'span1', hidden:true },
    { name: 'forecastedStartDate', label: 'Forecast Start', type: 'date', span: 'span1' },

    {
      name: 'customerId',
      label: 'Customer',
      type: 'select',
      options: customerOptions,
      searchable: true,
      placeholder: 'Select customer',
      span: 'span1',
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
            address: sel.address || '',
            email: sel.email || '',
          });
        } else {
          // FIX: use null instead of '' when clearing customer fields
          setValues({
            ...values,
            customerId: null,
            customerCode: '',
            customerName: '',
            contactNumber: '',
            address: '',
            email: '',
          });
        }
      },
    },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'forecastedEndDate', label: 'Forecast End', type: 'date', span: 'span1' },

    { name: 'customerCode', label: 'Customer Code', span: 'span1' },
    { name: 'spacer-4', type: 'spacer', span: 'span1' },
    { name: 'expirationDate', label: 'Expiration Date', type: 'date', span: 'span1' },

    { name: 'contactPerson', label: 'Contact Person', span: 'span1' }, 
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    (isReadOnly ? { name: 'proposalTotal', label: 'Proposal Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.proposalTotal) || 0;
        if (v !== totals.proposalTotal) setValues({ ...values, proposalTotal: totals.proposalTotal });
        return (
          <div className={inputStyles.field}>
            <label>Proposal Total</label>
            <Input id="proposalTotal" value={totals.proposalTotal} readOnly />
          </div>
        );
      } } : { name: 'spacer-proposalTotal', type: 'spacer', span: 'span1' }),

    { name: 'contactNumber', label: 'Contact Number', span: 'span1' },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },
        (isReadOnly ? { name: 'laborCostTotal', label: 'Labor Cost Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.laborCostTotal) || 0;
        if (v !== totals.laborCostTotal) setValues({ ...values, laborCostTotal: totals.laborCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Labor Cost Total</label>
            <Input id="laborCostTotal" value={totals.laborCostTotal} readOnly />
          </div>
        );
      } } : { name: 'spacer-laborCostTotal', type: 'spacer', span: 'span1' }),
    // Margin field: editable when not read-only, or when admin view is active
    { name: 'margin', label: 'Margin (%)', type: 'number', span: 'span1', readOnly: (values) => (isReadOnly && !isAdminView), hidden:true },

    { name: 'address', label: 'Address', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },
        (isReadOnly ? { name: 'materialCostTotal', label: 'Material Cost Total', type: 'custom', span: 'span1', render: ({ values, setValues }) => {
        const v = Number(values.materialCostTotal) || 0;
        if (v !== totals.materialCostTotal) setValues({ ...values, materialCostTotal: totals.materialCostTotal });
        return (
          <div className={inputStyles.field}>
            <label>Material Cost Total</label>
            <Input id="materialCostTotal" value={totals.materialCostTotal} readOnly />
          </div>
        );
      } } : { name: 'spacer-materialCostTotal', type: 'spacer', span: 'span1' }),

  
    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'spacer-8', type: 'spacer', span: 'span1' },
    

    { name: 'spacer-10', type: 'spacer', span: 'span1' },
    { name: 'location', label: 'Location', span: 'span1' },
    { name: 'spacer-9', type: 'spacer', span: 'span1' },
    { name: 'description', label: 'Description', type: 'textarea', span: 'span2' },

  ];

  // sanitize child objects before sending to API (fill defaults, coerce types)
  // normalize dates to `YYYY-MM-DDTHH:MM:SS` (use midnight for date-only values)
  const formatPayloadDate = (v, dateOnly = false) => {
    // Always return ISO string, default to today if blank
    if (v === null || v === undefined || v === '') {
      const now = new Date();
      if (dateOnly) {
        // Only date part, midnight
        return now.toISOString().slice(0, 10) + 'T00:00:00.000Z';
      }
      return now.toISOString();
    }
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

  return isAllowed(PageName, 'r') ? (
    <>
    <EntityForm
      title={formTitle}
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialValues}
      extraContent={<ProposalMaterialsTable proposalId={proposalId} editable={!isReadOnly} items={childrenState || []} isAdmin={isAdminView} hideCostColumns={true} onChange={(updated, deleted) => {
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

        // FIX: coerce customerId to a number or null — never an empty string
        const rawCustomerId = values.customerId;
        const resolvedCustomerId =
          rawCustomerId !== undefined && rawCustomerId !== null && rawCustomerId !== ''
            ? Number(rawCustomerId)
            : null;

        const modelPayload = ({
          code: values.code || '',
          name: values.name || '',
          // FIX: always send number or null, never ''
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
          customerReferenceNumber: values.customerReferenceNumber || '',
          margin: Number(values.margin) || 0,
          inquiryId: values.inquiryId || null,
          // compute totals from children only (ignore form-entered totals)
          proposalTotal: Number(totals.proposalTotal) || 0,
          laborCostTotal: Number(totals.laborCostTotal) || 0,
          materialCostTotal: Number(totals.materialCostTotal) || 0,
        });

        if (!proposalId) {
          const payload = {
            // id: 0,
            ...modelPayload,
            children: (childrenState || []).filter((c) => !c || !c.__isScope).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
            deletedChildren: dedupeDeleted((deletedChildrenState || []).filter((c) => !c || !c.__isScope).filter((c) => Number(c.id) !== 0)).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
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
          // id: Number(proposalId),
          ...modelPayload,
          children: (childrenState || []).filter((c) => !c || !c.__isScope).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
          deletedChildren: dedupeDeleted((deletedChildrenState || []).filter((c) => !c || !c.__isScope).filter((c) => Number(c.id) !== 0)).map(({ _localId, __isScope, ...rest }) => sanitizeChild(rest, proposalId ? Number(proposalId) : 0)),
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
  </>) : <InvalidPage />;
}