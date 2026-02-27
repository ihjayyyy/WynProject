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

  const isReadOnly = useMemo(
    () => Boolean(proposalId && !isEditMode && sampleProposals.some((item) => item.id === proposalId)),
    [proposalId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isEditMode) return 'Edit Proposal';
    return 'View Proposal';
  }, [proposalId, isEditMode]);

  // Header title: show status badge for existing proposals (view/edit),
  // otherwise show the textual form title for new proposals.
  const headerTitle = useMemo(() => {
    if (!proposalId) return formTitle;
    const titleText = initialValues?.projectName || initialValues?.name || initialValues?.proposalNumber || 'Proposal';
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

  

  return (
    <>
      <EntityForm
        title={headerTitle}
        breadcrumbLabel="Proposal Details"
        icon={<FiFileText />}
        fields={fields}
        initialValues={initialValues}
        backPath="/proposal"
        width="100%"
        columns={3}
        showSubmitButton={false}
        readOnly={isReadOnly}
        extraContent={
          proposalId ? (
            <ProposalScopeTable
              proposalId={proposalId}
              proposalNumber={initialValues.proposalNumber}
              projectName={initialValues.projectName}
            />
          ) : null
        }
        headerActions={
          !proposalId ? (
            <Button type="submit" variant="save">
              Create
            </Button>
          ) : (
            <>
              {isReadOnly ? (
                <Button
                  variant="outlinedPrimary"
                  onClick={() => setIsEditModeLocal(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlineDanger"
                    onClick={() => {
                      if (mode === 'edit') {
                        router.push(`/proposal/proposalform?id=${proposalId}`);
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
