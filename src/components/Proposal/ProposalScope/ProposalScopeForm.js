'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../../EntityForm/EntityForm';
import Button from '../../ui/Button/Button';
import { initialProposalScopeFormState, sampleProposalScopes } from '../proposalData';

export default function ProposalScopeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalScopeId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';
  const proposalIdFromQuery = searchParams.get('proposalId');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isCurrentEditMode = isEditMode || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!proposalScopeId) {
      return {
        ...initialProposalScopeFormState,
        proposalId: proposalIdFromQuery || '',
      };
    }

    const selectedScope = sampleProposalScopes.find((item) => item.id === proposalScopeId);
    return selectedScope || initialProposalScopeFormState;
  }, [proposalScopeId, proposalIdFromQuery]);

  const isReadOnly = useMemo(
    () =>
      Boolean(
        proposalScopeId &&
          !isCurrentEditMode &&
          sampleProposalScopes.some((item) => item.id === proposalScopeId)
      ),
    [proposalScopeId, isCurrentEditMode]
  );

  const formTitle = useMemo(() => {
    if (!proposalScopeId) return 'ProposalScope Form';
    if (isCurrentEditMode) return 'Edit ProposalScope';
    return 'View ProposalScope';
  }, [proposalScopeId, isCurrentEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'CreatedBy' },
    { name: 'createdDate', label: 'CreatedDate', type: 'date' },
    { name: 'updatedBy', label: 'UpdatedBy' },
    { name: 'updatedDate', label: 'UpdatedDate', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'proposalId', label: 'ProposalId' },
    { name: 'forecastedStartDate', label: 'ForecastedStartDate', type: 'date' },
    { name: 'forecastedEndDate', label: 'ForecastedEndDate', type: 'date' },
    { name: 'actualStartDate', label: 'ActualStartDate', type: 'date' },
    { name: 'actualEndDate', label: 'ActualEndDate', type: 'date' },
    { name: 'scopeOfWork', label: 'ScopeOfWork', multiline: true, rows: 4, span: 'span8' },
    { name: 'percentage', label: 'Percentage', type: 'number' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiFileText />}
      breadcrumbItems={[
        {
          label: 'Proposal Details',
          href: initialValues.proposalId ? `/proposal/proposalform?id=${initialValues.proposalId}` : '/proposal',
        },
        { label: 'Proposal Scope Details' },
      ]}
      fields={fields}
      initialValues={initialValues}
      backPath={initialValues.proposalId ? `/proposal/proposalform?id=${initialValues.proposalId}` : '/proposal'}
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !proposalScopeId ? (
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
                      router.push(`/proposal/proposalscopeform?id=${proposalScopeId}`);
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
