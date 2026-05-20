'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {
  FormFields,
  TableColumns,
  ItemsFields,
} from '../Invoice/InvoiceModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import EntityStyle from '../EntityForm/EntityContainer.module.scss';
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import { Get as GetPO, GetOrdersBySupplier } from '@/services/PurchaseOrder';
import {
  InitialData,
  Create,
  Get,
  Update,
  ConfirmInvoice,
  Reject,
} from '@/services/PurchaseInvoice';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

const toDateInputValue = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function PurchaseInvoiceForm() {
  const PageName = 'Purchase.Invoices';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialId = Number(searchParams.get('id') || 0);
  const initialMode = searchParams.get('mode') || (initialId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/invoices');
  const [formId, setformId] = useState(initialId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);

  const [formData, setForm] = useState({});
  const [validForm, setvalidForm] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncluded] = useState(0);

  // Load Suppliers and Materials
  useEffect(() => {
    const fetchSupplier = async () => {
      const res = await getSuppliers();
      if (res && !res.error) {
        setSuppliers(res.data);
      }
    };

    const fetchMaterials = async () => {
      const res = await getMaterials();
      if (res && !res.error) {
        setMaterials(res.data);
      }
    };
    fetchSupplier();
    fetchMaterials();
  }, []);

  const fetchOrders = async (supplierid) => {
    const res = await GetOrdersBySupplier(supplierid);
    if (res && !res.error) {
      setOrders(res.data);
    }
  };

  const loadOrders = async (orderId) => {
    const res = await GetPO(orderId);

    const children = res.data.children.map((d) => ({
      id: 0,
      parentId: 0,
      poChildId: d.id,
      materialId: d.materialId,
      code: d.code,
      name: d.name,
      uom: d.uom,
      orderQuantity: Number(d.quantity) || 0,
      quantity: Number(d.orderBalance) || 0,
      previousBalance: Number(d.orderBalance) || 0,
      remainingBalance: 0,
      unitCost: Number(d.unitCost || 0),
      discount: Number(d.discount || 0),
      vat: Number(d.vat || 0),
      amount: Number(d.amount || 0),
      remarks: '',
    }));

    const computedVAT = children.reduce((sum, c) => sum + Number(c.vat || 0), 0);
    const computedAmount = children.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const computedExcluded = computedAmount - computedVAT;

    setTotalExcluded(computedExcluded);
    setTotalVAT(computedVAT);
    setTotalIncluded(computedAmount);

    setForm((prev) => ({
      ...prev,
      children,
      deletedChildren: prev.deletedChildren || [],
      vat: computedVAT,
      amount: computedAmount,
    }));

    setTableData((prev) => ({ ...prev, items: children }));
  };

  useEffect(() => {
    const nextId = Number(searchParams.get('id') || 0);
    const nextMode = searchParams.get('mode') || (nextId ? 'view' : 'edit');
    setformId(nextId);
    setMode(nextMode);
  }, [searchParams]);

  const confirmLoadOrders = async (orderId) => {
    const title = 'Load Purchase Order';
    const message = 'Do you want to load items from this Purchase Order?';
    const confirmText = 'Yes';
    const variant = 'primary';
    const action = () => async () => await loadOrders(orderId);
    confirmModal.show(title, message, confirmText, variant, action);
  };

  // Set Form Fields
  const onFormChange = (fieldname, value, updatedformData) => {
    if (fieldname === 'supplierId') {
      fetchOrders(value);
    }
    if (fieldname === 'purchaseOrderId') {
      confirmLoadOrders(value);
    }
  };

  const formFields = FormFields(suppliers, orders, onFormChange);
  const childTableColumns = TableColumns;
  const [childFields, setItemFields] = useState(
    ItemsFields(materials, formData),
  );

  const GetFormData = async () => {
    let initData = { ...InitialData };

    if (formId !== 0) {
      const getdata = await Get(formId);
      initData = getdata.data;

      initData.invoiceDate = toDateInputValue(initData.invoiceDate);

      if (initData.dueDate) {
        initData.dueDate = toDateInputValue(initData.dueDate);
      }
    } else {
      setMode('new');
      initData.invoiceDate = toDateInputValue(null);
    }

    setForm(initData);
    setvalidForm(Object.keys(initData).length === 0 ? false : true);
    setTableData({
      items: initData.children,
      deletedItems: initData.deletedChildren,
    });
  };

  // Set Form Data
  useEffect(() => {
    GetFormData();
  }, [formId]);

  // Set Form View
  const isReadOnly = useMemo(() => {
    if (validForm) return mode === 'view';
    else return true;
  }, [formData, mode]);

  // Set Form Title
  const formTitle = useMemo(() => {
    const title =
      formData && formData.status ? formData.invoiceNumber : 'New Invoice';
    return (
      <div className={EntityStyle.formTitle}>
        <span>{title}</span>
        {formData.status && (
          <span className={EntityStyle.status}>{formData.status}</span>
        )}
      </div>
    );
  }, [formData]);

  const detailsUpdated = (items, deletedItems) => {
    const totalVAT = items.reduce(
      (total, item) => total + Number(item.vat || 0),
      0,
    );
    const totalIncluded = items.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    );
    const totalexcluded = totalIncluded - totalVAT;

    setTotalExcluded(totalexcluded);
    setTotalVAT(totalVAT);
    setTotalIncluded(totalIncluded);

    const formDataCopy = { ...formData };
    formDataCopy.children = items;
    formDataCopy.deletedChildren = deletedItems;
    formDataCopy.vat = totalVAT;
    formDataCopy.amount = totalIncluded;

    setForm(formDataCopy);
  };

  // Set Item Details data
  useEffect(() => {
    updateItemFields();
  }, [materials, formData]);

  const updateItemFields = () => {
    var items = ItemsFields(materials, formData);
    setItemFields(items);
  };

  const handleSaveConfirm = (entity) => {
    const title = 'Save Invoice';
    const message = 'Are you sure you want to save this Invoice?';
    const confirmText = 'Save';
    const variant = 'primary';
    const action = () => async () => await save(entity);
    confirmModal.show(title, message, confirmText, variant, action);
  };

const save = async (entity) => {
  entity.children = (formData.children || []).map((child) => ({
    ...child,
    quantity: Number(child.quantity || 0),
    unitCost: Number(child.unitCost || 0),
    discount: Number(child.discount || 0),
    vat: Number(child.vat || 0),
    amount: Number(child.amount || 0),
  }));

  entity.deletedChildren = formData.deletedChildren;

  // ✅ Compute totals directly from children instead of relying on formData.vat/amount
  const computedVat = entity.children.reduce(
    (sum, child) => sum + Number(child.vat || 0), 0
  );
  const computedAmount = entity.children.reduce(
    (sum, child) => sum + Number(child.amount || 0), 0
  );

  const updatedForm = {
    ...formData,
    ...entity,
    vat: computedVat,       
    amount: computedAmount,
  };

  updatedForm.id = updatedForm.id ?? 0;

  let res = {};
  updatedForm.id === 0
    ? (res = await Create(updatedForm))
    : (res = await Update(updatedForm.id, updatedForm));

  if (res?.error) {
    toast.error('Failed to save purchase Invoice.');
    return null;
  } else {
    toast.success('Purchase Invoice has been saved.');
    router.push(backPath);
  }
};

  const handleCancelConfirm = () => {
    const title = 'Cancel Invoice';
    const message = 'Are you sure you want to cancel this invoice?';
    const confirmText = 'Cancel invoice';
    const variant = 'primary';
    const action = () => async () => await Cancel();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const Cancel = async () => {
    setMode('view');
    const res = await SetStatus('Cancel', formData.id);

    if (res?.error) {
      toast.error('Failed to cancel purchase invoice.');
      return null;
    } else {
      toast.success('Purchase Invoice has been cancelled.');
      router.push(backPath);
    }
  };

  const handleSubmitConfirm = () => {
    const title = 'Submit for approval';
    const message = 'Are you sure you want to submit this invoice for approval?';
    const confirmText = 'Submit';
    const variant = 'primary';
    const action = () => async () => await submitForApproval();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const submitForApproval = async () => {
    const res = await SubmitForApproval(formData.id);
    if (res?.error) {
      toast.error('Failed to submit purchase invoice.');
      return null;
    } else {
      toast.success('Purchase Invoice has been submitted for approval.');
      router.push(backPath);
    }
  };

  const handleCanceEditConfirm = () => {
    const title = 'Cancel Edit';
    const message = 'Are you sure you want to cancel editing of this invoice?';
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
    const message = 'Are you sure you want to approve this invoice?';
    const confirmText = 'Approve invoice';
    const variant = 'primary';
    const action = () => async () => await approve();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const approve = async () => {
    setMode('view');
    const res = await Approve(formData.id);

    if (res?.error) {
      toast.error('Failed to approve purchase invoice.');
      return null;
    } else {
      toast.success('Purchase Invoice has been approved.');
      router.push(backPath);
    }
  };

  const handleInvoiceConfirm = () => {
    const title = 'Confirm Invoice';
    const message = 'Are you sure you want to confirm this invoice?';
    const confirmText = 'Confirm Invoice';
    const variant = 'primary';
    const action = () => async () => await confirmForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const confirmForm = async () => {
    setMode('view');
    const res = await ConfirmInvoice(formData.id);

    if (res?.error) {
      toast.error('Failed to confirm purchase invoice.');
      return null;
    } else {
      toast.success('Purchase invoice has been confirmed.');
      router.push(backPath);
    }
  };

  const handleRejectConfirm = () => {
    const title = 'Reject';
    const message = 'Are you sure you want to reject this invoice?';
    const confirmText = 'Reject invoice';
    const variant = 'primary';
    const action = () => async () => await reject();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const reject = async () => {
    setMode('view');
    const res = await Reject(formData.id);

    if (res?.error) {
      toast.error('Failed to reject purchase invoice.');
      return null;
    } else {
      toast.success('Purchase Invoice has been rejected.');
      router.push(backPath);
    }
  };

  const handleArchiveConfirm = () => {
    const title = 'Archive';
    const message = 'Are you sure you want to archive this invoice?';
    const confirmText = 'Archive';
    const variant = 'primary';
    const action = () => async () => await archive();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const archive = async () => {
    setMode('view');
    const res = await SetStatus('Archive', formData.id);

    if (res?.error) {
      toast.error('Failed to archive purchase invoice.');
      return null;
    } else {
      toast.success('Purchase Invoice has been archived.');
      router.push(backPath);
    }
  };

  const handleCloseConfirm = () => {
    const title = 'Close window';
    const message = 'Are you sure you want to close this window?';
    const confirmText = 'Close';
    const variant = 'primary';
    const action = () => () => closeForm();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const closeForm = () => {
    router.push(backPath);
    return;
  };

  // Buttons
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

  const CancelButton = () => {
    return isAllowed(PageName, 'w') && formId && mode === 'view' ? (
      <div className={EntityStyle.buttonsContainer}>
        {formData &&
          formData.status &&
          formData.status.toLowerCase() !== 'invoiced' &&
          formData.status.toLowerCase() !== 'cancelled' &&
          formData.status.toLowerCase() !== 'archived' && (
            <Button onClick={handleCancelConfirm} variant="danger">
              Cancel Invoice
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

  const ConfirmButton = () => {
    return isAllowed(PageName, 'ww') &&
      formId &&
      formData.status &&
      formData.status.toLowerCase() === 'draft' ? (
      <div className={EntityStyle.buttonsContainer}>
        <Button variant="save" onClick={handleInvoiceConfirm}>
          Confirm Invoice
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

  return isAllowed(PageName, 'r') ? (
    validForm ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Purchase Invoice"
        icon={<FiList />}
        fields={formFields}
        initialValues={formData}
        extraContent={
          <div className={EntityStyle.extraContentContainer}>
            <DetailsTable
              itemModalHeader="Invoice Details"
              parentId={formId}
              columns={childTableColumns}
              editable={isAllowed(PageName, 'w') && !isReadOnly}
              itemFields={childFields}
              data={tableData}
              onChange={detailsUpdated}
            />
            <div className={EntityStyle.summaryContainer}>
              <div className={EntityStyle.notesContainer}></div>
              <div className={EntityStyle.totalContainer}>
                <div className={EntityStyle.totalLabel}>
                  Total Excluding VAT:
                </div>
                <div className={EntityStyle.totalValue}>
                  {totalExcluded.toFixed(2)}
                </div>
                <div className={EntityStyle.totalLabel}>Total VAT:</div>
                <div className={EntityStyle.totalValue}>
                  {totalVAT.toFixed(2)}
                </div>
                <div className={EntityStyle.totalLabel}>
                  Total Including VAT:
                </div>
                <div
                  className={`${EntityStyle.totalValue} ${EntityStyle.highlight}`}>
                  {totalIncluded.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        }
        onSubmit={handleSaveConfirm}
        backPath={backPath}
        width="100%"
        showSubmitButton={false}
        readOnly={isReadOnly}
        headerActions={
          <div className={EntityStyle.buttonsContainer}>
            <Button variant="warning" onClick={handleCloseConfirm}>
              Close
            </Button>
            <CreateButton />
            <CancelButton />
            <ViewButton />
            <CRUDButton />
            <ConfirmButton />
            <ArchiveButton />
            <ApprovalButton />
          </div>
        }
      />
    ) : (
      <InvalidPage message="Purchase Invoice not found." />
    )
  ) : (
    <InvalidPage />
  );
}