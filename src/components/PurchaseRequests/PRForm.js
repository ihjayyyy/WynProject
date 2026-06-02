'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiInbox, FiPrinter } from 'react-icons/fi';
import { FormFields, TableColumns, ItemsFields } from './PRModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { getProjects } from '@/services/Project';
import { getMaterials } from '@/services/Materials';
import EntityStyle from '../EntityForm/EntityContainer.module.scss';
import {
  InitialData,
  Create,
  Get,
  Update,
  SubmitForApproval,
  Approve,
  Reject,
  SetStatus,
  printPurchaseRequest_byId,
} from '@/services/PurchaseRequest';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

export default function PRForm() {
  const PageName = 'Purchase.Requests';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialformId = Number(searchParams.get('id') || 0);
  const initialMode =
    searchParams.get('mode') || (initialformId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/requests');
  const [formId, setformId] = useState(initialformId);
  const [mode, setMode] = useState(initialMode);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({});
  const [formValid, setformValid] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    const paramId = Number(searchParams.get('id') || 0);
    const nextMode = searchParams.get('mode') || (paramId ? 'view' : 'edit');
    setformId(paramId);
    setMode(nextMode);
  }, [searchParams]);

  const onFormChange = (fieldname, value, data) => {
    console.log('field changed.', fieldname, value, data);
    const children = formData.children.map((d) => {
      return { ...d };
    });
    console.log(children);
    setPO({ ...formData, ...data, children: children });
    setTableData({ ...tableData, items: children });
  };

  const formFields = FormFields(projects, onFormChange);
  const tableColumns = TableColumns;
  const [itemFields, setItemFields] = useState(
    ItemsFields(materials, formData),
  );

  //load Projects and Materials
  useEffect(() => {
    const fetchProjects = async () => {
      console.log('Load Projects');

      const res = await getProjects();
      if (res && !res.error) {
        setProjects(res.data);
      }
    };

    const fetchMaterials = async () => {
      const res = await getMaterials();
      if (res && !res.error) {
        setMaterials(res.data);
      }
    };
    fetchProjects();
    fetchMaterials();
  }, []);

  const GetFormData = async () => {
    let initData = { ...InitialData };
    if (formId !== 0) {
      const getData = await Get(formId);
      console.log('get pr', getData);
      initData = getData.data;

      // Normalize date fields for form input
      if (initData.requestDate) {
        const d = new Date(initData.requestDate);
        if (!isNaN(d)) {
          initData.requestDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      // Add more date fields here if needed
    } else {
      setMode('new');
    }
    setFormData(initData);
    setformValid(Object.keys(initData).length === 0 ? false : true);
    setTableData({
      items: initData.children,
      deletedItems: initData.deletedChildren,
    });
  };

  useEffect(() => {
    GetFormData();
  }, [formId]);

  const isReadOnly = useMemo(() => {
    if (formValid) return mode === 'view';
    else return true;
  }, [formData, mode]);

  //Set Form Title
  const formTitle = useMemo(() => {
    const title =
      formData && formData.status
        ? formData.orderNumber
        : 'New Purchase Request';
    return (
      <div className={EntityStyle.formTitle}>
        <span>{title}</span>
        {formData.status && (
          <span className={EntityStyle.status}>{formData.status}</span>
        )}
      </div>
    );
  }, [formData]);

  //Events : When Details Changed
  const detailsUpdated = useCallback(
    (items, deletedItems) => {
      console.log('Table has changed');
      const dataCopy = { ...formData };
      dataCopy.children = items;
      dataCopy.deletedChildren = deletedItems;
      setFormData(dataCopy);
      setTableData({ items, deletedItems });
      // clear table-level error when user modifies details
      if (Array.isArray(items) && items.length > 0) setTableError('');
    },
    [formData],
  );

  //Set Item Details data
  useEffect(() => {
    console.log('initialize items');
    updateItemFields();
  }, [materials, formData]);

  const updateItemFields = () => {
    console.log(formData);
    var items = ItemsFields(materials, formData);
    console.log(items);
    setItemFields(items);
  };

  const handleSaveConfirm = (entity) => {
    console.log(entity);
    const title = 'Save PR';
    const message = 'Are you sure you want to save this PR?';
    const confirmText = 'Save';
    const variant = 'primary';
    const action = () => async () => await save(entity);
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const save = async (entity) => {
    console.log(formData);

    if (!entity.requestDate) {
      const today = new Date();
      entity.requestDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    entity.children = (formData.children || []).map((child) => ({
      ...child,
      quantity: Number(child.quantity || 0),
    }));
    entity.deletedChildren = formData.deletedChildren;
    const updatedForm = { ...formData, ...entity };
    console.log('submit');
    console.log(updatedForm);

    let res = {};
    updatedForm.id = updatedForm.id ?? 0;

    updatedForm.id == 0
      ? (res = await Create(updatedForm))
      : (res = await Update(updatedForm.id, updatedForm));
    console.log(res);
    if (res?.error) {
      toast.error('Failed to save purchase request.');
      return null;
    } else {
      toast.success('Purchase Request has been saved.');
      router.push(backPath);
    }
  };

  const handleCancelConfirm = () => {
    const title = 'Cancel PR';
    const message = 'Are you sure you want to cancel this PR?';
    const confirmText = 'Cancel PR';
    const variant = 'primary';
    const action = () => async () => await CancelForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelForm = async () => {
    setMode('view');
    const res = await SetStatus('Cancel', formData.id);

    if (res?.error) {
      toast.error('Failed to submit purchase request.');
      return null;
    } else {
      toast.success('Purchase request has been cancelled.');
      router.push(backPath);
    }
  };

  const handleSubmitConfirm = () => {
    const title = 'Submit for approval';
    const message = 'Are you sure you want to this PR for approval?';
    const confirmText = 'Submit';
    const variant = 'primary';
    const action = () => async () => await submitForApproval();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const submitForApproval = async () => {
    //setMode("edit");
    const res = await SubmitForApproval(formData.id);
    console.log(res);
    if (res?.error) {
      toast.error('Failed to submit purchase request.');
      return null;
    } else {
      toast.success('Purchase Request has been submitted for approval.');
      router.push(backPath);
    }
  };
  const handleCanceEditConfirm = () => {
    const title = 'Cancel Edit';
    const message = 'Are you sure you want to cancel editing of this PR?';
    const confirmText = 'Cancel Edit';
    const variant = 'danger';
    const action = () => () => CancelEdit();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelEdit = () => {
    setMode('view');
  };
  const handleApproveConfirm = () => {
    const title = 'Approve';
    const message = 'Are you sure you want to approve this PR?';
    const confirmText = 'Approve PR';
    const variant = 'primary';
    const action = () => async () => await approveForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const approveForm = async () => {
    setMode('view');
    const res = await Approve(formData.id);

    if (res?.error) {
      toast.error('Failed to approve purchase request.');
      return null;
    } else {
      toast.success('Purchase Request has been approved.');
      router.push(backPath);
    }
  };

  const handleRejectConfirm = () => {
    const title = 'Reject';
    const message = 'Are you sure you want to reject this PR?';
    const confirmText = 'Reject PR';
    const variant = 'primary';
    const action = () => async () => await rejectForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const rejectForm = async () => {
    setMode('view');
    const res = await Reject(formData.id);

    if (res?.error) {
      toast.error('Failed to reject purchase request.');
      return null;
    } else {
      toast.success('Purchase Request has been rejected.');
      router.push(backPath);
    }
  };

  const handleArchiveConfirm = () => {
    const title = 'Archive';
    const message = 'Are you sure you want to archive this PR?';
    const confirmText = 'Archive';
    const variant = 'primary';
    const action = () => async () => await archiveForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const archiveForm = async () => {
    setMode('view');
    const res = await SetStatus('Archive', formData.id);

    if (res?.error) {
      toast.error('Failed to archive purchase request.');
      return null;
    } else {
      toast.success('Purchase Request has been archived.');
      router.push(backPath);
    }
  };

  //buttons
  const CreateButton = () => {
    return isAllowed(PageName, 'w') && !formId ? (
      <Button type="submit" variant="save">
        Save
      </Button>
    ) : null;
  };

  const ViewButton = () => {
    return isAllowed(PageName, 'w') && formId && mode === 'view' ? (
      <div className={EntityStyle.buttonsContainer}>
        {formData &&
          formData.status &&
          (formData.status.toLowerCase() === 'draft' ||
            formData.status.toLowerCase() === 'rejected') && (
            <Button onClick={() => setMode('edit')} variant="save">
              Edit
            </Button>
          )}
        {formData &&
          formData.status &&
          formData.status.toLowerCase() === 'draft' && (
            <Button onClick={handleSubmitConfirm} variant="save">
              Submit For Approval
            </Button>
          )}
      </div>
    ) : null;
  };

  const CanceButton = () => {
    return isAllowed(PageName, 'w') && formId && mode === 'view' ? (
      <div className={EntityStyle.buttonsContainer}>
        {formData &&
          formData.status &&
          formData.status.toLowerCase() !== 'ordered' &&
          formData.status.toLowerCase() !== 'cancelled' &&
          formData.status.toLowerCase() !== 'archived' && (
            <Button onClick={handleCancelConfirm} variant="danger">
              Cancel PR
            </Button>
          )}
      </div>
    ) : null;
  };

  const CRUDButton = () => {
    return isAllowed(PageName, 'w') && formId && mode === 'edit' ? (
      <div className={EntityStyle.buttonsContainer}>
        <Button variant="outlineDanger" onClick={handleCanceEditConfirm}>
          Cancel
        </Button>
        <Button type="submit" variant="save">
          Save
        </Button>
      </div>
    ) : null;
  };

  const ApprovalButton = () => {
    return isAllowed(PageName, 'a') &&
      formId &&
      formData.status &&
      formData.status.toLowerCase() === 'submitted' ? (
      <div className={EntityStyle.buttonsContainer}>
        {formData &&
          formData.status &&
          formData.status.toLowerCase() === 'submitted' &&
          mode === 'view' && (
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
  };

  const OrderButton = () => {
    return isAllowed(PageName, 'ww') &&
      formId &&
      formData.status &&
      formData.status.toLowerCase() === 'approved' ? (
      <div className={EntityStyle.buttonsContainer}>
        <Button variant="save" onClick={handleApproveConfirm}>
          Order
        </Button>
      </div>
    ) : null;
  };

  const ArchiveButton = () => {
    return isAllowed(PageName, 'w') &&
      mode === 'view' &&
      formId &&
      formData.status &&
      (formData.status.toLowerCase() === 'ordered' ||
        formData.status.toLowerCase() === 'approved' ||
        formData.status.toLowerCase() === 'rejected' ||
        formData.status.toLowerCase() === 'cancelled') ? (
      <div className={EntityStyle.buttonsContainer}>
        <Button variant="primary" onClick={handleArchiveConfirm}>
          Archive
        </Button>
      </div>
    ) : null;
  };

  const PrintButton = () => {
    return isAllowed(PageName, 'r') && isReadOnly && formId ? (
      <>
        <Button
          variant="primary"
          icon={<FiPrinter size={14} />}
          onClick={async () => {
            await printPurchaseRequest_byId(formId);
          }}>
          Print
        </Button>
      </>
    ) : null;
  };

  return isAllowed(PageName, 'r') ? (
    formValid ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Purchase Request"
        icon={<FiInbox />}
        fields={formFields}
        onValidate={async (values) => {
          const errors = {};
          if (
            !tableData.items ||
            (Array.isArray(tableData.items) && tableData.items.length === 0)
          ) {
            errors.projectId = 'At least one request detail is required';
            setTableError(errors.projectId);
          } else {
            setTableError('');
          }
          return errors;
        }}
        initialValues={formData}
        extraContent={
          <div className={EntityStyle.extraContentContainer}>
            <DetailsTable
              itemModalHeader="Request Details"
              parentId={formId}
              columns={tableColumns}
              editable={isAllowed(PageName, 'w') && !isReadOnly}
              itemFields={itemFields}
              data={tableData}
              onChange={detailsUpdated}
            />
            {tableError ? (
              <div style={{ color: 'red', marginTop: 8 }}>{tableError}</div>
            ) : null}
            <div className={EntityStyle.notesContainer}></div>
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
            <CanceButton />
            <ViewButton />
            <CRUDButton />
            <ApprovalButton />
            <OrderButton />
            <ArchiveButton />
            <PrintButton />
          </div>
        }
      />
    ) : (
      <InvalidPage message="Purchase Request not found." />
    )
  ) : (
    <InvalidPage />
  );
}
