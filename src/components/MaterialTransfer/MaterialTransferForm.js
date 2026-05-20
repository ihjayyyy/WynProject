'use client';

import React, { useMemo, useState, useEffect, useRef, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiRepeat, FiSend } from 'react-icons/fi';
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
import { getMaterialRequestsByProjectId } from '@/services/MaterialRequest';
import { getMaterialTransfer, createMaterialTransfer, updateMaterialTransfer, transferMaterialTransfer } from '@/services/MaterialTransfer';
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
  const [formData, setForm] = useState({});
  const [validForm, setValidForm] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [childFields, setChildFields] = useState(ItemsFields([]));

  // Dedicated primitives so effects always have the latest values
  const [transferFromType, setTransferFromType] = useState('');
  const [transferFromId, setTransferFromId] = useState(0);
  const [transferToType, setTransferToType] = useState('');
  const [transferToId, setTransferToId] = useState(0);

  // ── Stable onFormChange via ref ──────────────────────────────────────────────
  // Prevents stale closure inside the memoized formFields

  const onFormChangeRef = useRef(null);
  // Accept the optional `updatedValues` param so we can read the
  // freshly-applied form values (provided by FormFields) and keep
  // the dedicated tracking state in sync instead of clearing it.
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

  // ── Fetch material requests when either side is a project ───────────────────

  useEffect(() => {
    let mounted = true;

    // Determine which side (if any) is a project, and use that ID
    const projectId =
      transferFromType === 'Projects' ? transferFromId :
      transferToType   === 'Projects' ? transferToId   : 0;

    if (!projectId) {
      setMaterialRequestOptions([]);
      return;
    }

    (async () => {
      const res = await getMaterialRequestsByProjectId(projectId);
      if (!mounted) return;

      if (!res?.error && Array.isArray(res.data)) {
        const opts = res.data.map((r) => ({
          value: r.materialId ?? r.id,
          label: r.name || r.code || String(r.materialId ?? r.id),
          code: r.code || '',
          name: r.name || '',
          uom: r.uom || r.purchaseUnitOfMeasure || r.unitOfMeasure || '',
        }));
        setMaterialRequestOptions(opts);
      } else {
        setMaterialRequestOptions([]);
      }
    })();

    return () => { mounted = false; };
  }, [transferFromType, transferFromId, transferToType, transferToId]);

  // ── Rebuild child fields ─────────────────────────────────────────────────────

  useEffect(() => {
    setChildFields(ItemsFields(materialRequestOptions));
  }, [materialRequestOptions]);

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
          <StatusBadge status={formData.status}/>
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
      children: (formData.children || []).map((child) => ({
        ...child,
        quantity: Number(child.quantity || 0),
      })),
      deletedChildren: formData.deletedChildren || [],
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
            {/* Transfer button when record is viewable and draft */}
            {isAllowed(PageName, 'w') && formData?.id && String(formData?.status || '').toLowerCase() === 'draft' && (
              <Button variant="primary" disabled={actionLoading} onClick={() => {
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
              }}><FiSend size={14} style={{ marginRight: 6 }} />Transfer</Button>
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