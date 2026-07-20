'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import { PSRFields, PSRDetailsColumns, PSRItemsFields } from './PSRModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import {
  GetAll as GetAllPurchaseRequest,
  Get as GetPurchaseRequest,
} from '@/services/PurchaseRequest';
import PSRStyles from './PSR.module.scss';
import {
  InitialData,
  Create,
  Get,
  Update,
  SubmitForApproval,
  Approve,
  Reject,
  SetStatus,
  printPSR_byId,
} from '@/services/PurchaseSupplierRequest';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

export default function PSRForm() {
  const PageName = 'Purchase.SupplierRequests';
  const { isAllowed } = useContext(AccessContext);

  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialRequestId = Number(searchParams.get('id') || 0);
  const initialMode =
    searchParams.get('mode') || (initialRequestId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/supplier-requests');
  const [requestId, setRequestId] = useState(initialRequestId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [psr, setPSR] = useState({});
  const [validPSR, setValidPSR] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    const nextRequestId = Number(searchParams.get('id') || 0);
    const nextMode =
      searchParams.get('mode') || (nextRequestId ? 'view' : 'edit');
    setRequestId(nextRequestId);
    setMode(nextMode);
  }, [searchParams]);

  // set PSR Fields
  const onPSRChange = (fieldname, value, formData) => {
    setPSR((prev) => ({
      ...prev,
      ...formData,
      children: prev.children,
      deletedChildren: prev.deletedChildren,
    }));
  };

  // Handle Purchase Request selection and populate table with its children.
  // The PR detail response already returns children in the exact shape PSR
  // needs (materialId, code, name, uom, quantity, remarks), so no per-item
  // material lookups are needed.
  const onPRSelected = async (pr, setFormValues, currentValues) => {
    if (!pr) {
      setTableData({ items: [], deletedItems: [] });
      setPSR((prev) => ({ ...prev, children: [], deletedChildren: [] }));
      return;
    }

    try {
      const prResult = await GetPurchaseRequest(pr.id);
      const selectedPR = prResult?.data;
      const prChildren = selectedPR?.children || [];
      if (prResult?.error || !selectedPR || prChildren.length === 0) {
        setTableData({ items: [], deletedItems: [] });
        setPSR((prev) => ({ ...prev, children: [], deletedChildren: [] }));
        return;
      }

      const items = prChildren.map((child) => ({
        id: 0,
        parentId: 0,
        materialId: child.materialId,
        code: child.code || '',
        name: child.name || '',
        uom: child.uom || '',
        quantity: Number(child.quantity || 0),
        remarks: child.remarks || '',
      }));

      setTableData({ items, deletedItems: [] });
      setPSR((prev) => ({
        ...prev,
        children: items,
        deletedChildren: [],
        jobOrder: selectedPR.jobOrder || '',
        purchaseRequestNumber: selectedPR.requestNumber || '',
      }));

      // EntityForm's header fields only reflect its own live form state, not
      // the psr React state above — push jobOrder/purchaseRequestNumber
      // directly into the form the same way the supplier auto-fill does.
      if (typeof setFormValues === 'function') {
        setFormValues({
          ...(currentValues || {}),
          jobOrder: selectedPR.jobOrder || '',
          purchaseRequestNumber: selectedPR.requestNumber || '',
        });
      }
    } catch (err) {
      console.error('Failed to populate PSR from PR:', err);
      toast.error('Failed to load materials from purchase request');
    }
  };

  const isReadOnly = useMemo(() => {
    return validPSR ? mode === 'view' : true;
  }, [validPSR, mode]);

  const psrFields = PSRFields(
    suppliers,
    onPSRChange,
    purchaseRequests,
    onPRSelected,
    isReadOnly,
  );
  const psrDetailsColumns = PSRDetailsColumns;
  const [psrItemFields, setPSRItemFields] = useState(PSRItemsFields(materials));

  // load Supplier, Materials, Purchase Requests
  useEffect(() => {
    const fetchSupplier = async () => {
      const res = await getSuppliers();
      if (res && !res.error) setSuppliers(res.data);
    };
    const fetchMaterials = async () => {
      const res = await getMaterials();
      if (res && !res.error) setMaterials(res.data);
    };
    const fetchPurchaseRequests = async () => {
      const res = await GetAllPurchaseRequest();
      if (res && !res.error) {
        const approved = (res.data || []).filter(
          (r) => r.status?.toLowerCase() === 'approved',
        );
        setPurchaseRequests(approved);
      }
    };
    fetchSupplier();
    fetchMaterials();
    fetchPurchaseRequests();
  }, []);

  // set PSR Data
  const GetPSR = React.useCallback(async () => {
    let initPSR = { ...InitialData };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (requestId !== 0) {
      const getpsr = await Get(requestId);
      initPSR = getpsr.data;
      initPSR.purchaseRequestNumber =
        initPSR.purchaseRequestNumber ?? initPSR.prNumber ?? '';

      if (initPSR.requestDate) {
        const d = new Date(initPSR.requestDate);
        initPSR.requestDate = !isNaN(d)
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : todayStr;
      } else {
        initPSR.requestDate = todayStr;
      }
    } else {
      setMode('new');
      initPSR.requestDate = todayStr;
    }

    setPSR(initPSR);
    setValidPSR(Object.keys(initPSR).length === 0 ? false : true);
    setTableData({
      items: initPSR.children || [],
      deletedItems: initPSR.deletedChildren || [],
    });
  }, [requestId]);

  useEffect(() => {
    GetPSR();
  }, [GetPSR]);

  const formTitle = useMemo(() => {
    const title =
      psr && psr.status ? psr.requestNumber : 'New Purchase Supplier Request';
    return (
      <div className={PSRStyles.formTitle}>
        <span>{title}</span>
        {psr.status && <span className={PSRStyles.status}>{psr.status}</span>}
      </div>
    );
  }, [psr]);

  const detailsUpdated = (items, deletedItems) => {
    const psrCopy = { ...psr };
    psrCopy.children = items;
    psrCopy.deletedChildren = deletedItems;

    setPSR(psrCopy);
    setTableData({ items, deletedItems });
    if (Array.isArray(items) && items.length > 0) setTableError('');
  };

  const updatePSRItemFields = React.useCallback(() => {
    setPSRItemFields(PSRItemsFields(materials));
  }, [materials]);

  useEffect(() => {
    updatePSRItemFields();
  }, [updatePSRItemFields]);

  const handleSaveConfirm = (entity) => {
    const title = 'Save PSR';
    const message = 'Are you sure you want to save this request?';
    const confirmText = 'Save';
    const variant = 'primary';
    const action = () => async () => await save(entity);
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const save = async (entity) => {
    entity.children = (psr.children || []).map((child) => ({
      ...child,
      quantity: Number(child.quantity || 0),
    }));
    entity.deletedChildren = psr.deletedChildren;

    const updatedPSR = {
      ...psr,
      ...entity,
      jobOrder: psr.jobOrder,
      prNumber: entity.purchaseRequestNumber || psr.purchaseRequestNumber || '',
    };

    let res = {};
    updatedPSR.id = updatedPSR.id ?? 0;

    updatedPSR.id == 0
      ? (res = await Create(updatedPSR))
      : (res = await Update(updatedPSR.id, updatedPSR));

    if (res?.error) {
      toast.error('Failed to save purchase supplier request.');
      return null;
    } else {
      toast.success('Purchase Supplier Request has been saved.');
      router.push(backPath);
    }
  };

  const handleCancelConfirm = () => {
    const title = 'Cancel PSR';
    const message = 'Are you sure you want to cancel this request?';
    const confirmText = 'Cancel';
    const variant = 'primary';
    const action = () => async () => await cancelPSR();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const cancelPSR = async () => {
    setMode('view');
    const res = await SetStatus('Cancel', psr.id);
    if (res?.error) {
      toast.error('Failed to cancel request.');
      return null;
    } else {
      toast.success('Request has been cancelled.');
      router.push(backPath);
    }
  };

  const handleSubmitConfirm = () => {
    const title = 'Submit for approval';
    const message = 'Are you sure you want to submit this for approval?';
    const confirmText = 'Submit';
    const variant = 'primary';
    const action = () => async () => await submitForApproval();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const submitForApproval = async () => {
    const res = await SubmitForApproval(psr.id);
    if (res?.error) {
      toast.error('Failed to submit request.');
      return null;
    } else {
      toast.success('Request has been submitted for approval.');
      router.push(backPath);
    }
  };

  const handleCancelEditConfirm = () => {
    const title = 'Cancel Edit';
    const message = 'Are you sure you want to cancel editing?';
    const confirmText = 'Cancel Edit';
    const variant = 'danger';
    const action = () => () => CancelEdit();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelEdit = () => setMode('view');

  const handleApproveConfirm = () => {
    const title = 'Approve';
    const message = 'Are you sure you want to approve this request?';
    const confirmText = 'Approve';
    const variant = 'primary';
    const action = () => async () => await approvePSR();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const approvePSR = async () => {
    setMode('view');
    const res = await Approve(psr.id);
    if (res?.error) {
      toast.error('Failed to approve request.');
      return null;
    } else {
      toast.success('Request has been approved.');
      router.push(backPath);
    }
  };

  const handleRejectConfirm = () => {
    const title = 'Reject';
    const message = 'Are you sure you want to reject this request?';
    const confirmText = 'Reject';
    const variant = 'primary';
    const action = () => async () => await rejectPSR();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const rejectPSR = async () => {
    setMode('view');
    const res = await Reject(psr.id);
    if (res?.error) {
      toast.error('Failed to reject request.');
      return null;
    } else {
      toast.success('Request has been rejected.');
      router.push(backPath);
    }
  };

  const handleArchiveConfirm = () => {
    const title = 'Archive';
    const message = 'Are you sure you want to archive this request?';
    const confirmText = 'Archive';
    const variant = 'primary';
    const action = () => async () => await archivePSR();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const archivePSR = async () => {
    setMode('view');
    const res = await SetStatus('Archive', psr.id);
    if (res?.error) {
      toast.error('Failed to archive request.');
      return null;
    } else {
      toast.success('Request has been archived.');
      router.push(backPath);
    }
  };

  // buttons
  const CreateButton = () =>
    isAllowed(PageName, 'w') && !requestId ? (
      <Button type="submit" variant="save">
        Save
      </Button>
    ) : null;

  const ViewButton = () =>
    isAllowed(PageName, 'w') && requestId && mode === 'view' ? (
      <div className={PSRStyles.buttonsContainer}>
        {psr &&
          psr.status &&
          (psr.status.toLowerCase() === 'draft' ||
            psr.status.toLowerCase() === 'rejected') && (
            <Button onClick={() => setMode('edit')} variant="save">
              Edit
            </Button>
          )}
        {psr && psr.status && psr.status.toLowerCase() === 'draft' && (
          <Button onClick={handleSubmitConfirm} variant="save">
            Submit For Approval
          </Button>
        )}
      </div>
    ) : null;

  const CancelButton = () =>
    isAllowed(PageName, 'w') && requestId && mode === 'view' ? (
      <div className={PSRStyles.buttonsContainer}>
        {psr &&
          psr.status &&
          psr.status.toLowerCase() !== 'cancelled' &&
          psr.status.toLowerCase() !== 'archived' && (
            <Button onClick={handleCancelConfirm} variant="danger">
              Cancel
            </Button>
          )}
      </div>
    ) : null;

  const CRUDButton = () =>
    isAllowed(PageName, 'w') && requestId && mode === 'edit' ? (
      <div className={PSRStyles.buttonsContainer}>
        <Button variant="outlineDanger" onClick={handleCancelEditConfirm}>
          Cancel
        </Button>
        <Button type="submit" variant="save">
          Save
        </Button>
      </div>
    ) : null;

  const ApprovalButton = () =>
    isAllowed(PageName, 'a') &&
    requestId &&
    psr.status &&
    psr.status.toLowerCase() === 'submitted' ? (
      <div className={PSRStyles.buttonsContainer}>
        {mode === 'view' && (
          <Button onClick={() => setMode('edit')} variant="save">
            Edit
          </Button>
        )}
        {mode === 'view' && (
          <Button variant="outlineDanger" onClick={handleRejectConfirm}>
            Reject
          </Button>
        )}
        {mode === 'view' && (
          <Button variant="save" onClick={handleApproveConfirm}>
            Approve
          </Button>
        )}
      </div>
    ) : null;

  const ArchiveButton = () =>
    isAllowed(PageName, 'w') &&
    mode === 'view' &&
    requestId &&
    psr.status &&
    (psr.status.toLowerCase() === 'approved' ||
      psr.status.toLowerCase() === 'rejected' ||
      psr.status.toLowerCase() === 'cancelled') ? (
      <div className={PSRStyles.buttonsContainer}>
        <Button variant="primary" onClick={handleArchiveConfirm}>
          Archive
        </Button>
      </div>
    ) : null;

  const PrintButton = () =>
    isAllowed(PageName, 'r') &&
    isReadOnly &&
    requestId &&
    psr.status &&
    psr.status.toLowerCase() === 'approved' ? (
      <Button
        variant="primary"
        icon={<FiPrinter size={14} />}
        onClick={async () => {
          await printPSR_byId(requestId);
        }}>
        Print
      </Button>
    ) : null;

  return isAllowed(PageName, 'r') ? (
    validPSR ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Purchase Supplier Request"
        icon={<FiFileText />}
        fields={psrFields}
        initialValues={psr}
        extraContent={
          <div className={PSRStyles.extraContentContainer}>
            <DetailsTable
              itemModalHeader="Request Details"
              parentId={requestId}
              columns={psrDetailsColumns}
              editable={isAllowed(PageName, 'w') && !isReadOnly}
              itemFields={psrItemFields}
              data={tableData}
              onChange={detailsUpdated}
            />
            {tableError && (
              <div className={PSRStyles.tableError}>{tableError}</div>
            )}
          </div>
        }
        onSubmit={handleSaveConfirm}
        onValidate={(values) => {
          const errors = {};
          const items = tableData?.items || [];
          if (!Array.isArray(items) || items.length === 0) {
            errors.supplierId = 'At least one request detail is required';
            setTableError('At least one request detail is required');
          } else {
            setTableError('');
          }
          return errors;
        }}
        backPath={backPath}
        width="100%"
        showSubmitButton={false}
        readOnly={isReadOnly}
        headerActions={
          <div className={PSRStyles.buttonsContainer}>
            <CreateButton />
            <CancelButton />
            <ViewButton />
            <CRUDButton />
            <ApprovalButton />
            <ArchiveButton />
            <PrintButton />
          </div>
        }
      />
    ) : (
      <InvalidPage message="Purchase supplier request not found." />
    )
  ) : (
    <InvalidPage />
  );
}
