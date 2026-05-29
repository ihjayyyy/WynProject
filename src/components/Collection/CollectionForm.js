'use client';

import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList, FiEdit2, FiXCircle, FiArchive, FiPrinter } from 'react-icons/fi';
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
      amountPaid: item.amountPaid ?? 0,
      totalAmountPaid: item.totalAmountPaid ?? 0,
      withholdingTax: item.withholdingTax ?? 0,
      balance: item.balance ?? 0,
      billingId: item.billingId ?? 0,
      account: item.account ?? '',
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
  };

  const handleSaveConfirm = (entity) => {
    confirmModal.show('Save Collection', 'Are you sure?', 'Save', 'primary', () => () => save(entity));
  };

  const handleCancelCollection = () => {
    confirmModal.show(
      'Cancel Collection',
      `Are you sure you want to cancel collection "${collection?.collectionNo || collection?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await CollectionService.cancelCollection(collectionId);
        if (error) {
          toast.error('Failed to cancel collection.');
        } else {
          toast.success('Collection cancelled.');
          setCollection((prev) => ({ ...prev, status: 'Cancelled' }));
          setMode('view');
        }
      }
    );
  };

  const handleCloseCollection = () => {
    confirmModal.show(
      'Close Collection',
      `Are you sure you want to close collection "${collection?.collectionNo || collection?.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await CollectionService.closeCollection(collectionId);
        if (error) {
          toast.error('Failed to close collection.');
        } else {
          toast.success('Collection closed.');
          setCollection((prev) => ({ ...prev, status: 'Closed' }));
          setMode('view');
          router.push('/finance/collections');
        }
      }
    );
  };

  if (!isAllowed(PageName, 'r')) return <InvalidPage message="Access Denied" />;
  if (!validCollection) return <InvalidPage message="Collection not found." />;
  if (collection === null) return null;

  const SaveButton = () =>
    isAllowed(PageName, 'w') && !isReadOnly ? (
      <Button type="submit" variant="save">{collection.id ? 'Save' : 'Create'}</Button>
    ) : null;

  const PrintButton = () => {
    return isAllowed(PageName, 'r') && isReadOnly && collectionId ? 
    <>
    <Button variant="primary" icon={<FiPrinter size={14} />} /*disabled={actionLoading}*/ onClick={async () => {
      // setActionLoading(true);
      await printSalesCollection_byId(collectionId);
      // setActionLoading(false);
      }}>Print Invoice</Button>
    </>
    : null
    }

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
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          {isReadOnly && collection?.status?.toLowerCase() === 'draft' && isAllowed(PageName, 'w') && (
            <Button variant="primary" onClick={() => setMode('edit')}>Edit</Button>
          )}
          {/* Cancel Collection - shown when not already cancelled */}
          {isAllowed(PageName, 'w') && collectionId !== 0 && (collection?.status || '').toLowerCase() !== 'cancelled' && (
            <Button variant="outlineDanger" icon={<FiXCircle />} onClick={handleCancelCollection}>Cancel Collection</Button>
          )}
          {/* Close Collection - only when already cancelled */}
          {isAllowed(PageName, 'w') && collectionId !== 0 && (collection?.status || '').toLowerCase() === 'cancelled' && (
            <Button variant="primary" icon={<FiArchive />} onClick={handleCloseCollection}>Close Collection</Button>
          )}
          {!isReadOnly && collectionId !== 0 && (
            <Button variant="outlineDanger" onClick={() => setMode('view')}>Cancel</Button>
          )}
          <SaveButton />
          <PrintButton />
        </div>
      }
    />
  );
}
