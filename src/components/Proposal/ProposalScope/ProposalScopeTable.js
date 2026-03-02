'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { FiEdit2, FiEye, FiLayers, FiTrash2 } from 'react-icons/fi';
import Button from '@/components/ui/Button/Button';
import SearchBar from '../../ui/SearchBar/SearchBar';
import DataTable from '../../ui/DataTable/DataTable';
import DropdownAction from '../../ui/DropdownAction/DropdownAction';
import ScopeModal from './ScopeModal';
import ProposalMaterialsModal from '../ProposalMaterials/ProposalMaterialsModal';
import { sampleProposalScopes, sampleProposalMaterials } from '../proposalData';
import styles from './ProposalScopeTable.module.scss';

export default function ProposalScopeTable({ proposalId, proposalNumber, projectName, allowCreateBeforeSave = false, initialScopes = null, initialMaterials = null, onCreateScope, onCreateMaterial, onTotalChange, readOnly = false }) {
  const [scopeSearchTerm, setScopeSearchTerm] = useState('');
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [materialsState, setMaterialsState] = useState([]);
  const [activeScopeForMaterials, setActiveScopeForMaterials] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // maintain local scopes state so new scopes created via modal are shown
  const [scopes, setScopes] = useState([]);

  useEffect(() => {
    if (!proposalId) {
      if (initialScopes) {
        setScopes(initialScopes);
      } else {
        setScopes([]);
      }
      return;
    }
    setScopes(sampleProposalScopes.filter((item) => item.proposalId === proposalId));
  }, [proposalId, initialScopes]);

  const materialsColumns = useMemo(() => {
    const cols = [
      { header: 'Material Code', key: 'materialId' },
      { header: 'Material Name', key: 'assemblyName' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Unit Price', key: 'unitCost', render: (item) => fmt(item.unitCost) },
      { header: 'Total Price', key: 'totalCost', render: (item) => item.isTotalRow ? `Total ${fmt(item.totalCost)}` : fmt(item.totalCost) },
    ];

    if (!readOnly) {
      cols.push({
        header: 'Action',
        key: 'action',
        align: 'right',
        render: (item) => {
          // don't show actions for full-width rows, empty rows or total rows
          if (item.fullRow || item.isTotalRow || String(item.assemblyName).toLowerCase() === 'no materials') return null;

          const items = [
            {
              key: 'edit',
              label: 'Edit',
              icon: <FiEdit2 size={14} />,
              onClick: () => {
                setEditingMaterial(item);
                setActiveScopeForMaterials(item.proposalScopeId);
                setIsMaterialsOpen(true);
              },
            },
            {
              key: 'remove',
              label: 'Remove',
              icon: <FiTrash2 size={14} />,
              onClick: () => {
                // allow parent handler if provided
                if (typeof onRemoveMaterial === 'function') {
                  onRemoveMaterial(item);
                } else {
                  setMaterialsState((prev) => (prev || []).filter((m) => m.id !== item.id));
                }
              },
            },
          ];

          return <DropdownAction item={item} items={items} />;
        }
      });
    }

    return cols;
  }, [readOnly]);

  // number helpers in component scope so they can be reused for footer/total
  function parseNumber(val) {
    if (val === null || val === undefined || val === '') return NaN;
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const num = Number(cleaned);
    return Number.isNaN(num) ? NaN : num;
  }

  function fmt(val) {
    const n = parseNumber(val);
    if (Number.isNaN(n)) return val || '';
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

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
              {!readOnly && (
                <Button variant="outlinePrimary" size='sm' onClick={() => { setActiveScopeForMaterials(scope.id); setIsMaterialsOpen(true); }}>
                  Add Materials
                </Button>
              )}
            </div>
          </div>
        ),
      });

      // Combine materials from sample data, any initialMaterials passed from parent
      // (pre-created before save), and locally added materials state.
      const allMaterials = [ ...(sampleProposalMaterials || []), ...(initialMaterials || []), ...(materialsState || []) ];
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
        // push each material row
        materials.forEach((m) => rows.push(m));
        // compute total for this scope and push a total row
        const scopeTotal = materials.reduce((acc, cm) => {
          const v = Number(cm.totalCost || cm.extendedCost || 0);
          return acc + (Number.isNaN(v) ? 0 : v);
        }, 0);

        rows.push({
          id: `scope-total-${scope.id}`,
          materialId: '',
          assemblyName: '',
          quantity: '',
          unitCost: '',
          totalCost: scopeTotal,
          isTotalRow: true,
        });
      }
    });

    return rows;
  }, [filteredProposalScopes, materialsState, initialMaterials, readOnly]);

  // overall total for all scopes (number)
  const overallTotal = useMemo(() => {
    let total = 0;
    (filteredProposalScopes || []).forEach((scope) => {
      const allMaterials = [ ...(sampleProposalMaterials || []), ...(initialMaterials || []), ...(materialsState || []) ];
      const materials = allMaterials.filter((m) => m.proposalScopeId === scope.id);
      materials.forEach((m) => {
        const v = parseNumber(m.totalCost || m.extendedCost || 0);
        if (!Number.isNaN(v)) total += v;
      });
    });
    return total;
  }, [filteredProposalScopes, materialsState, initialMaterials]);

  // Notify parent of total cost of all materials across scopes for this proposal
  useEffect(() => {
    if (typeof onTotalChange !== 'function') return;
    let total = 0;
    (filteredProposalScopes || []).forEach((scope) => {
      const allMaterials = [ ...(sampleProposalMaterials || []), ...(initialMaterials || []), ...(materialsState || []) ];
      const materials = allMaterials.filter((m) => m.proposalScopeId === scope.id);
      materials.forEach((m) => {
        const v = Number(m.totalCost || m.extendedCost || 0);
        if (!Number.isNaN(v)) total += v;
      });
    });
    try {
      onTotalChange(total);
    } catch (err) {
      // ignore
    }
  }, [filteredProposalScopes, materialsState, initialMaterials, onTotalChange]);

  if (!proposalId && !allowCreateBeforeSave) {
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
          showButton={!readOnly}
          buttonLabel="New Scope of work"
          handleOnClick={() => setIsScopeModalOpen(true)}
          width="320px"
        />
      </div>
        <ScopeModal
          open={isScopeModalOpen}
          onCancel={() => setIsScopeModalOpen(false)}
          onConfirm={({ template, name }) => {
            const newScope = {
              id: `PS-${Date.now()}`,
              createdBy: 'You',
              createdDate: new Date().toISOString().slice(0, 10),
              updatedBy: 'You',
              updatedDate: new Date().toISOString().slice(0, 10),
              code: '',
              name: name || (template === 'none' ? 'New Scope' : `${template} Scope`),
              proposalId: proposalId || '',
              forecastedStartDate: '',
              forecastedEndDate: '',
              actualStartDate: '',
              actualEndDate: '',
              scopeOfWork: name || '',
              percentage: '',
            };
            if (typeof onCreateScope === 'function') {
              onCreateScope(newScope);
            } else {
              setScopes((prev) => [newScope, ...(prev || [])]);
            }
            setIsScopeModalOpen(false);
          }}
        />

        <ProposalMaterialsModal
          open={isMaterialsOpen}
          scopeName={scopes.find((s) => s.id === activeScopeForMaterials)?.name}
          initial={editingMaterial}
          onCancel={() => { setIsMaterialsOpen(false); setActiveScopeForMaterials(null); setEditingMaterial(null); }}
          onConfirm={(m) => {
            // build material object from modal values
            const mat = {
              proposalScopeId: activeScopeForMaterials,
              id: editingMaterial?.id || `PM-${Date.now()}`,
              materialId: m.materialId || m.code || m.id || '',
              assemblyName: m.name || m.assemblyName || '',
              quantity: m.quantity || m.qty || '',
              unitCost: m.unitCost || m.unitPrice || '',
              totalCost: m.totalCost || '',
              remarks: m.remarks || '',
              createdBy: m.createdBy || '',
              createdDate: m.createdDate || '',
            };

            if (editingMaterial) {
              // update existing
              if (typeof onEditMaterial === 'function') {
                onEditMaterial(mat);
              } else {
                setMaterialsState((prev) => (prev || []).map((p) => (p.id === mat.id ? mat : p)));
              }
            } else {
              // add new
              if (typeof onCreateMaterial === 'function') {
                onCreateMaterial(mat);
              } else {
                setMaterialsState((prev) => [mat, ...(prev || [])]);
              }
            }

            setIsMaterialsOpen(false);
            setActiveScopeForMaterials(null);
            setEditingMaterial(null);
          }}
        />


      <DataTable
        columns={materialsColumns}
        data={combinedData}
        showActions={false}
        emptyMessage="No proposal scopes found"
        footer={(
          (() => {
            const totalColIndex = materialsColumns.findIndex((c) => c.key === 'totalCost');
            const actionExists = materialsColumns.some((c) => c.key === 'action');
            const firstColSpan = totalColIndex > 0 ? totalColIndex : Math.max(0, materialsColumns.length - (actionExists ? 2 : 1));

            return (
              <tr>
                <td colSpan={firstColSpan}>All scopes total</td>
                <td>{fmt(overallTotal)}</td>
                {actionExists ? <td></td> : null}
              </tr>
            );
          })()
        )}
      />
    </section>
  );
}
