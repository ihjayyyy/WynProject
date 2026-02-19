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
import ProposalScopeTable from './ProposalScope/ProposalScopeTable';

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

  const isReadOnly = useMemo(
    () => Boolean(proposalId && !isEditMode && sampleProposals.some((item) => item.id === proposalId)),
    [proposalId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!proposalId) return 'Proposal Form';
    if (isEditMode) return 'Edit Proposal';
    return 'View Proposal';
  }, [proposalId, isEditMode]);

  const fields = [
    { name: 'inquiryId', label: 'Inquiry Id (Optional)' },
    { name: 'proposalNumber', label: 'Proposal Number' },
    { name: 'proposalTotal', label: 'Proposal Total', type: 'number' },
    { name: 'location', label: 'Location' },
    { name: 'projectName', label: 'Project Name' },
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'customerName', label: 'Customer Name' },
    { name: 'contactNumber', label: 'Contact Number', type: 'tel' },
    { name: 'address', label: 'Address' },
    { name: 'companyName', label: 'Company Name' },
    { name: 'email', label: 'Email', type: 'email' },
  ];

  return (
    <EntityForm
      title={formTitle}
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
  );
}
