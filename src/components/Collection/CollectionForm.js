'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList, FiEdit2, FiXCircle, FiArchive, FiPrinter, FiCheckCircle } from 'react-icons/fi';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import CollectionService, { printSalesCollection_byId } from '@/services/Collection';
import { CollectionFields, CollectionDetailsColumns, CollectionItemFields } from './CollectionModels';
import CustomerService from '@/services/Customer';
import SalesBillingService from '@/services/SalesBilling';
import Button from '../ui/Button/Button';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import CollectionStyles from './Collection.module.scss';

export default function CollectionForm() {
  const PageName = 'Finance.Collection';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [collectionId, setCollectionId] = useState(Number(searchParams.get('id') || 0));
  const [mode, setMode] = useState(searchParams.get('mode') || (collectionId ? 'view' : 'edit'));
  const [collection, setCollection] = useState(null);
  const [validCollection, setValidCollection] = useState(false);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [tableError, setTableError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [billings, setBillings] = useState([]);
  const [computedAmount, setComputedAmount] = useState(0);
  const [computedTotalWithholdingTax, setComputedTotalWithholdingTax] = useState(0);
  const [computedTotalAmountReceived, setComputedTotalAmountReceived] = useState(0);
  const [computedTotalAmountPaid, setComputedTotalAmountPaid] = useState(0);
  // Tracks whether a save / status-change action is currently in flight, so
  // header buttons and confirm-modal actions can be disabled to prevent
  // double-click double-submits.
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    CustomerService.getCustomers().then(({ data }) => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  // Recompute totals whenever items are loaded or changed (same pattern as SalesBillingForm)
  useEffect(() => {
    const items = tableData.items || [];
    const wht = parseFloat(items.reduce((sum, it) => sum + (Number(it.withholdingTax) || 0), 0).toFixed(2));
    const amt = parseFloat(items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0).toFixed(2));
    const received = parseFloat(items.reduce((sum, it) => sum + (Number(it.amountPaid) || 0), 0).toFixed(2));
    const paid = parseFloat(items.reduce((sum, it) => sum + (Number(it.totalAmountPaid) || 0), 0).toFixed(2));
    setComputedTotalWithholdingTax(wht);
    setComputedAmount(amt);
    setComputedTotalAmountReceived(received);
    setComputedTotalAmountPaid(paid);
  }, [tableData.items]);

  const handleMainFieldChange = (name, value, allValues) => {
    setCollection((prev) => ({ ...prev, ...allValues }));
    if (name === 'customerId' && value) {
      SalesBillingService.getSalesBillingByCustomerId(value).then(({ data }) =>
        setBillings(Array.isArray(data) ? data : [])
      );
    }
  };

  const collectionFields = useMemo(
    () => CollectionFields(customers, handleMainFieldChange),
    [customers]
  );

  const collectionItemFields = useMemo(
    () => CollectionItemFields(billings, collection?.withholdingTaxPercent || 0),
    [billings, collection?.withholdingTaxPercent]
  );

  useEffect(() => {
    getCollection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

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

  const getCollection = async () => {
    let initCollection = { ...CollectionService.INITIAL_COLLECTION };
    if (collectionId !== 0) {
      const res = await CollectionService.getCollectionById(collectionId);
      if (res?.data && Object.keys(res.data).length !== 0) {
        initCollection = {
          ...res.data,
          date: toDateString(res.data.date),
        };
        setValidCollection(true);
        if (initCollection.customerId) {
          SalesBillingService.getSalesBillingByCustomerId(initCollection.customerId).then(({ data }) =>
            setBillings(Array.isArray(data) ? data : [])
          );
        }
      } else {
        setValidCollection(false);
      }
    } else {
      setMode('new');
      setValidCollection(true);
      initCollection = {
        ...initCollection,
        date: getToday(),
      };
    }
    setCollection(initCollection);
    setTableData({
      items: initCollection.children || [],
      deletedItems: initCollection.deletedChildren || [],
    });
  };

  const isReadOnly = useMemo(
    () => (validCollection ? mode === 'view' : true),
    [validCollection, mode]
  );

  const formTitle = useMemo(
    () => <span>{collection?.id ? collection.receiptNumber || `Collection #${collection.id}` : 'New Collection'}</span>,
    [collection?.id, collection?.receiptNumber]
  );

  const detailsUpdated = (items, deletedItems) => {
    setTableData({ items, deletedItems });
    // clear table-level error when user modifies details
    if (Array.isArray(items) && items.length > 0) setTableError('');
    const totalWithholdingTax = items.reduce((sum, it) => sum + (Number(it.withholdingTax) || 0), 0);
    const amount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    setCollection((prev) => ({
      ...prev,
      children: items,
      deletedChildren: deletedItems,
      totalWithholdingTax: parseFloat(totalWithholdingTax.toFixed(2)),
      amount: parseFloat(amount.toFixed(2)),
    }));
  };

  const save = async (entity) => {
    // Guard against double-submit from a fast double-click on Save/Create,
    // or from the confirm modal's Save button being clicked twice.
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const ensureISODate = (val) => {
        if (!val) return new Date().toISOString();
        if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return val;
        if (/\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val).toISOString();
        return new Date().toISOString();
      };

      const normalizeChild = (item) => ({
        name: item.name ?? '',
        code: item.code ?? '',
        id: item.id ?? 0,
        parentId: item.parentId ?? 0,
        collectionId: item.collectionId ?? 0,
        amount: item.amount ?? 0,        // add this
        amountPaid: item.amountPaid ?? 0,
        totalAmountPaid: item.totalAmountPaid ?? 0,
        withholdingTax: item.withholdingTax ?? 0,
        balance: item.balance ?? 0,
        billingId: item.billingId ?? 0,
      });

      const mergedCollection = { ...collection, ...entity };

      const updatedCollection = {
        ...mergedCollection,
        amount: computedAmount,
        totalWithholdingTax: computedTotalWithholdingTax,
        totalAmountReceived: computedTotalAmountReceived,
        totalAmountPaid: computedTotalAmountPaid,
        children: (tableData.items || []).map(normalizeChild),
        deletedChildren: (tableData.deletedItems || []).map(normalizeChild),
        date: ensureISODate(mergedCollection.date),
      };

      let res;
      if (!updatedCollection.id || updatedCollection.id === 0) {
        res = await CollectionService.createCollection(updatedCollection);
      } else {
        res = await CollectionService.updateCollection(updatedCollection.id, updatedCollection);
      }

      if (res?.error) {
        toast.error('Failed to save Collection.');
      } else {
        toast.success('Collection has been saved.');
        router.push('/finance/collections');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveConfirm = (entity) => {
    if (actionLoading) return;
    confirmModal.show('Save Collection', 'Are you sure?', 'Save', 'primary', () => () => save(entity));
  };

  const handleCancelCollection = () => {
    if (actionLoading) return;
    confirmModal.show(
      'Cancel Collection',
      `Are you sure you want to cancel collection "${collection?.collectionNo || collection?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        if (actionLoading) return;
        setActionLoading(true);
        const { error } = await CollectionService.cancelCollection(collectionId);
        if (error) {
          toast.error('Failed to cancel collection.');
        } else {
          toast.success('Collection cancelled.');
          setCollection((prev) => ({ ...prev, status: 'Cancelled' }));
          setMode('view');
        }
        setActionLoading(false);
      }
    );
  };

  const handleMarkAsPaidCollection = () => {
    if (actionLoading) return;
    confirmModal.show(
      'Mark as Paid',
      `Are you sure you want to mark collection "${collection?.collectionNo || collection?.id}" as paid?`,
      'Confirm',
      'primary',
      () => async () => {
        if (actionLoading) return;
        setActionLoading(true);
        const { error } = await CollectionService.markCollectionAsPaid(collectionId);
        if (error) {
          toast.error('Failed to mark collection as paid.');
        } else {
          toast.success('Collection marked as paid.');
          setCollection((prev) => ({ ...prev, status: 'Paid' }));
          setMode('view');
        }
        setActionLoading(false);
      }
    );
  };

  const handleCloseCollection = () => {
    if (actionLoading) return;
    confirmModal.show(
      'Close Collection',
      `Are you sure you want to close collection "${collection?.collectionNo || collection?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        if (actionLoading) return;
        setActionLoading(true);
        const { error } = await CollectionService.closeCollection(collectionId);
        if (error) {
          toast.error('Failed to close collection.');
        } else {
          toast.success('Collection closed.');
          setCollection((prev) => ({ ...prev, status: 'Closed' }));
          setMode('view');
          router.push('/finance/collections');
        }
        setActionLoading(false);
      }
    );
  };

  const handlePrintCollection = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await printSalesCollection_byId(collectionId);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAllowed(PageName, 'r')) return <InvalidPage message="Access Denied" />;
  if (!validCollection) return <InvalidPage message="Collection not found." />;
  if (collection === null) return null;

  const headerActions = (() => {
    const status = String(collection?.status || '').toLowerCase();
    const canWrite = isAllowed(PageName, 'w');
    const canRead = isAllowed(PageName, 'r');

    if (!isReadOnly) {
      return (
        <>
          {collectionId !== 0 ? (
            <Button variant="outlineDanger" disabled={actionLoading} onClick={() => setMode('view')}>Cancel</Button>
          ) : null}
          {canWrite ? (
            <Button type="submit" variant="save" disabled={actionLoading}>{collection.id ? 'Save' : 'Create'}</Button>
          ) : null}
        </>
      );
    }

    const menuItems = [];
    let primaryAction = null;

    if (status === 'draft' && canWrite) {
      const hasPaidAmount = (Number(collection?.totalAmountPaid) || 0) !== 0;
      if (hasPaidAmount) {
        primaryAction = (
          <Button variant="primary" icon={<FiCheckCircle />} disabled={actionLoading} onClick={handleMarkAsPaidCollection}>Mark as Paid</Button>
        );
      }
      menuItems.push({
        key: 'edit',
        label: 'Edit',
        disabled: () => actionLoading,
        onClick: () => setMode('edit'),
      });
    }

    if (canWrite && collectionId !== 0 && status !== 'cancelled') {
      menuItems.push({
        key: 'cancel-collection',
        label: 'Cancel Collection',
        icon: <FiXCircle size={14} />,
        destructive: true,
        disabled: () => actionLoading,
        onClick: handleCancelCollection,
      });
    }

    if (canWrite && collectionId !== 0 && status === 'cancelled') {
      menuItems.push({
        key: 'close-collection',
        label: 'Close Collection',
        icon: <FiArchive size={14} />,
        disabled: () => actionLoading,
        onClick: handleCloseCollection,
      });
    }

    if (canRead && isReadOnly && collectionId) {
      menuItems.push({
        key: 'print',
        label: 'Print Invoice',
        icon: <FiPrinter size={14} />,
        disabled: () => actionLoading,
        onClick: handlePrintCollection,
      });
    }

    return (
      <>
        {primaryAction}
        {menuItems.length > 0 ? <DropdownAction item={collection} items={menuItems} /> : null}
      </>
    );
  })();

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Collection"
      icon={<FiList />}
      fields={collectionFields}
      onValidate={async (values) => {
        const errors = {};
        if (!tableData.items || (Array.isArray(tableData.items) && tableData.items.length === 0)) {
          errors.customerId = 'At least one collection detail is required';
          setTableError(errors.customerId);
        } else {
          setTableError('');
        }
        return errors;
      }}
      initialValues={collection}
      extraContent={
        <div className={CollectionStyles.extraContentContainer}>
          <DetailsTable
            itemModalHeader="Collection Details"
            parentId={collectionId}
            columns={CollectionDetailsColumns}
            editable={isAllowed(PageName, 'w') && !isReadOnly}
            itemFields={collectionItemFields}
            data={tableData}
            onChange={detailsUpdated}
          />
          {tableError ? <div style={{ color: 'red', marginTop: 8 }}>{tableError}</div> : null}
          <div className={CollectionStyles.summaryContainer}>
            <div className={CollectionStyles.notesContainer} />
            <div className={CollectionStyles.totalContainer}>
              <div className={CollectionStyles.totalLabel}>Amount:</div>
              <div className={CollectionStyles.totalValue}>{computedAmount.toFixed(2)}</div>
              <div className={CollectionStyles.totalLabel}>Total Withholding Tax:</div>
              <div className={CollectionStyles.totalValue}>{computedTotalWithholdingTax.toFixed(2)}</div>
              <div className={CollectionStyles.totalLabel}>Total Amount Received:</div>
              <div className={CollectionStyles.totalValue}>{computedTotalAmountReceived.toFixed(2)}</div>
              <div className={CollectionStyles.totalLabel}>Total Amount Paid:</div>
              <div className={`${CollectionStyles.totalValue} ${CollectionStyles.highlight}`}>{computedTotalAmountPaid.toFixed(2)}</div>
            </div>
          </div>
        </div>
      }
      onSubmit={handleSaveConfirm}
      backPath="/finance/collections"
      readOnly={isReadOnly}
      showSubmitButton={false}
      headerActions={headerActions}
    />
  );
}