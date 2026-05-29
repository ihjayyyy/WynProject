'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList, FiPrinter } from 'react-icons/fi';
import { FormFields, TableColumns, ItemsFields } from '././DeliveryModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import EntityStyle from '../EntityForm/EntityContainer.module.scss';
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import { Get as GetPO, GetOrdersBySupplier } from '@/services/PurchaseOrder';
import { InitialData, Create, Get, Update, ConfirmDelivery, printDelivery_byId } from '@/services/PurchaseDelivery';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

// Returns today's date if null/undefined/invalid
const toDateInputValue = (date) => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function PurchaseDeliveryForm() {
  const PageName = 'Purchase.Deliveries';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const initialId = Number(searchParams.get('id') || 0);
  const initialMode = searchParams.get('mode') || (initialId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/deliveries');
  const [formId, setformId] = useState(initialId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);

  const [formData, setForm] = useState({});
  const [validForm, setvalidForm] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    const nextOrderId = Number(searchParams.get('id') || 0);
    const nextMode = searchParams.get('mode') || (nextOrderId ? 'view' : 'edit');
    setformId(nextOrderId);
    setMode(nextMode);
  }, [searchParams]);

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
      remarks: '',
    }));

    setForm((prev) => ({ ...prev, children }));
    setTableData((prev) => ({ ...prev, items: children }));
  };

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
    if (fieldname === 'orderId') {
      confirmLoadOrders(value);
    }
  };

  const formFields = FormFields(suppliers, orders, onFormChange);
  const childTableColumns = TableColumns;
  const [childFields, setItemFields] = useState(ItemsFields(materials, formData));

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

  const GetFormData = async () => {
    let initData = { ...InitialData };

    if (formId !== 0) {
      const getdata = await Get(formId);
      initData = getdata.data;

      initData.deliveryDate = toDateInputValue(initData.deliveryDate);

    } else {
      setMode('new');
      initData.deliveryDate = toDateInputValue(null);
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
      formData && formData.status ? formData.deliveryNumber : 'New Purchase Delivery';
    return (
      <div className={EntityStyle.formTitle}>
        <span>{title}</span>
        {formData.status && (
          <span className={EntityStyle.status}>{formData.status}</span>
        )}
      </div>
    );
  }, [formData]);

  // When child table changed
  const detailsUpdated = (items, deletedItems) => {
    const formCopy = { ...formData };
    formCopy.children = items;
    formCopy.deletedChildren = deletedItems;
    setForm(formCopy);
    setTableData({ items, deletedItems });
    if (Array.isArray(items) && items.length > 0) setTableError('');
  };

  const updateItemFields = () => {
    var items = ItemsFields(materials, formData);
    setItemFields(items);
  };

  // Set Item Details data
  useEffect(() => {
    updateItemFields();
  }, [materials, formData]);

  const handleSaveConfirm = (entity) => {
    const title = 'Save Delivery';
    const message = 'Are you sure you want to save this delivery?';
    const confirmText = 'Save';
    const variant = 'primary';
    const action = () => async () => await save(entity);
    confirmModal.show(title, message, confirmText, variant, action);
  };

  // Events: Save Form
  const save = async (entity) => {
    entity.children = (formData.children || []).map((child) => ({
      ...child,
      orderQuantity: Number(child.orderQuantity || 0),
      quantity: Number(child.quantity || 0),         // ✅ sanitized
      previousBalance: Number(child.previousBalance || 0),
      remainingBalance: Number(child.remainingBalance || 0),
    }));
    entity.deletedChildren = formData.deletedChildren || [];

    const updatedForm = { ...formData, ...entity };

    // ✅ Ensure all date fields are never null in payload
    updatedForm.deliveryDate = updatedForm.deliveryDate || toDateInputValue(null);

    // ✅ Fixed: was `=== null ?? 0` (broken logic)
    updatedForm.id = updatedForm.id ?? 0;

    let res = {};
    updatedForm.id === 0
      ? (res = await Create(updatedForm))
      : (res = await Update(updatedForm.id, updatedForm));

    if (res?.error) {
      toast.error('Failed to save purchase delivery.');
      return null;
    } else {
      toast.success('Purchase Delivery has been saved.');
      router.push(backPath);
    }
  };

  const handleSubmitConfirm = () => {
    const title = 'Confirm Delivery';
    const message = 'Are you sure you want to confirm this delivery?';
    const confirmText = 'Submit';
    const variant = 'primary';
    const action = () => async () => await submitForDelivery();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const submitForDelivery = async () => {
    const res = await ConfirmDelivery(formData.id);
    if (res?.error) {
      toast.error('Failed to submit purchase delivery.');
      return null;
    } else {
      toast.success('Purchase Delivery has been completed.');
      router.push(backPath);
    }
  };

  const handleCancelDeliveryConfirm = () => {
    const title = 'Cancel Delivery';
    const message = 'Are you sure you want to cancel this Delivery?';
    const confirmText = 'Cancel Delivery';
    const variant = 'primary';
    const action = () => async () => await CancelDelivery();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelDelivery = async () => {
    setMode('view');
    const res = await SetStatus('Cancel', formData.id);
    if (res?.error) {
      toast.error('Failed to cancel purchase delivery.');
      return null;
    } else {
      toast.success('Purchase Delivery has been cancelled.');
      router.push(backPath);
    }
  };

  const handleCanceEditConfirm = () => {
    const title = 'Cancel Edit';
    const message = 'Are you sure you want to cancel editing of this Delivery?';
    const confirmText = 'Cancel Edit';
    const variant = 'danger';
    const action = () => () => CancelEdit();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelEdit = () => {
    setMode('view');
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
        {formData && formData.status && formData.status.toLowerCase() === 'draft' && (
          <Button onClick={handleSubmitConfirm} variant="save">
            Deliver
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
          formData.status.toLowerCase() !== 'delivered' &&
          formData.status.toLowerCase() !== 'cancelled' &&
          formData.status.toLowerCase() !== 'archived' && (
            <Button onClick={handleCancelDeliveryConfirm} variant="danger">
              Cancel DR
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
  
  const PrintButton = () => {
    return isAllowed(PageName, 'r') && isReadOnly && formId ? 
    <>
    <Button variant="primary" icon={<FiPrinter size={14} />} /*disabled={actionLoading}*/ onClick={async () => {
      // setActionLoading(true);
      await printDelivery_byId(formId);
      // setActionLoading(false);
      }}>Print</Button>
    </>
    : null
    }

  return isAllowed(PageName, 'r') ? (
    validForm ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Purchase Delivery"
        icon={<FiList />}
        fields={formFields}
        initialValues={formData}
        extraContent={
            <div className={EntityStyle.extraContentContainer}>
              <DetailsTable
                itemModalHeader="Delivery Details"
                parentId={formId}
                columns={childTableColumns}
                editable={isAllowed(PageName, 'w') && !isReadOnly}
                itemFields={childFields}
                data={tableData}
                onChange={detailsUpdated}
              />
              {tableError ? <div style={{ color: 'red', marginTop: 8 }}>{tableError}</div> : null}
            </div>
          }
          onValidate={async (values) => {
            const errors = {};
            if (!tableData || !tableData.items || (Array.isArray(tableData.items) && tableData.items.length === 0)) {
              errors.supplierId = 'At least one delivery detail is required';
              setTableError(errors.supplierId);
            } else {
              setTableError('');
            }
            return errors;
          }}
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
            <PrintButton />
          </div>
        }
      />
    ) : (
      <InvalidPage message="Purchase Delivery not found." />
    )
  ) : (
    <InvalidPage />
  );
}