'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import SalesBillingService from '@/services/SalesBilling';
import { SalesBillingFields, SalesBillingDetailsColumns, SalesBillingItemsFields } from './SalesBillingModels';
import ProjectService from '@/services/Project';
import CustomerService from '@/services/Customer';
import Button from '../ui/Button/Button';

export default function SalesBillingForm() {
  const PageName = 'Finance.SalesBilling';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [billingId, setBillingId] = useState(Number(searchParams.get('id') || 0));
  const [mode, setMode] = useState(searchParams.get('mode') || (billingId ? 'view' : 'edit'));
  const [billing, setBilling] = useState({});
  const [validBilling, setValidBilling] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    ProjectService.getProjects().then(({ data }) => setProjects(Array.isArray(data) ? data : []));
    CustomerService.getCustomers().then(({ data }) => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  // Sync the local billing state when the user interacts with the main form fields
  const handleMainFieldChange = (name, value, allValues) => {
    setBilling(prev => ({ ...prev, ...allValues }));
  };

  const billingFields = useMemo(() => 
    SalesBillingFields(projects, customers, handleMainFieldChange), 
    [projects, customers]
  );

  // DYNAMIC FIX: useMemo ensures the fields (and labels) refresh whenever billing.vatType updates
  const billingItemFields = useMemo(() => {
    return SalesBillingItemsFields(billing);
  }, [billing.id, billing.status, billing.vatType]);

  useEffect(() => {
    getBilling();
  }, [billingId]);

  const getToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getBilling = async () => {
    let initBilling = { ...SalesBillingService.INITIAL_SALES_BILLING };
    if (billingId !== 0) {
      const res = await SalesBillingService.getSalesBillingById(billingId);
      if (res?.data && Object.keys(res.data).length !== 0) {
        initBilling = res.data;
        setValidBilling(true);
      } else {
        setValidBilling(false);
      }
    } else {
      setMode('new');
      setValidBilling(true);
      const today = getToday();
      initBilling = {
        ...initBilling,
        status: 'draft',
        billingDate: today,
        dueDate: today,
        paymentDate: today,
      };
    }
    setBilling(initBilling);
    setTableData({ items: initBilling.children || [], deletedItems: initBilling.deletedChildren || [] });
  };

  const isReadOnly = useMemo(() => (validBilling ? mode === 'view' : true), [validBilling, mode]);

  const formTitle = useMemo(() => (
    <div>
      <span>{billing.code || 'New Billing'}</span>
      {billing.status && <span style={{ marginLeft: 8, fontSize: '0.8em', opacity: 0.7 }}>({billing.status})</span>}
    </div>
  ), [billing.code, billing.status]);

  const detailsUpdated = (items, deletedItems) => {
    const totalVat = (items || []).reduce((sum, item) => sum + (Number(item.vat) || 0), 0);
    setTableData({ items, deletedItems });
    setBilling(prev => ({ ...prev, children: items, deletedChildren: deletedItems, vat: totalVat }));
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

    const updatedBilling = {
      ...billing,
      ...entity,
      children: normalizedChildren,
      deletedChildren: normalizedDeletedChildren,
      status: billing.status || 'draft',
      billingType: billing.billingType || 'Standard',
      billingDate: ensureISODate(billing.billingDate || entity.billingDate),
      dueDate: ensureISODate(billing.dueDate || entity.dueDate),
      paymentDate: ensureISODate(billing.paymentDate || entity.paymentDate),
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

  if (!isAllowed(PageName, 'r')) return <InvalidPage message="Access Denied" />;
  if (!validBilling) return <InvalidPage message="Billing not found." />;

  const SaveButton = () =>
    isAllowed(PageName, 'w') && !isReadOnly ? (
      <Button type="submit" variant="save">{billing.id ? 'Save' : 'Create'}</Button>
    ) : null;

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Billing"
      icon={<FiList />}
      fields={billingFields}
      initialValues={billing}
      extraContent={
        <DetailsTable
          itemModalHeader="Billing Details"
          parentId={billingId}
          columns={SalesBillingDetailsColumns}
          editable={isAllowed(PageName, 'w') && !isReadOnly}
          itemFields={billingItemFields}
          data={tableData}
          onChange={detailsUpdated}
        />
      }
      onSubmit={handleSaveConfirm}
      backPath="/finance/billings"
      readOnly={isReadOnly}
      showSubmitButton={false}
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SaveButton />
        </div>
      }
    />
  );
}