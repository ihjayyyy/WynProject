'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../../EntityForm/EntityForm';
import Button from '../../ui/Button/Button';
import { sampleProposalScopes } from '../proposalData';

export default function ProposalMaterialsForm() {
  const searchParams = useSearchParams();
  const proposalScopeId = searchParams.get('proposalScopeId') || '';
  const selectedProposalScope = sampleProposalScopes.find((item) => item.id === proposalScopeId);

  const initialFormState = {
    proposalScopeId,
    remarks: '',
    assemblyUOM: '',
    assemblyId: '',
    assemblyName: '',
    extendedCost: '',
    materialId: '',
    materialType: '',
    uom: '',
    unitCost: '',
    quantity: '',
    vat: '',
    wt: '',
    totalCost: '',
    margin: '',
    scopeOfWork: '',
    id: '',
    createdBy: '',
    createdDate: '',
    updatedBy: '',
    updatedDate: '',
    code: '',
    name: '',
  };

  const fields = [
    { name: 'proposalScopeId', label: 'ProposalScopeId', readOnly: !!proposalScopeId },
    { name: 'remarks', label: 'Remarks' },
    { name: 'assemblyUOM', label: 'AssemblyUOM' },
    { name: 'assemblyId', label: 'AssemblyId' },
    { name: 'assemblyName', label: 'AssemblyName' },
    { name: 'extendedCost', label: 'ExtendedCost', type: 'number' },
    { name: 'materialId', label: 'MaterialId' },
    {
      name: 'materialType',
      label: 'MaterialType',
      type: 'select',
      options: [
        { label: 'Material', value: 'material' },
        { label: 'Tool', value: 'tool' },
      ],
    },
    { name: 'uom', label: 'UOM' },
    { name: 'unitCost', label: 'UnitCost', type: 'number' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'vat', label: 'VAT' },
    { name: 'wt', label: 'WT' },
    { name: 'totalCost', label: 'TotalCost', type: 'number' },
    { name: 'margin', label: 'Margin' },
    { name: 'scopeOfWork', label: 'ScopeOfWork', multiline: true, rows: 3, span: 'span8' },
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'CreatedBy' },
    { name: 'createdDate', label: 'CreatedDate', type: 'date' },
    { name: 'updatedBy', label: 'UpdatedBy' },
    { name: 'updatedDate', label: 'UpdatedDate', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
  ];

  return (
    <EntityForm
      title="Proposal Materials Form"
      breadcrumbItems={[
        {
          label: 'ProposalScope Details',
          href: proposalScopeId ? `/proposal/proposalscopeform?id=${proposalScopeId}` : '/proposal',
        },
        {
          label: 'Proposal Materials',
          href: proposalScopeId
            ? `/proposal/proposalmaterials?proposalScopeId=${proposalScopeId}`
            : '/proposal/proposalmaterials',
        },
        { label: 'Proposal Materials Details' },
      ]}
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialFormState}
      backPath={
        proposalScopeId
          ? `/proposal/proposalmaterials?proposalScopeId=${proposalScopeId}`
          : selectedProposalScope?.proposalId
            ? `/proposal/proposalform?id=${selectedProposalScope.proposalId}`
            : '/proposal'
      }
      width="100%"
      columns={3}
      showSubmitButton={false}
      headerActions={
        <Button type="submit" variant="save">
          Create
        </Button>
      }
    />
  );
}
