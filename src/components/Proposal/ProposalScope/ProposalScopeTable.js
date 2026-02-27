'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FiEdit2, FiEye, FiLayers } from 'react-icons/fi';
import Button from '@/components/ui/Button/Button';
import SearchBar from '../../ui/SearchBar/SearchBar';
import DataTable from '../../ui/DataTable/DataTable';
import DropdownAction from '../../ui/DropdownAction/DropdownAction';
import ScopeModal from './ScopeModal';
import ProposalMaterialsModal from '../ProposalMaterials/ProposalMaterialsModal';
import { sampleProposalScopes, sampleProposalMaterials } from '../proposalData';
import styles from './ProposalScopeTable.module.scss';

export default function ProposalScopeTable({ proposalId, proposalNumber, projectName }) {
  const [scopeSearchTerm, setScopeSearchTerm] = useState('');
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [materialsState, setMaterialsState] = useState([]);
  const [activeScopeForMaterials, setActiveScopeForMaterials] = useState(null);

  // maintain local scopes state so new scopes created via modal are shown
  const [scopes, setScopes] = useState([]);

  useEffect(() => {
    if (!proposalId) {
      setScopes([]);
      return;
    }
    setScopes(sampleProposalScopes.filter((item) => item.proposalId === proposalId));
  }, [proposalId]);

  const materialsColumns = useMemo(() => [
    { header: 'Material Code', key: 'materialId' },
    { header: 'Material Name', key: 'assemblyName' },
    { header: 'Quantity', key: 'quantity' },
    { header: 'Unit Price', key: 'unitCost' },
    { header: 'Total Price', key: 'totalCost' },
  ], []);

  const filteredProposalScopes = useMemo(() => {
    const keyword = scopeSearchTerm.trim().toLowerCase();

    if (!keyword) {
      return scopes;
    }

    return scopes.filter((item) =>
      [
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
        item.proposalId,
        item.forecastedStartDate,
        item.forecastedEndDate,
        item.actualStartDate,
        item.actualEndDate,
        item.scopeOfWork,
        item.percentage,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [scopes, scopeSearchTerm]);

  const combinedData = useMemo(() => {
    if (!filteredProposalScopes) return [];

    const rows = [];

    filteredProposalScopes.forEach((scope) => {
      // push a full-width scope row
      rows.push({
        id: `scope-${scope.id}`,
        fullRow: true,
        fullRowContent: (
          <div className={styles.scopeRow}>
            <div className={styles.scopeText}>Scope of work: {scope.scopeOfWork}</div>
            <div style={{ marginLeft: 'auto' }}>
              <Button variant="outlinePrimary" size='sm' onClick={() => { setActiveScopeForMaterials(scope.id); setIsMaterialsOpen(true); }}>
                Add Materials
              </Button>
            </div>
          </div>
        ),
      });

      const allMaterials = [ ...(sampleProposalMaterials || []), ...(materialsState || []) ];
      const materials = allMaterials.filter((m) => m.proposalScopeId === scope.id);

      if (!materials || materials.length === 0) {
        rows.push({
          id: `mat-empty-${scope.id}`,
          materialId: '',
          assemblyName: 'No materials',
          quantity: '',
          unitCost: '',
          totalCost: '',
        });
      } else {
        materials.forEach((m) => rows.push(m));
      }
    });

    return rows;
  }, [filteredProposalScopes, materialsState]);

  if (!proposalId) {
    return null;
  }

  return (
    <section className={styles.scopeSection}>
      <div className={styles.scopeHeaderRow}>
        <h3 className={styles.scopeTitle}>Proposal Details</h3>
        <SearchBar
          placeholder="Search proposal scope"
          value={scopeSearchTerm}
          onChange={setScopeSearchTerm}
          showFilter={false}
          showButton
            buttonLabel="New Scope of work"
            handleOnClick={() => setIsScopeModalOpen(true)}
            width="320px"
          />
      </div>
        <ScopeModal
          open={isScopeModalOpen}
          onCancel={() => setIsScopeModalOpen(false)}
          onConfirm={({ template, name }) => {
            // create a new scope locally and close the modal
            const newScope = {
              id: `PS-${Date.now()}`,
              createdBy: 'You',
              createdDate: new Date().toISOString().slice(0, 10),
              updatedBy: 'You',
              updatedDate: new Date().toISOString().slice(0, 10),
              code: '',
              name: name || (template === 'none' ? 'New Scope' : `${template} Scope`),
              proposalId: proposalId,
              forecastedStartDate: '',
              forecastedEndDate: '',
              actualStartDate: '',
              actualEndDate: '',
              scopeOfWork: name || '',
              percentage: '',
            };
            setScopes((prev) => [newScope, ...(prev || [])]);
            setIsScopeModalOpen(false);
          }}
        />

        <ProposalMaterialsModal
          open={isMaterialsOpen}
          scopeName={scopes.find((s) => s.id === activeScopeForMaterials)?.name}
          onCancel={() => { setIsMaterialsOpen(false); setActiveScopeForMaterials(null); }}
          onConfirm={(m) => {
            // attach to active scope and normalize fields for DataTable
            const newMat = {
              proposalScopeId: activeScopeForMaterials,
              id: `PM-${Date.now()}`,
              materialId: m.materialId || m.code || m.id || '',
              assemblyName: m.name || m.assemblyName || '',
              quantity: m.quantity || m.qty || '',
              unitCost: m.unitCost || m.unitPrice || '',
              totalCost: m.totalCost || '',
              remarks: m.remarks || '',
              createdBy: m.createdBy || '',
              createdDate: m.createdDate || '',
            };
            setMaterialsState((prev) => [newMat, ...(prev || [])]);
            setIsMaterialsOpen(false);
            setActiveScopeForMaterials(null);
          }}
        />


      <DataTable
        columns={materialsColumns}
        data={combinedData}
        showActions={false}
        emptyMessage="No proposal scopes found"
      />
    </section>
  );
}
