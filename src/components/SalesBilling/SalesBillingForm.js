'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList, FiEdit2, FiCheckCircle, FiXCircle, FiArchive } from 'react-icons/fi';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import SalesBillingService from '@/services/SalesBilling';
import { SalesBillingFields, SalesBillingDetailsColumns, SalesBillingItemsFields, computeVatAndAmount } from './SalesBillingModels';
import { getProjects } from '@/services/Project';
import CustomerService from '@/services/Customer';
import Button from '../ui/Button/Button';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import SBStyles from './SalesBilling.module.scss';

export default function SalesBillingForm() {
  const PageName = 'Finance.SalesBilling';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [billingId, setBillingId] = useState(Number(searchParams.get('id') || 0));
  const [mode, setMode] = useState(searchParams.get('mode') || (billingId ? 'view' : 'edit'));
  // null = not yet loaded; {} = loaded but empty/new; object = loaded with data
  const [billing, setBilling] = useState(null);
  const [validBilling, setValidBilling] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncluded] = useState(0);

  useEffect(() => {
    getProjects().then(({ data }) => setProjects(Array.isArray(data) ? data : []));
    CustomerService.getCustomers().then(({ data }) => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  // Recompute totals whenever items are loaded or changed
  useEffect(() => {
    const items = tableData.items || [];
    const vat = items.reduce((sum, item) => sum + (Number(item.vat) || 0), 0);
    const inc = items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
    setTotalVAT(vat);
    setTotalIncluded(inc);
    setTotalExcluded(inc - vat);
  }, [tableData.items]);

  // Sync the local billing state when the user interacts with the main form fields
  const handleMainFieldChange = (name, value, allValues) => {
    setBilling(prev => ({ ...prev, ...allValues }));

    if (name === 'vatType') {
      setTableData(prev => {
        const recalculated = (prev.items || []).map(item => {
          const subamount = Number(item.amount || 0) - Number(item.discount || 0);
          const { vat, totalAmount } = computeVatAndAmount(subamount, value);
          return { ...item, vat, totalAmount };
        });
        return { ...prev, items: recalculated };
      });
    }
  };

  const billingFields = useMemo(() => 
    SalesBillingFields(projects, customers, handleMainFieldChange), 
    [projects, customers]
  );

  // DYNAMIC FIX: useMemo ensures the fields (and labels) refresh whenever billing.vatType updates
  const billingItemFields = useMemo(() => {
    return SalesBillingItemsFields(billing);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing?.id, billing?.status, billing?.vatType]);

  useEffect(() => {
    getBilling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingId]);

  const getToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toDateString = (val) => {
    if (!val) return getToday();
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return getToday();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return getToday();
    }
  };

  // null = not yet read, false = read but no data, object = parsed generated billing
  const generatedBillingRef = React.useRef(null);

  const getBilling = async () => {
    let initBilling = { ...SalesBillingService.INITIAL_SALES_BILLING };
    if (billingId !== 0) {
      const res = await SalesBillingService.getSalesBillingById(billingId);
      if (res?.data && Object.keys(res.data).length !== 0) {
        initBilling = {
          ...res.data,
          billingDate: toDateString(res.data.billingDate),
          dueDate: toDateString(res.data.dueDate),
          paymentDate: toDateString(res.data.paymentDate),
        };
        setValidBilling(true);
      } else {
        setValidBilling(false);
      }
    } else {
      setMode('new');
      setValidBilling(true);
      const today = getToday();

      // Read sessionStorage only on first call. Cache in a ref so React Strict Mode's
      // second effect invocation (which empties sessionStorage) still gets the data.
      if (generatedBillingRef.current === null) {
        const raw = sessionStorage.getItem('generatedBilling');
        if (raw) {
          sessionStorage.removeItem('generatedBilling');
          try {
            generatedBillingRef.current = JSON.parse(raw);
          } catch {
            generatedBillingRef.current = false;
          }
        } else {
          generatedBillingRef.current = false;
        }
      }

      const generated = generatedBillingRef.current;
      if (generated) {
        initBilling = {
          ...initBilling,
          ...generated,
          billingDate: toDateString(generated.billingDate),
          dueDate: toDateString(generated.dueDate),
          paymentDate: toDateString(generated.paymentDate),
          children: generated.children || [],
          deletedChildren: generated.deletedChildren || [],
        };
        console.log('Initialized billing from generated data:', initBilling);
      } else {
        initBilling = {
          ...initBilling,
          status: 'Draft',
          billingDate: today,
          dueDate: today,
          paymentDate: today,
        };
      }
    }
    setBilling(initBilling);
    setTableData({ items: initBilling.children || [], deletedItems: initBilling.deletedChildren || [] });
  };

  const isReadOnly = useMemo(() => (validBilling ? mode === 'view' || ['billed', 'cancelled', 'closed'].includes((billing?.status || '').toLowerCase()) : true), [validBilling, mode, billing?.status]);

  const formTitle = useMemo(() => (
    <div style={{ display: 'flex', gap: 8 , alignItems: 'center' }}>
      <span>{billing?.id ? billing.salesBillingNo : 'New Billing'}</span>
      {billing?.status && <StatusBadge status={billing.status} style={{ marginLeft: 8 }} />}
    </div>
  ), [billing?.id, billing?.salesBillingNo, billing?.status]);

  const detailsUpdated = (items, deletedItems) => {
    setTableData({ items, deletedItems });
    setBilling(prev => ({ ...prev, children: items, deletedChildren: deletedItems }));
  };

  const save = async (entity) => {
    // Helper to ensure ISO date string
    const ensureISODate = (val) => {
      if (!val) return new Date().toISOString();
      // If already ISO string, return as is
      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return val;
      // If yyyy-mm-dd, convert to ISO
      if (/\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val).toISOString();
      return new Date().toISOString();
    };

    // Ensure all required fields for children and deletedChildren
    const normalizeChild = (item) => ({
      name: item.name ?? '',
      code: item.code ?? '',
      id: item.id ?? 0,
      parentId: item.parentId ?? 0,
      billingId: item.billingId ?? 0,
      materialId: item.materialId ?? 0,
      amount: item.amount ?? 0,
      description: item.description ?? '',
      quantity: item.quantity ?? 0,
      vat: item.vat ?? 0,
      discount: item.discount ?? 0,
      totalAmount: item.totalAmount ?? 0,
    });

    const normalizedChildren = (tableData.items || []).map(normalizeChild);
    const normalizedDeletedChildren = (tableData.deletedItems || []).map(normalizeChild);

    const mergedBilling = { ...billing, ...entity };
    // Backend endpoint no longer accepts these fields in save payload.
    delete mergedBilling.status;
    delete mergedBilling.paymentDate;

    const selectedCustomerName = mergedBilling.customerName || '';
    const resolvedCustomerId = Number(
      mergedBilling.customerId ||
      customers.find((customer) => customer.name === selectedCustomerName)?.id ||
      0
    );

    const updatedBilling = {
      ...mergedBilling,
      children: normalizedChildren,
      deletedChildren: normalizedDeletedChildren,
      customerId: resolvedCustomerId,
      billingType: billing.billingType || 'Standard',
      billingDate: ensureISODate(billing.billingDate || entity.billingDate),
      dueDate: ensureISODate(billing.dueDate || entity.dueDate),
      amount: totalIncluded,
      vat: totalVAT,
    };
    let res;
    if (!updatedBilling.id || updatedBilling.id === 0) {
      res = await SalesBillingService.createSalesBilling(updatedBilling);
    } else {
      res = await SalesBillingService.editSalesBilling(updatedBilling.id, updatedBilling);
    }
    if (res?.error) {
      toast.error('Failed to save Billing.');
    } else {
      toast.success('Billing has been saved.');
      router.push('/finance/billings');
    }
  };

  const handleSaveConfirm = (entity) => {
    confirmModal.show('Save Billing', 'Are you sure?', 'Save', 'primary', () => () => save(entity));
  };

  const handleMarkAsBilled = () => {
    confirmModal.show(
      'Mark as Billed',
      `Are you sure you want to mark billing "${billing?.salesBillingNo || billing?.id}" as billed?`,
      'Mark as Billed',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.markAsBilled(billingId);
        if (error) {
          toast.error('Failed to mark as billed.');
        } else {
          toast.success('Billing marked as billed.');
          setBilling((prev) => ({ ...prev, status: 'Billed' }));
        }
      }
    );
  };

  const handleCancel = () => {
    confirmModal.show(
      'Cancel Billing',
      `Are you sure you want to cancel billing "${billing?.salesBillingNo || billing?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.cancelSalesBilling(billingId);
        if (error) {
          toast.error('Failed to cancel billing.');
        } else {
          toast.success('Billing cancelled.');
          setBilling((prev) => ({ ...prev, status: 'Cancelled' }));
          setMode('view');
        }
      }
    );
  };

  const handleClose = () => {
    confirmModal.show(
      'Close Billing',
      `Are you sure you want to close billing "${billing?.salesBillingNo || billing?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.closeSalesBilling(billingId);
        if (error) {
          toast.error('Failed to close billing.');
        } else {
          toast.success('Billing closed.');
          setBilling((prev) => ({ ...prev, status: 'Closed' }));
          setMode('view');
            router.push('/finance/billings');
        }
      }
    );
  };

  if (!isAllowed(PageName, 'r')) return <InvalidPage message="Access Denied" />;
  if (!validBilling) return <InvalidPage message="Billing not found." />;
  if (billing === null) return null; // wait for getBilling to populate

  const SaveButton = () =>
    isAllowed(PageName, 'w') && !isReadOnly ? (
      <Button type="submit" variant="save">{billing.id ? 'Save' : 'Create'}</Button>
    ) : null;

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel='Billing'
      icon={<FiList />}
      fields={billingFields}
      initialValues={billing}
      extraContent={
        <div className={SBStyles.extraContentContainer}>
          <DetailsTable
            itemModalHeader="Billing Details"
            parentId={billingId}
            columns={SalesBillingDetailsColumns}
            editable={isAllowed(PageName, 'w') && !isReadOnly}
            itemFields={billingItemFields}
            data={tableData}
            onChange={detailsUpdated}
          />
          <div className={SBStyles.summaryContainer}>
            <div className={SBStyles.notesContainer}>

            </div>
            <div className={SBStyles.totalContainer}>
              <div className={SBStyles.totalLabel}>Total Excluding VAT:</div>
              <div className={SBStyles.totalValue}>{totalExcluded.toFixed(2)}</div>
              <div className={SBStyles.totalLabel}>Total VAT:</div>
              <div className={SBStyles.totalValue}>{totalVAT.toFixed(2)}</div>
              <div className={SBStyles.totalLabel}>Total Including VAT:</div>
              <div className={`${SBStyles.totalValue} ${SBStyles.highlight}`}>{totalIncluded.toFixed(2)}</div>
            </div>
          </div>
        </div>
      }
      onSubmit={handleSaveConfirm}
      backPath="/finance/billings"
      readOnly={isReadOnly}
      showSubmitButton={false}
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          {isReadOnly && billing?.status?.toLowerCase() === 'draft' && isAllowed(PageName, 'w') && (
            <Button variant="primary" onClick={() => setMode('edit')}>Edit</Button>
          )}
          {isReadOnly && billingId !== 0 && billing?.status?.toLowerCase() === 'draft' && isAllowed(PageName, 'w') && (
            <Button variant="primary" icon={<FiCheckCircle />} onClick={handleMarkAsBilled}>Mark as Billed</Button>
          )}
          {/* Cancel Billing - shown when not already cancelled */}
          {isAllowed(PageName, 'w') && billingId !== 0 && (billing?.status || '').toLowerCase() !== 'cancelled' && (
            <Button variant="outlineDanger" icon={<FiXCircle />} onClick={handleCancel}>Cancel Billing</Button>
          )}
          {/* Close Billing - only when already cancelled */}
          {isAllowed(PageName, 'w') && billingId !== 0 && (billing?.status || '').toLowerCase() === 'cancelled' && (
            <Button variant="primary" icon={<FiArchive />} onClick={handleClose}>Close Billing</Button>
          )}
          {!isReadOnly && billingId !== 0 && (
            <Button variant="outlineDanger" onClick={() => setMode('view')}>Cancel</Button>
          )}
          <SaveButton />
        </div>
      }
    />
  );
}