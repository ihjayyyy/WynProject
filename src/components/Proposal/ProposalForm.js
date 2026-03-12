'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import {
  initialProposalFormState,
  sampleProposals,
} from './proposalData';
import { sampleCustomers } from '../Customers/customersData';
import ProposalScopeTable from './ProposalScope/ProposalScopeTable';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

export default function ProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const inquiryIdFromQuery = searchParams.get('inquiryId');

  const initialValues = useMemo(() => {
    if (!proposalId) {
      return {
        ...initialProposalFormState,
        inquiryId: inquiryIdFromQuery || '',
      };
    }

    const selectedProposal = sampleProposals.find((item) => item.id === proposalId);
    return selectedProposal || initialProposalFormState;
  }, [proposalId, inquiryIdFromQuery]);

  const customerOptions = useMemo(() => {
    return (sampleCustomers || []).map((c) => ({
      value: c.id,
      label: c.customerName || c.name || c.companyName || c.id,
    }));
  }, []);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(proposalId && sampleProposals.some((item) => item.id === proposalId));
    const statusRaw = String(initialValues?.status || '').toLowerCase();
    const normalizedStatus = statusRaw.replace(/\s+/g, '');
    const isLockedStatus = normalizedStatus === 'approved' || normalizedStatus === 'forapproval';
    const canEdit = exists && !isLockedStatus;
    const readOnly = exists && (isLockedStatus || !isEditMode);
    return { isReadOnly: readOnly, canEnterEditMode: canEdit };
  }, [proposalId, isEditMode, initialValues]);

  // Hold temporary scopes/materials created before the proposal is saved.
  const [preCreateScopes, setPreCreateScopes] = useState([]);
  const [preCreateMaterials, setPreCreateMaterials] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [proposalTotal, setProposalTotal] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // keep proposalTotal in sync when initialValues change (e.g., loading existing proposal)
  React.useEffect(() => {
    setProposalTotal(Number(initialValues?.proposalTotal || 0));
  }, [initialValues]);

  // Handle create / save for proposals. When creating, add to sampleProposals
  // and return the new URL so EntityForm will redirect to it and show scopes/materials.
  const handleProposalSubmit = async (values) => {
    // create new proposal
    if (!proposalId) {
      const now = Date.now();
      const newId = `PROP-${now}`;
      const newProposalNumber = `PRP-${now}`;
      const newProposal = {
        ...initialProposalFormState,
        ...values,
        id: newId,
        proposalNumber: newProposalNumber,
        status: 'Draft',
        createdBy: 'You',
        createdDate: new Date().toISOString().slice(0, 10),
      };
      try {
        newProposal.proposalTotal = String(values.proposalTotal || proposalTotal || '');
        (sampleProposals || []).unshift(newProposal);

        // attach any pre-created scopes to the new proposal
        try {
          const { sampleProposalScopes, sampleProposalMaterials } = await import('./proposalData');
          (preCreateScopes || []).forEach((s) => {
            const scope = { ...s, proposalId: newId };
            (sampleProposalScopes || []).unshift(scope);
          });
          (preCreateMaterials || []).forEach((m) => {
            const mat = { ...m };
            (sampleProposalMaterials || []).unshift(mat);
          });
        } catch (err) {
          // module import may not allow mutation in some bundlers; fallback to best-effort
        }

        // clear temporary states
        setPreCreateScopes([]);
        setPreCreateMaterials([]);
      } catch (err) {
        console.warn('Failed to push to sampleProposals', err);
      }
      return `/projects/proposal/proposalform?id=${newId}`;
    }

    // update existing
    try {
      const idx = (sampleProposals || []).findIndex((p) => p.id === proposalId);
      if (idx >= 0) {
        sampleProposals[idx] = {
          ...sampleProposals[idx],
          ...values,
          proposalTotal: String(values.proposalTotal || proposalTotal || sampleProposals[idx].proposalTotal || ''),
          updatedBy: 'You',
          updatedDate: new Date().toISOString().slice(0, 10),
        };
      }
    } catch (err) {
      console.warn('Failed to update sampleProposals', err);
    }
    return `/projects/proposal/proposalform?id=${proposalId}`;
  };

  const handleSubmitForApproval = async () => {
    if (!proposalId) return;
    try {
      const idx = (sampleProposals || []).findIndex((p) => p.id === proposalId);
      if (idx >= 0) {
        sampleProposals[idx] = {
          ...sampleProposals[idx],
          status: 'forApproval',
          updatedBy: 'You',
          updatedDate: new Date().toISOString().slice(0, 10),
        };
      }
    } catch (err) {
      console.warn('Failed to set status for approval', err);
    }
    // redirect to landing after submitting for approval
    router.push('/projects/proposal');
  };

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isEditMode) return 'Edit Proposal';
    return 'View Proposal';
  }, [proposalId, isEditMode]);

  // Header title: show status badge for existing proposals (view/edit),
  // otherwise show the textual form title for new proposals.
  const headerTitle = useMemo(() => {
    if (!proposalId) return formTitle;
    // For existing proposals (view or edit) show the proposal number next to the status.
    const titleText = initialValues?.proposalNumber || initialValues?.projectName || initialValues?.name || 'Proposal';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{titleText}</span>
        <StatusBadge status={initialValues?.status} />
      </span>
    );
  }, [proposalId, formTitle, initialValues]);

  // Arrange fields so customer + contact info render in the left column
  // and place Inquiry ID + Proposal Date in the right column.
  

  const fields = [
    { name: 'projectName', label: 'Proposal Name', span: 'span3' },

    // Row: Customer (left), empty (middle), Inquiry ID (right)
    {
      name: 'customerId',
      label: 'Customer',
      type: 'select',
      options: customerOptions,
      searchable: true,
      span: 'span1',
      onChange: (value, allValues, setValues) => {
        const cust = (sampleCustomers || []).find((c) => c.id === value);
        if (!cust) return;
        setValues((prev) => ({
          ...prev,
          customerId: value,
          customerName: cust.customerName || cust.name || '',
          contactNumber: cust.contactNumber || '',
          email: cust.email || '',
          address: cust.address || '',
        }));
      },
    },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'inquiryId', label: 'Inquiry Number (Optional)', span: 'span1' },

    // Row: Contact Person (left), empty (middle), Proposal Date (right)
    { name: 'name', label: 'Contact Person', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'createdDate', label: 'Proposal Date', type: 'date', span: 'span1' },

    // Row: Phone (left), two empty cols
    { name: 'contactNumber', label: 'Phone Number', type: 'tel', span: 'span1' },
    { name: 'spacer-5', type: 'spacer', span: 'span1' },
    { name: 'spacer-6', type: 'spacer', span: 'span1' },

    // Row: Email (left), two empty cols
    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'spacer-7', type: 'spacer', span: 'span1' },
    { name: 'spacer-8', type: 'spacer', span: 'span1' },

    // address on its own row
    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 3 },
  ];

  

  const mergedInitialValues = React.useMemo(() => ({ ...initialValues, proposalTotal: String(proposalTotal || initialValues?.proposalTotal || '') }), [initialValues, proposalTotal]);

  return (
    <>
      <ConfirmModal
        open={isSubmitModalOpen}
        title="Submit Proposal for Approval"
        message="Are you sure you want to submit this proposal for approval?"
        confirmText="Submit"
        cancelText="Cancel"
        confirmVariant="primary"
        onCancel={() => setIsSubmitModalOpen(false)}
        onConfirm={() => {
          setIsSubmitModalOpen(false);
          handleSubmitForApproval();
        }}
      />
      <EntityForm
        title={headerTitle}
        breadcrumbLabel="Proposal Details"
        icon={<FiFileText />}
        fields={fields}
        initialValues={mergedInitialValues}
        backPath="/projects/proposal"
        onSubmit={handleProposalSubmit}
        width="100%"
        columns={3}
        showSubmitButton={false}
        readOnly={isReadOnly}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        allowCollapse
        extraContent={
          <ProposalScopeTable
            proposalId={proposalId}
            proposalNumber={initialValues.proposalNumber}
            projectName={initialValues.projectName}
            allowCreateBeforeSave={!proposalId}
            initialScopes={preCreateScopes}
            initialMaterials={preCreateMaterials}
            onCreateScope={(s) => {
              setPreCreateScopes((prev) => [s, ...(prev || [])]);
              setCollapsed(true);
            }}
            onCreateMaterial={(m) => {
              setPreCreateMaterials((prev) => [m, ...(prev || [])]);
              setCollapsed(true);
            }}
            onTotalChange={(t) => setProposalTotal(Number(t || 0))}
            readOnly={isReadOnly}
          />
        }
        headerActions={
          !proposalId ? (
            <Button type="submit" variant="save">
              Create
            </Button>
          ) : (
            <>
              {isReadOnly ? (
                // show Edit only if the proposal can enter edit mode (not locked by status)
                canEnterEditMode ? (
                  <>
                    <Button
                      variant="outlinedPrimary"
                      onClick={() => setIsEditModeLocal(true)}>
                      Edit
                    </Button>
                    {String(initialValues?.status || '').toLowerCase().replace(/\s+/g, '') === 'draft' && (
                      <Button
                        variant="primary"
                        onClick={() => setIsSubmitModalOpen(true)}
                        style={{ marginLeft: '0.5rem' }}>
                        Submit for Approval
                      </Button>
                    )}
                  </>
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
                  <Button type="submit" variant="save">
                    Save
                  </Button>
                </>
              )}
            </>
          )
        }
      />
    </>
  );
}
