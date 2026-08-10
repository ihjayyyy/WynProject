'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiClipboard, FiPrinter } from 'react-icons/fi';
import {
  POFields,
  PODetailsColumns,
  POItemsFields,
} from './PurchaseOrdersModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials, getMaterial } from '@/services/Materials';
import {
  GetAll as GetAllSupplierPurchaseRequests,
  Get as GetSupplierPurchaseRequest,
} from '@/services/PurchaseSupplierRequest';
import POStyles from './PurchaseOrders.module.scss';
import {
  InitialData,
  Create,
  Get,
  Update,
  SubmitForApproval,
  Approve,
  Reject,
  SetStatus,
  printPurchaseOrder_byId,
} from '@/services/PurchaseOrder';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import RichTextEditor from '../ui/RichTextEditor/RichTextEditor';
import { getParameter } from '@/services/Parameter';

export default function PurchaseOrdersForm() {
  const PageName = 'Purchase.Orders';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialOrderId = Number(searchParams.get('id') || 0);
  const initialMode =
    searchParams.get('mode') || (initialOrderId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/orders');
  const [orderId, setOrderId] = useState(initialOrderId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [po, setPO] = useState({});
  const [validPO, setvalidPO] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [tableError, setTableError] = useState('');
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncludedd] = useState(0);
  const [richText, setRichText] = useState({
    termsAndConditions: '',
  });

  useEffect(() => {
    const nextOrderId = Number(searchParams.get('id') || 0);
    const nextMode =
      searchParams.get('mode') || (nextOrderId ? 'view' : 'edit');
    setOrderId(nextOrderId);
    setMode(nextMode);
  }, [searchParams]);

  // set PO Fields
  const onPOChange = (fieldname, value, formData) => {
    const poChildren = (po.children || []).map((d) => {
      let vat = 0;
      const unitCost = Number(d.unitCost || 0);
      const quantity = Number(d.quantity || 0);
      const discount = Number(d.discount || 0);
      let subamount = unitCost * quantity - discount;
      let amount = subamount;

      switch (formData.vatType) {
        case 'included':
          vat = Math.round((subamount - subamount / 1.12) * 100) / 100;
          break;
        case 'notincluded':
          vat = Math.round(subamount * 0.12 * 100) / 100;
          amount = subamount + vat;
          console.log(vat, amount);
          break;
        case 'nonvat':
          vat = 0;
          break;
        default:
          vat = 0;
          break;
      }
      return { ...d, vat: vat, amount: amount };
    });
    setPO({ ...po, ...formData, children: poChildren });
    setTableData({ ...tableData, items: poChildren });
  };

  const onPRSelected = async (pr, setFormValues, currentValues) => {
    if (!pr) {
      setTableData({ items: [], deletedItems: [] });
      setPO((prevPo) => ({ ...prevPo, children: [], deletedChildren: [] }));
      return;
    }

    try {
      const sprResult = await GetSupplierPurchaseRequest(pr.id);
      const selectedSPR = sprResult?.data;
      const sprChildren = selectedSPR?.children || [];
      if (sprResult?.error || !selectedSPR || sprChildren.length === 0) {
        setTableData({ items: [], deletedItems: [] });
        setPO((prevPo) => ({ ...prevPo, children: [], deletedChildren: [] }));
        return;
      }

      // Resolve the canonical supplier record — the SPR's own supplierName
      // field is unreliable, so cross-reference the suppliers list already
      // loaded for this form.
      const matchedSupplier = suppliers.find(
        (s) => s.id === selectedSPR.supplierId,
      );

      const poItems = await Promise.all(
        sprChildren.map(async (child) => {
          const materialRes = await getMaterial(child.materialId);
          const material = materialRes?.data;
          if (!material) return null;

          const unitCost = Number(material.purchasePrice || 0);
          const quantity = Number(child.quantity || 0);
          const discount = 0;
          let subamount = unitCost * quantity - discount;
          let amount = subamount;
          let vat = 0;

          const vatType = po?.vatType || 'included';
          switch (vatType) {
            case 'included':
              vat = Math.round((subamount - subamount / 1.12) * 100) / 100;
              break;
            case 'notincluded':
              vat = Math.round(subamount * 0.12 * 100) / 100;
              amount = subamount + vat;
              break;
            case 'nonvat':
              vat = 0;
              break;
            default:
              vat = 0;
              break;
          }

          return {
            id: 0,
            parentId: 0,
            materialId: child.materialId,
            code: child.code || material.code,
            name: child.name || material.name,
            quantity,
            unitCost,
            uom: material.purchaseUnitOfMeasure || child.uom,
            discount,
            vat,
            amount,
            remarks: child.remarks || '',
          };
        }),
      );

      const validItems = poItems.filter((item) => item !== null);
      const newTotalVAT = validItems.reduce(
        (t, i) => t + Number(i.vat || 0),
        0,
      );
      const newTotalIncluded = validItems.reduce(
        (t, i) => t + Number(i.amount || 0),
        0,
      );
      const newTotalExcluded = newTotalIncluded - newTotalVAT;

      setTotalVAT(newTotalVAT);
      setTotalIncludedd(newTotalIncluded);
      setTotalExcluded(newTotalExcluded);

      setTableData({ items: validItems, deletedItems: [] });

      const supplierFields = matchedSupplier
        ? {
            supplierId: matchedSupplier.id,
            supplierCode: matchedSupplier.code,
            supplierName: matchedSupplier.name,
            address: matchedSupplier.address,
            contactPerson: matchedSupplier.contactPerson,
            email: matchedSupplier.email,
            contactNumber: matchedSupplier.contactNumber,
            vatType: matchedSupplier.vatType
              ? matchedSupplier.vatType
              : po?.vatType || 'included',
            code: matchedSupplier.code,
            name: matchedSupplier.name,
            jobOrder: selectedSPR.jobOrder || '',
            supplierReferenceNo: selectedSPR.supplierReferenceNo || '',
          }
        : {
            // Fallback if the suppliers list hasn't loaded yet or the id
            // doesn't match anything — uses whatever the SPR itself has.
            supplierId: selectedSPR.supplierId,
            supplierCode: selectedSPR.supplierCode,
            supplierName: selectedSPR.supplierName,
            address: selectedSPR.address,
            contactPerson: selectedSPR.contactPerson,
            email: selectedSPR.email,
            contactNumber: selectedSPR.contactNumber,
            code: selectedSPR.supplierCode,
            name: selectedSPR.supplierName,
            jobOrder: selectedSPR.jobOrder || '',
            supplierReferenceNo: selectedSPR.supplierReferenceNo || '',
          };

      setPO((prevPo) => ({
        ...prevPo,
        ...supplierFields,
        children: validItems,
        deletedChildren: [],
        vat: newTotalVAT,
        amount: newTotalIncluded,
      }));

      // EntityForm's header fields only reflect its own live form state —
      // push the resolved supplier fields directly into the form, same as
      // the Supplier dropdown's own onChange does.
      if (typeof setFormValues === 'function') {
        setFormValues({
          ...(currentValues || {}),
          ...supplierFields,
        });
      }
    } catch (err) {
      console.error('Failed to populate PO from SPR:', err);
      toast.error('Failed to load materials from supplier purchase request');
    }
  };

  const poFields = POFields(
    suppliers,
    onPOChange,
    purchaseRequests,
    onPRSelected,
  );
  const poDetailsColumns = PODetailsColumns;
  const [poItemFields, setPOItemFields] = useState(
    POItemsFields(materials, po),
  );

  // load Supplier and Materials
  useEffect(() => {
    const fetchSupplier = async () => {
      const res = await getSuppliers();
      console.log(res);
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
    const fetchPurchaseRequests = async () => {
      const res = await GetAllSupplierPurchaseRequests();
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

  // set PO Data
  const GetPO = React.useCallback(async () => {
    let initPO = { ...InitialData };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (orderId !== 0) {
      const getpo = await Get(orderId);
      initPO = getpo.data;

      // Normalize orderDate — default to today if null/invalid
      if (initPO.orderDate) {
        const d = new Date(initPO.orderDate);
        initPO.orderDate = !isNaN(d)
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : todayStr;
      } else {
        initPO.orderDate = todayStr;
      }

      // Normalize estimatedDeliveryDate — default to today if null/invalid
      if (initPO.estimatedDeliveryDate) {
        const d = new Date(initPO.estimatedDeliveryDate);
        initPO.estimatedDeliveryDate = !isNaN(d)
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : todayStr;
      } else {
        initPO.estimatedDeliveryDate = todayStr;
      }

      // Populate richText from saved PO data
      setRichText({
        termsAndConditions: initPO.termsAndConditions || '',
      });
    } else {
      setMode('new');
      // Default both dates to today for new records
      initPO.orderDate = todayStr;
      initPO.estimatedDeliveryDate = todayStr;

      // Load default Terms & Conditions from PurchaseOrder parameters
      const paramRes = await getParameter('PurchaseOrder');
      if (paramRes?.data && Array.isArray(paramRes.data)) {
        // Prefer a parameter with the explicit code, fall back to any name containing 'term'
        const tcParam =
          paramRes.data.find(
            (item) => item.code === 'PurchaseOrder_TermsAndConditions',
          ) ||
          paramRes.data.find((item) =>
            String(item.name || '')
              .toLowerCase()
              .includes('term'),
          );
        setRichText({
          termsAndConditions: tcParam?.value || '',
        });
      }
    }

    setPO(initPO);
    setvalidPO(Object.keys(initPO).length === 0 ? false : true);
    setTableData({
      items: initPO.children,
      deletedItems: initPO.deletedChildren,
    });

    const items = initPO.children || [];
    const vat = items.reduce((t, i) => t + Number(i.vat || 0), 0);
    const included = items.reduce((t, i) => t + Number(i.amount || 0), 0);
    setTotalVAT(vat);
    setTotalIncludedd(included);
    setTotalExcluded(included - vat);
  }, [orderId]);

  useEffect(() => {
    GetPO();
  }, [GetPO]);

  // Set Form View
  const isReadOnly = useMemo(() => {
    return validPO ? mode === 'view' : true;
  }, [validPO, mode]);

  // Set Form Title
  const formTitle = useMemo(() => {
    const title = po && po.status ? po.orderNumber : 'New Purchase Order';
    return (
      <div className={POStyles.formTitle}>
        <span>{title}</span>
        {po.status && <span className={POStyles.status}>{po.status}</span>}
      </div>
    );
  }, [po]);

  // Events : When Details Changed
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
    setTotalIncludedd(totalIncluded);

    const poCopy = { ...po };
    poCopy.children = items;
    poCopy.deletedChildren = deletedItems;
    poCopy.vat = totalVAT;
    poCopy.amount = totalIncluded;

    setPO(poCopy);
    setTableData({ items, deletedItems });
    // clear table error if items exist
    if (Array.isArray(items) && items.length > 0) setTableError('');
  };

  // Set Item Details data
  const updatePOItemFields = React.useCallback(() => {
    const poitems = POItemsFields(materials, po);
    setPOItemFields(poitems);
  }, [materials, po]);

  useEffect(() => {
    updatePOItemFields();
  }, [updatePOItemFields]);

  const handleSaveConfirm = (entity) => {
    console.log(entity);
    const title = 'Save PO';
    const message = 'Are you sure you want to save this PO?';
    const confirmText = 'Save';
    const variant = 'primary';
    const action = () => async () => await save(entity);
    confirmModal.show(title, message, confirmText, variant, action);
  };

  // Events: Save Form
  const save = async (entity) => {
    entity.children = (po.children || []).map((child) => ({
      ...child,
      quantity: Number(child.quantity || 0),
      unitCost: Number(child.unitCost || 0),
      discount: Number(child.discount || 0),
      vat: Number(child.vat || 0),
      amount: Number(child.amount || 0),
    }));
    entity.deletedChildren = po.deletedChildren;

    const updatedPO = {
      ...po,
      ...entity,
      vat: po.vat,
      amount: po.amount,
      jobOrder: po.jobOrder,
      termsAndConditions: richText.termsAndConditions,
    };

    let res = {};
    updatedPO.id = updatedPO.id === null ?? 0;

    updatedPO.id == 0
      ? (res = await Create(updatedPO))
      : (res = await Update(updatedPO.id, updatedPO));

    if (res?.error) {
      toast.error('Failed to save purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been saved.');
      router.push(backPath);
    }
  };

  const handleCancelPOConfirm = () => {
    const title = 'Cancel PO';
    const message = 'Are you sure you want to cancel this PO?';
    const confirmText = 'Cancel PO';
    const variant = 'primary';
    const action = () => async () => await CancelPO();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelPO = async () => {
    setMode('view');
    const res = await SetStatus('Cancel', po.id);

    if (res?.error) {
      toast.error('Failed to submit purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been cancelled.');
      router.push(backPath);
    }
  };

  const handleSubmitConfirm = () => {
    const title = 'Submit for approval';
    const message = 'Are you sure you want to this PO for approval?';
    const confirmText = 'Submit';
    const variant = 'primary';
    const action = () => async () => await submitForApproval();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const submitForApproval = async () => {
    const res = await SubmitForApproval(po.id);
    if (res?.error) {
      toast.error('Failed to submit purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been submitted for approval.');
      router.push(backPath);
    }
  };

  const handleCanceEditConfirm = () => {
    const title = 'Cancel Edit';
    const message = 'Are you sure you want to cancel editing of this PO?';
    const confirmText = 'Cancel Edit';
    const variant = 'dangaer';
    const action = () => () => CancelEdit();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const CancelEdit = () => {
    setMode('view');
  };

  const handleApproveConfirm = () => {
    const title = 'Approve';
    const message = 'Are you sure you want to approve this PO?';
    const confirmText = 'Approve PO';
    const variant = 'primary';
    const action = () => async () => await approvePO();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const approvePO = async () => {
    setMode('view');
    const res = await Approve(po.id);

    if (res?.error) {
      toast.error('Failed to approve purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been approved.');
      router.push(backPath);
    }
  };

  const handleOrderConfirm = () => {
    const title = 'Order';
    const message = 'Are you sure you want to confirm this PO?';
    const confirmText = 'Confirm PO';
    const variant = 'primary';
    const action = () => async () => await orderPO();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const orderPO = async () => {
    setMode('view');
    const res = await SetStatus('Order', po.id);

    if (res?.error) {
      toast.error('Failed to confirm purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been confirmed.');
      router.push(backPath);
    }
  };

  const handleRejectConfirm = () => {
    const title = 'Reject';
    const message = 'Are you sure you want to reject this PO?';
    const confirmText = 'Reject PO';
    const variant = 'primary';
    const action = () => async () => await rejectPO();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const rejectPO = async () => {
    setMode('view');
    const res = await Reject(po.id);

    if (res?.error) {
      toast.error('Failed to reject purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been rejected.');
      router.push(backPath);
    }
  };

  const handleArchiveConfirm = () => {
    const title = 'Archive';
    const message = 'Are you sure you want to archive this PO?';
    const confirmText = 'Archive';
    const variant = 'primary';
    const action = () => async () => await archivePO();
    confirmModal.show(title, message, confirmText, variant, action);
  };

  const archivePO = async () => {
    setMode('view');
    const res = await SetStatus('Archive', po.id);

    if (res?.error) {
      toast.error('Failed to archive purchase order.');
      return null;
    } else {
      toast.success('Purchase Order has been archived.');
      router.push(backPath);
    }
  };

  const headerActions = useMemo(() => {
    const status = String(po?.status || '').toLowerCase();
    const canWrite = isAllowed(PageName, 'w');
    const canApprove = isAllowed(PageName, 'a');
    const canOrder = isAllowed(PageName, 'ww');
    const canRead = isAllowed(PageName, 'r');

    if (!orderId) {
      return canWrite ? (
        <Button type="submit" variant="save">
          Save
        </Button>
      ) : null;
    }

    if (mode === 'edit') {
      return canWrite ? (
        <>
          <Button variant="outlineDanger" onClick={handleCanceEditConfirm}>
            Cancel
          </Button>
          <Button type="submit" variant="save">
            Save
          </Button>
        </>
      ) : null;
    }

    const menuItems = [];
    let primaryAction = null;

    if (canRead && isReadOnly && (status === 'ordered' || status === 'approved')) {
      menuItems.push({
        key: 'print',
        label: 'Print',
        icon: <FiPrinter size={14} />,
        onClick: async () => {
          await printPurchaseOrder_byId(orderId);
        },
      });
    }

    if (canWrite && status && !['ordered', 'cancelled', 'archived'].includes(status)) {
      menuItems.push({
        key: 'cancel-po',
        label: 'Cancel PO',
        destructive: true,
        onClick: handleCancelPOConfirm,
      });
    }

    if (canWrite && ['ordered', 'approved', 'rejected', 'cancelled'].includes(status)) {
      menuItems.push({
        key: 'archive',
        label: 'Archive',
        onClick: handleArchiveConfirm,
      });
    }

    if (canWrite && (status === 'draft' || status === 'rejected')) {
      menuItems.push({
        key: 'edit',
        label: 'Edit',
        onClick: () => setMode('edit'),
      });
    }

    if (status === 'draft' && canWrite) {
      primaryAction = (
        <Button onClick={handleSubmitConfirm} variant="save">
          Submit For Approval
        </Button>
      );
    }

    if (status === 'submitted' && canApprove) {
      primaryAction = (
        <Button variant="save" onClick={handleApproveConfirm}>
          Approve
        </Button>
      );
      menuItems.push({
        key: 'reject',
        label: 'Reject',
        destructive: true,
        onClick: handleRejectConfirm,
      });
      menuItems.push({
        key: 'edit-submitted',
        label: 'Edit',
        onClick: () => setMode('edit'),
      });
    }

    if (status === 'approved' && canOrder) {
      primaryAction = (
        <Button variant="save" onClick={handleOrderConfirm}>
          Order
        </Button>
      );
    }

    return (
      <>
        {primaryAction}
        {menuItems.length > 0 ? <DropdownAction item={po} items={menuItems} /> : null}
      </>
    );
  }, [
    po,
    orderId,
    mode,
    isReadOnly,
    isAllowed,
    handleCanceEditConfirm,
    handleCancelPOConfirm,
    handleArchiveConfirm,
    handleSubmitConfirm,
    handleApproveConfirm,
    handleRejectConfirm,
    handleOrderConfirm,
  ]);

  return isAllowed(PageName, 'r') ? (
    validPO ? (
      <EntityForm
        title={formTitle}
        breadcrumbLabel="Purchase Order"
        icon={<FiClipboard />}
        fields={poFields}
        initialValues={po}
        extraContent={
          <div className={POStyles.extraContentContainer}>
            <DetailsTable
              itemModalHeader="Order Details"
              parentId={orderId}
              columns={poDetailsColumns}
              editable={isAllowed(PageName, 'w') && !isReadOnly}
              itemFields={poItemFields}
              data={tableData}
              onChange={detailsUpdated}
            />
            {tableError && (
              <div className={POStyles.tableError}>{tableError}</div>
            )}
            <div className={POStyles.summaryContainer}>
              <div className={POStyles.notesContainer}></div>
              <div className={POStyles.totalContainer}>
                <div className={POStyles.totalLabel}>Total Excluding VAT:</div>
                <div className={POStyles.totalValue}>
                  {totalExcluded.toFixed(2)}
                </div>
                <div className={POStyles.totalLabel}>Total VAT:</div>
                <div className={POStyles.totalValue}>{totalVAT.toFixed(2)}</div>
                <div className={POStyles.totalLabel}>Total Including VAT:</div>
                <div className={`${POStyles.totalValue} ${POStyles.highlight}`}>
                  {totalIncluded.toFixed(2)}
                </div>
              </div>
            </div>
            <div className={POStyles.extraSection}>
              <RichTextEditor
                label="Terms and Conditions"
                value={richText.termsAndConditions}
                onChange={(val) =>
                  setRichText((prev) => ({ ...prev, termsAndConditions: val }))
                }
                readOnly={isReadOnly}
                placeholder="Enter terms and conditions..."
              />
            </div>
          </div>
        }
        onSubmit={handleSaveConfirm}
        onValidate={(values) => {
          const errors = {};
          const items = tableData?.items || [];
          if (!Array.isArray(items) || items.length === 0) {
            errors.supplierId = 'At least one order detail is required';
            setTableError('At least one order detail is required');
          } else {
            setTableError('');
          }
          return errors;
        }}
        backPath={backPath}
        width="100%"
        showSubmitButton={false}
        readOnly={isReadOnly}
        headerActions={headerActions}
      />
    ) : (
      <InvalidPage message="Purchase order not found." />
    )
  ) : (
    <InvalidPage />
  );
}
