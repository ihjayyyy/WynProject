'use client';

import React, { useMemo, useState, useEffect, useRef, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiPrinter, FiRepeat, FiSend } from 'react-icons/fi';
import {
  FormFields,
  TableColumns,
  ItemsFields,
  INITIAL_MATERIAL_TRANSFER,
} from './MaterialTransferModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import EntityStyle from '../EntityForm/EntityContainer.module.scss';
import Button from '../ui/Button/Button';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Input from '../ui/Input/Input';
import { getWarehouses } from '@/services/Warehouse';
import { getProjects } from '@/services/Project';
import { printMaterialRequests_byProject } from '@/services/MaterialRequest';
import { getByProjectId } from '@/services/ProjectScope';
import { getMaterialTransfer, createMaterialTransfer, updateMaterialTransfer, transferMaterialTransfer, printMaterialTransfer_byId } from '@/services/MaterialTransfer';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

const toDateInputValue = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Collapses items that share the same materialId into a single row, summing
 * quantity across them. Used only for the read-only / non-editable table
 * display — the underlying raw items (one per scanned barcode) are always
 * what's actually saved and what the edit/add-item flow operates on.
 *
 * Each merged row keeps the first underlying item's fields (name, uom, etc.)
 * and is flagged with `_merged: true` when it represents more than one
 * source item, so TableColumns can adjust how it renders the material cell.
 */
const groupItemsByMaterial = (items = []) => {
  const map = new Map();
  (items || []).forEach((it) => {
    const key = it.materialId ?? it.code;
    if (!map.has(key)) {
      map.set(key, { ...it, quantity: 0, _sourceIds: [] });
    }
    const entry = map.get(key);
    entry.quantity += Number(it.quantity) || 0;
    entry._sourceIds.push(it.id);
  });
  return Array.from(map.values()).map((r) => ({ ...r, _merged: r._sourceIds.length > 1 }));
};

export default function MaterialTransferForm() {
  const PageName = 'Inventory.MaterialTransfer';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const searchParams = useSearchParams();

  const initialId = Number(searchParams.get('id') || 0);
  const initialMode = searchParams.get('mode') || (initialId ? 'view' : 'edit');
  const backPath = '/inventory/materialtransfer';

  const [formId, setFormId] = useState(initialId);
  const [mode, setMode] = useState(initialMode);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materialRequestOptions, setMaterialRequestOptions] = useState([]);
  // balanceMap: { [materialId]: number } — total balance across all requests for that material
  const [balanceMap, setBalanceMap] = useState({});
  const [formData, setForm] = useState({});
  const [validForm, setValidForm] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [childFields, setChildFields] = useState(ItemsFields([], false, false, []));
  const [tableError, setTableError] = useState('');

  // Dedicated primitives so effects always have the latest values
  const [transferFromType, setTransferFromType] = useState('');
  const [transferFromId, setTransferFromId] = useState(0);
  const [transferToType, setTransferToType] = useState('');
  const [transferToId, setTransferToId] = useState(0);

  // ── Transfer modal (mark-as-transferred), same approach as the landing page ──
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferRows, setTransferRows] = useState([]);

  // ── Stable onFormChange via ref ──────────────────────────────────────────────
  const onFormChangeRef = useRef(null);
  onFormChangeRef.current = (fieldname, value, updatedValues) => {
    if (fieldname === 'transferFromType') {
      setTransferFromType(value);
      setTransferFromId(Number(updatedValues?.transferFrom) || 0);
      setTransferToType(updatedValues?.transferToType || '');
      setTransferToId(Number(updatedValues?.transferTo) || 0);
    }
    if (fieldname === 'transferFrom') {
      setTransferFromId(Number(value) || 0);
    }
    if (fieldname === 'transferToType') {
      setTransferToType(value);
      setTransferToId(Number(updatedValues?.transferTo) || 0);
    }
    if (fieldname === 'transferTo') {
      setTransferToId(Number(value) || 0);
    }
  };

  const stableOnFormChange = useRef((fieldname, value, updatedValues) => {
    onFormChangeRef.current?.(fieldname, value, updatedValues);
  }).current;

  // ── Load reference data ──────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAll = async () => {
      const [wRes, pRes] = await Promise.all([
        getWarehouses(),
        getProjects(),
      ]);
      if (wRes && !wRes.error) setWarehouses(wRes.data);
      if (pRes && !pRes.error) setProjects(pRes.data);
    };
    fetchAll();
  }, []);

  // ── Sync URL params ──────────────────────────────────────────────────────────

  useEffect(() => {
    const nextId = Number(searchParams.get('id') || 0);
    const nextMode = searchParams.get('mode') || (nextId ? 'view' : 'edit');
    setFormId(nextId);
    setMode(nextMode);
  }, [searchParams]);

  // ── Load form data ───────────────────────────────────────────────────────────

  const GetFormData = async () => {
    let initData = { ...INITIAL_MATERIAL_TRANSFER };

    if (formId !== 0) {
      const res = await getMaterialTransfer(formId);
      initData = res.data;
      if (initData.date) initData.date = toDateInputValue(initData.date);
    } else {
      setMode('new');
      initData.date = toDateInputValue(null);
    }

    setForm(initData);
    setValidForm(Object.keys(initData).length > 0);
    setTableData({
      items: initData.children || [],
      deletedItems: initData.deletedChildren || [],
    });

    // Seed dedicated tracking state from the loaded record
    setTransferFromType(initData.transferFromType || '');
    setTransferFromId(Number(initData.transferFrom) || 0);
    setTransferToType(initData.transferToType || '');
    setTransferToId(Number(initData.transferTo) || 0);
  };

  useEffect(() => {
    GetFormData();
  }, [formId]);

  // ── Fetch material options based on transfer direction ───────────────────────

  useEffect(() => {
    let mounted = true;

    const isWarehouseToProject = transferFromType === 'Warehouse' && transferToType === 'Project';
    const isProjectToWarehouse = transferFromType === 'Project' && transferToType === 'Warehouse';

    const shouldFetch =
      (isWarehouseToProject && transferToId) ||
      (isProjectToWarehouse && transferFromId);

    if (!shouldFetch) {
      setMaterialRequestOptions([]);
      setBalanceMap({});
      return;
    }

    (async () => {
      let opts = [];
      let newBalanceMap = {};

      if (isWarehouseToProject && transferToId) {
        const res = await printMaterialRequests_byProject(transferToId);
        if (!mounted) return;
        if (!res?.error && Array.isArray(res.data)) {
          // Deduplicate by materialId — sum up balance across all requests
          const byMaterialId = {};
          res.data.forEach((r) => {
            const mid = r.materialId ?? r.id;
            if (!byMaterialId[mid]) {
              byMaterialId[mid] = {
                value: mid,
                label: r.name || r.code || String(mid),
                code: r.code || '',
                name: r.name || '',
                uom: r.uom || r.purchaseUnitOfMeasure || r.unitOfMeasure || '',
                scopeId: r.scopeId ?? 0,
                totalBalance: 0,
              };
            }
            byMaterialId[mid].totalBalance += Number(r.balance) || 0;
          });

          opts = Object.values(byMaterialId);
          opts.forEach((o) => { newBalanceMap[o.value] = o.totalBalance; });
        }
      } else if (isProjectToWarehouse && transferFromId) {
        const res = await getByProjectId(transferFromId);
        if (!mounted) return;
        if (!res?.error && Array.isArray(res.data)) {
          // Sum available quantity per materialId across all scopes
          const byMaterialId = {};
          res.data.forEach((scope) => {
            (scope.children || []).forEach((child) => {
              const mid = child.materialId;
              if (!byMaterialId[mid]) {
                byMaterialId[mid] = {
                  value: mid,
                  label: child.name || child.code || String(mid),
                  code: child.code || '',
                  name: child.name || '',
                  uom: child.uom || '',
                  scopeId: child.scopeId ?? 0,
                  availableQuantity: 0,
                };
              }
              byMaterialId[mid].availableQuantity += Number(child.quantity || child.initialQuantity || 0);
            });
          });

          opts = Object.values(byMaterialId);
          opts.forEach((o) => { newBalanceMap[o.value] = o.availableQuantity; });
        }
      }

        if (mounted) {
          setMaterialRequestOptions(opts);
          setBalanceMap(newBalanceMap);
        }
    })();

    return () => { mounted = false; };
  }, [transferFromType, transferFromId, transferToType, transferToId]);

  // ── Rebuild child fields ─────────────────────────────────────────────────────
  // Also depends on tableData.items so the barcode "already used" check
  // inside ItemsFields always sees the current list of items in this transfer.

  useEffect(() => {
    const isWarehouseToProject = transferFromType === 'Warehouse' && transferToType === 'Project';
    const isProjectToWarehouse = transferFromType === 'Project' && transferToType === 'Warehouse';
    setChildFields(ItemsFields(materialRequestOptions, isWarehouseToProject, isProjectToWarehouse, tableData.items));
  }, [materialRequestOptions, transferFromType, transferToType, tableData.items]);

  // ── Form fields ──────────────────────────────────────────────────────────────

  const formFields = useMemo(
    () => FormFields(warehouses, projects, stableOnFormChange),
    [warehouses, projects]
  );

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isReadOnly = useMemo(() => {
    if (validForm) return mode === 'view';
    return true;
  }, [validForm, mode]);

  const isEditable = isAllowed(PageName, 'w') && !isReadOnly;

  // Merge same-material rows for display when the table isn't editable
  // (view mode). While editable, the raw per-barcode items are shown so
  // add/edit/remove and remarks-per-barcode keep working as before.
  const displayTableData = useMemo(() => {
    if (isEditable) return tableData;
    return {
      items: groupItemsByMaterial(tableData.items),
      deletedItems: tableData.deletedItems,
    };
  }, [tableData, isEditable]);

  const formTitle = useMemo(() => {
    const title = formData?.name || 'New Material Transfer';
    return (
      <div className={EntityStyle.formTitle}>
        <span style={{ marginRight: '8px' }}>{title}</span>
        {formData.status && (
          <StatusBadge status={formData.status} />
        )}
      </div>
    );
  }, [formData]);

  const detailsUpdated = (items, deletedItems) => {
    setForm((prev) => ({
      ...prev,
      children: items,
      deletedChildren: deletedItems,
    }));
    setTableData({ items, deletedItems });
    if (Array.isArray(items) && items.length > 0) setTableError('');
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSaveConfirm = (entity) => {
    confirmModal.show(
      'Save Material Transfer',
      'Are you sure you want to save this transfer?',
      'Save',
      'primary',
      () => async () => await save(entity)
    );
  };

  // Item form carries UI-only helper fields (rackDisplay, barcodeMessage)
  // used purely for display — map explicitly to the transfer-item schema
  // instead of spreading, so nothing extra ever leaks into the request and
  // nothing schema-required gets missed.
  const mapChildForSave = (child) => ({
    id: child?.id ?? 0,
    parentId: child?.parentId ?? 0,
    materialId: child?.materialId,
    name: child?.name || '',
    code: child?.code || '',
    quantity: Number(child?.quantity || 0),
    uom: child?.uom || '',
    remarks: child?.remarks || '',
    rackId: child?.rackId || 0,
  });

  const save = async (entity) => {
    const payload = {
      ...formData,
      ...entity,
      children: (formData.children || []).map(mapChildForSave),
      deletedChildren: (formData.deletedChildren || []).map(mapChildForSave),
    };
    payload.id = payload.id ?? 0;

    const res =
      payload.id === 0
        ? await createMaterialTransfer(payload)
        : await updateMaterialTransfer(payload.id, payload);

    if (res?.error) {
      toast.error('Failed to save material transfer.');
    } else {
      toast.success('Material transfer has been saved.');
      router.push(backPath);
    }
  };

  // ── Cancel edit ──────────────────────────────────────────────────────────────

  const handleCancelEditConfirm = () => {
    confirmModal.show(
      'Cancel Edit',
      'Are you sure you want to cancel editing?',
      'Cancel Edit',
      'danger',
      () => () => setMode('view')
    );
  };

  // ── Mark as transferred (same remarks-per-item modal used on the landing page) ─
  // Always operates on the raw per-barcode items (tableData.items), never the
  // merged display view, since each barcode needs its own remarks/receipt.

  const openTransferModal = () => {
    const items = tableData.items || formData.children || [];
    const rows = items.map((child) => ({
      transferDetailId: child.id,
      materialName: child.name,
      code: child.code,
      quantity: child.quantity,
      uom: child.uom,
      remarks: child.remarks || '',
    }));
    setTransferRows(rows);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTransferRows([]);
  };

  const handleRowRemarksChange = (index, value) => {
    setTransferRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, remarks: value } : row))
    );
  };

  const applyTransfer = async () => {
    if (actionLoading) return;
    if (!formData?.id) {
      toast.error('No transfer selected.');
      return;
    }
    if (transferRows.length === 0) {
      toast.error('No items to transfer.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        details: transferRows.map(({ transferDetailId, remarks }) => ({
          transferDetailId,
          remarks,
        })),
      };
      const res = await transferMaterialTransfer(Number(formData.id), payload);
      if (res?.error) throw new Error(res.error);
      toast.success('Transfer marked as transferred.');
      closeTransferModal();
      await GetFormData();
    } catch (error) {
      toast.error('Failed to mark transfer as transferred');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Buttons ──────────────────────────────────────────────────────────────────

  const CreateButton = () =>
    isAllowed(PageName, 'w') && !formId ? (
      <Button type="submit" variant="save">Save</Button>
    ) : null;

  const ViewButton = () =>
    isAllowed(PageName, 'w') && formId && mode === 'view' ? (
      <div className={EntityStyle.buttonsContainer}>
        {formData?.status?.toLowerCase() === 'draft' && (
          <Button onClick={() => setMode('edit')} variant="save">Edit</Button>
        )}
      </div>
    ) : null;

  const CRUDButton = () =>
    isAllowed(PageName, 'w') && formId && mode === 'edit' ? (
      <div className={EntityStyle.buttonsContainer}>
        <Button variant="outlineDanger" onClick={handleCancelEditConfirm}>Cancel</Button>
        <Button type="submit" variant="save">Save</Button>
      </div>
    ) : null;

  const PrintButton = () => {
    var lbl = (transferFromType === 'Warehouse' && transferToType === 'Project') ? "Print MRT" :
                      (transferFromType === 'Project' && transferToType === 'Warehouse') ? "Print RIV" :
                      "Print Document"; 

    return isAllowed(PageName, 'r') && isReadOnly && formId ? 
    <>
    <Button variant="primary" icon={<FiPrinter size={14} />} /*disabled={actionLoading}*/ onClick={async () => {
      // setActionLoading(true);
      await printMaterialTransfer_byId(formId);
      // setActionLoading(false);
      }}>{lbl}</Button>
    </>
    : null
    }

  // ── Balance summary panel (shown when Warehouse ⇄ Project and options loaded) ─

  const BalanceSummary = () => {
    const isWarehouseToProject = transferFromType === 'Warehouse' && transferToType === 'Project';
    const isProjectToWarehouse = transferFromType === 'Project' && transferToType === 'Warehouse';
    if (!isWarehouseToProject && !isProjectToWarehouse) return null;
    if (!materialRequestOptions.length) return null;

    const heading = isWarehouseToProject ? 'Available Balances' : 'Available Stock';

    return (
      <div style={{
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'var(--color-surface, #f8f9fa)',
        border: '1px solid var(--color-border, #e2e8f0)',
        borderRadius: '8px',
      }}>
        <p style={{
          margin: '0 0 10px 0',
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--color-text-secondary, #64748b)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {heading}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {materialRequestOptions.map((opt) => (
            <div key={opt.value} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
            }}>
              <span style={{ color: 'var(--color-text, #1e293b)' }}>
                {opt.code ? `${opt.code} - ${opt.name}` : opt.name}
              </span>
              <span style={{
                fontWeight: 600,
                color: (balanceMap[opt.value] || 0) > 0
                  ? 'var(--color-success, #16a34a)'
                  : 'var(--color-danger, #dc2626)',
                minWidth: '60px',
                textAlign: 'right',
              }}>
                {balanceMap[opt.value] ?? 0} {opt.uom}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {isAllowed(PageName, 'r') ? (
        validForm ? (
          <EntityForm
            title={formTitle}
            breadcrumbLabel="Material Transfer"
            icon={<FiRepeat />}
            fields={formFields}
              onValidate={async (values) => {
                const errors = {};
                if (!tableData.items || (Array.isArray(tableData.items) && tableData.items.length === 0)) {
                  errors.transferFrom = 'At least one transfer item is required';
                  setTableError(errors.transferFrom);
                } else {
                  setTableError('');
                }
                return errors;
              }}
              initialValues={formData}
            extraContent={
              <div className={EntityStyle.extraContentContainer}>
                <BalanceSummary />
                <DetailsTable
                  itemModalHeader="Transfer Items"
                  parentId={formId}
                  columns={TableColumns}
                  editable={isEditable}
                  itemFields={childFields}
                  data={displayTableData}
                  onChange={detailsUpdated}
                />
                  {tableError ? <div style={{ color: 'red', marginTop: 8 }}>{tableError}</div> : null}
              </div>
            }
            onSubmit={handleSaveConfirm}
            backPath={backPath}
            width="100%"
            showSubmitButton={false}
            readOnly={isReadOnly}
            headerActions={
              <div className={EntityStyle.buttonsContainer}>
                <CreateButton />
                <ViewButton />
                <CRUDButton />
                <PrintButton />
                {isAllowed(PageName, 'w') && formData?.id && String(formData?.status || '').toLowerCase() === 'draft' && (
                  <Button
                    variant="primary"
                    disabled={actionLoading}
                    onClick={openTransferModal}
                  >
                    <FiSend size={14} style={{ marginRight: 6 }} />Transfer
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <InvalidPage message="Material Transfer not found." />
        )
      ) : (
        <InvalidPage />
      )}

      <ConfirmModal
        open={isTransferModalOpen}
        title="Transfer materials?"
        message={`Mark transfer "${formData?.name || formData?.code || ''}" as transferred? Review remarks for each item below.`}
        confirmText={actionLoading ? 'Transferring...' : 'Confirm Transfer'}
        confirmVariant="primary"
        onConfirm={applyTransfer}
        onCancel={closeTransferModal}
      >
        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Material</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Qty</th>
                <th style={{ padding: '6px 8px', color: '#64748b' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {transferRows.map((row, index) => (
                <tr key={row.transferDetailId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500 }}>{row.materialName}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{row.code}</div>
                  </td>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    {row.quantity} {row.uom}
                  </td>
                  <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    <Input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => handleRowRemarksChange(index, e.target.value)}
                      placeholder="Add remarks"
                      disabled={actionLoading}
                    />
                  </td>
                </tr>
              ))}
              {transferRows.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>
                    No items to transfer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ConfirmModal>
    </>
  );
}