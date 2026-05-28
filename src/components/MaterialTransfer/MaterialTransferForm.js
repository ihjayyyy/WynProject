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
  const [childFields, setChildFields] = useState(ItemsFields([], false, false));

  // Dedicated primitives so effects always have the latest values
  const [transferFromType, setTransferFromType] = useState('');
  const [transferFromId, setTransferFromId] = useState(0);
  const [transferToType, setTransferToType] = useState('');
  const [transferToId, setTransferToId] = useState(0);

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
          // Flatten all children across all scopes — deduplicate by materialId
          const seen = new Set();
          res.data.forEach((scope) => {
            (scope.children || []).forEach((child) => {
              const key = child.materialId;
              if (!seen.has(key)) {
                seen.add(key);
                opts.push({
                  value: child.materialId,
                  label: child.name || child.code || String(child.materialId),
                  code: child.code || '',
                  name: child.name || '',
                  uom: child.uom || '',
                  availableQuantity: Number(child.quantity || child.initialQuantity || 0),
                  scopeId: child.scopeId ?? 0,
                });
              }
            });
          });
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

  useEffect(() => {
    const isWarehouseToProject = transferFromType === 'Warehouse' && transferToType === 'Project';
    const isProjectToWarehouse = transferFromType === 'Project' && transferToType === 'Warehouse';
    setChildFields(ItemsFields(materialRequestOptions, isWarehouseToProject, isProjectToWarehouse));
  }, [materialRequestOptions, transferFromType, transferToType]);

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

  const save = async (entity) => {
    const payload = {
      ...formData,
      ...entity,
      children: (formData.children || []).map((child) => {
          const { rackQuantity, ...rest } = child || {};
          return {
            ...rest,
            quantity: Number(child.quantity || 0),
            scopeId: child.scopeId ?? 0,
          };
        }),
      deletedChildren: (formData.deletedChildren || []).map((child) => ({
        ...child,
        scopeId: child.scopeId ?? 0,
      })),
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

  // ── Balance summary panel (shown when Warehouse → Project and options loaded) ─

  const BalanceSummary = () => {
    if (transferFromType !== 'Warehouse' || transferToType !== 'Project') return null;
    if (!materialRequestOptions.length) return null;

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
          Available Balances
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

  return isAllowed(PageName, 'r') ? (
    validForm ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Material Transfer"
        icon={<FiRepeat />}
        fields={formFields}
        initialValues={formData}
        extraContent={
          <div className={EntityStyle.extraContentContainer}>
            <BalanceSummary />
            <DetailsTable
              itemModalHeader="Transfer Items"
              parentId={formId}
              columns={TableColumns}
              editable={isAllowed(PageName, 'w') && !isReadOnly}
              itemFields={childFields}
              data={tableData}
              onChange={detailsUpdated}
            />
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
                onClick={() => {
                  confirmModal.show(
                    'Transfer materials',
                    `Mark transfer "${formData.name || formData.code || ''}" as transferred?`,
                    'Transfer',
                    'primary',
                    () => async () => {
                      setActionLoading(true);
                      const res = await transferMaterialTransfer(Number(formData.id));
                      if (res?.error) toast.error('Failed to mark transfer as transferred');
                      else {
                        toast.success('Transfer marked as transferred');
                        await GetFormData();
                      }
                      setActionLoading(false);
                    }
                  );
                }}
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
  );
}