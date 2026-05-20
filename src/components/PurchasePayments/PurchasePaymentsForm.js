'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { getSuppliers } from '@/services/Supplier';
import { GetInvoicedBySupplier as getInvoicesBySupplier } from '@/services/PurchaseInvoice';
import {
  createPayment,
  getPaymentById,
  updatePayment,
} from '@/services/PurchasePayments';
import {
  PurchasePaymentFields,
  PurchasePaymentDetailsColumns,
  PurchasePaymentItemFields,
} from './PurchasePaymentsModel';
import Button from '../ui/Button/Button';
import PurchasePaymentsStyles from './PurchasePayments.module.scss';

const getToday = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ensureISODate = (val) => {
  if (!val) return new Date().toISOString();
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return val;
  if (/\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val).toISOString();
  return new Date().toISOString();
};

export default function PurchasePaymentsForm() {
  const PageName = 'Purchase.Payments';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [computedAmount, setComputedAmount] = useState(0);
  const [computedWithholdingTax, setComputedWithholdingTax] = useState(0);
  const [computedNetAmount, setComputedNetAmount] = useState(0);
  const [withholdingTaxPercentage, setWithholdingTaxPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState(
    Number(searchParams.get('id') || 0),
  );
  const [mode, setMode] = useState(
    searchParams.get('mode') || (paymentId ? 'view' : 'new'),
  );
  const [payment, setPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const initialPayment = useMemo(
    () => ({
      paymentNumber: '',
      name: '',
      code: '',
      supplierId: 0,
      supplierName: '',
      contactNumber: '',
      address: '',
      contactPerson: '',
      email: '',
      supplierReceiptNumber: '',
      paymentDate: getToday(),
      checkNumber: '',
      withholdingTaxPercentage: 0,
    }),
    [],
  );

  useEffect(() => {
    const loadSuppliers = async () => {
      const res = await getSuppliers();
      setSuppliers(Array.isArray(res.data) ? res.data : []);
      setIsLoading(false);
    };
    loadSuppliers();
  }, []);

  const toDateString = (val) => {
    if (!val) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return toDateString();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return toDateString();
    }
  };

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) return;
      setLoadingPayment(true);
      const res = await getPaymentById(paymentId);
      if (!res?.error && res.data) {
        const p = {
          ...res.data,
          paymentDate: toDateString(res.data.paymentDate),
        };
        setPayment(p);
        setTableData({
          items: p.children || [],
          deletedItems: p.deletedChildren || [],
        });
        // preload invoices for supplier
        if (p.supplierId) fetchInvoices(p.supplierId);
      }
      setLoadingPayment(false);
    };
    loadPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

  const fetchInvoices = async (supplierId) => {
    if (!supplierId) {
      setInvoices([]);
      return;
    }

    const res = await getInvoicesBySupplier(supplierId);
    if (res && !res.error && Array.isArray(res.data)) {
      setInvoices(res.data);
      // If we already have table items loaded (e.g. viewing an existing payment),
      // enrich them with invoice name/code from the fetched invoices so the table renders correctly.
      setTableData((prev) => {
        const items = (prev.items || []).map((it) => {
          const found = res.data.find(
            (i) => Number(i.id) === Number(it.invoiceId),
          );
          if (found) {
            const material =
              found.children && found.children.length
                ? found.children[0]
                : null;
            return {
              ...it,
              name:
                material?.name || found.invoiceNumber || found.name || it.name,
              code: material?.code || found.code || it.code,
              invoiceAmount: Number(
                it.invoiceAmount || found.balance || found.invoiceAmount || 0,
              ),
            };
          }
          return it;
        });
        return { ...prev, items };
      });
    } else {
      setInvoices([]);
    }
  };

  const handleMainFieldChange = useCallback(
    (name, value, allValues, setValues) => {
      if (name === 'supplierId') {
        const supplier = suppliers.find((s) => Number(s.id) === Number(value));
        const nextValues = {
          ...allValues,
          supplierName: supplier?.name || '',
          contactNumber: supplier?.contactNumber || '',
          address: supplier?.address || '',
          contactPerson: supplier?.contactPerson || '',
          email: supplier?.email || '',
          name: supplier?.name || '',
          code: supplier?.code || '',
        };
        if (setValues) setValues(nextValues);
        fetchInvoices(value);
      }

      if (name === 'withholdingTaxPercentage') {
        setWithholdingTaxPercentage(Number(value) || 0);
      }
    },
    [suppliers],
  );

  useEffect(() => {
    const items = tableData.items || [];
    const amount = parseFloat(
      items
        .reduce((sum, it) => sum + (Number(it.invoiceAmount) || 0), 0)
        .toFixed(2),
    );
    const withholding = parseFloat(
      items
        .reduce((sum, it) => sum + (Number(it.withholdingTax) || 0), 0)
        .toFixed(2),
    );
    const net = parseFloat(
      items
        .reduce((sum, it) => sum + (Number(it.totalAmountPaid) || 0), 0)
        .toFixed(2),
    );

    setComputedAmount(amount);
    setComputedWithholdingTax(Number(withholding));
    setComputedNetAmount(Number(net));
  }, [tableData.items, withholdingTaxPercentage]);

  const paymentFields = useMemo(
    () => PurchasePaymentFields(suppliers, handleMainFieldChange),
    [suppliers, handleMainFieldChange],
  );

  const paymentItemFields = useMemo(
    () => PurchasePaymentItemFields(invoices, withholdingTaxPercentage),
    [invoices, withholdingTaxPercentage],
  );

  const detailsUpdated = (items, deletedItems) => {
    setTableData({ items, deletedItems });
  };

  const normalizeChild = (item) => ({
    name: item.name ?? '',
    code: item.code ?? '',
    id: item.id ?? 0,
    parentId: item.parentId ?? 0,
    paymentId: item.paymentId ?? 0,
    invoiceId: item.invoiceId ?? 0,
    invoiceAmount: Number(item.invoiceAmount) || 0,
    paidAmount: Number(item.paidAmount) || 0,
    withholdingTax: Number(item.withholdingTax) || 0,
    totalAmountPaid: Number(item.totalAmountPaid) || 0,
    balance: Number(item.balance) || 0,
  });

  const savePayment = async (values) => {
    const supplier = suppliers.find(
      (s) => Number(s.id) === Number(values.supplierId),
    );
    const payload = {
      ...values,
      name: supplier?.name || values.name || '',
      code: supplier?.code || values.code || '',
      supplierReceiptNumber: values.supplierReceiptNumber || '',
      supplierId: Number(values.supplierId) || 0,
      supplierName: supplier?.name || values.supplierName || '',
      contactNumber: supplier?.contactNumber || values.contactNumber || '',
      address: supplier?.address || values.address || '',
      contactPerson: supplier?.contactPerson || values.contactPerson || '',
      email: supplier?.email || values.email || '',
      paymentDate: ensureISODate(values.paymentDate),
      checkNumber: values.checkNumber || '',
      amount: computedAmount,
      withholdingTax: computedWithholdingTax,
      withholdingTaxPercentage: Number(values.withholdingTaxPercentage) || 0,
      netAmount: computedNetAmount,
      children: (tableData.items || []).map(normalizeChild),
      deletedChildren: (tableData.deletedItems || []).map(normalizeChild),
    };

    let res;
    if (paymentId && paymentId !== 0) {
      res = await updatePayment(paymentId, payload);
    } else {
      res = await createPayment(payload);
    }

    if (res?.error) {
      toast.error('Failed to save payment.');
      return;
    }

    toast.success('Payment has been saved.');
    router.push('/purchase/payments');
  };

  const handleSaveConfirm = (values) => {
    confirmModal.show(
      'Save Payment',
      'Are you sure you want to create this payment?',
      'Save',
      'primary',
      () => () => savePayment(values),
    );
  };

  if (mode === 'view') {
    if (!isAllowed(PageName, 'r'))
      return <InvalidPage message="Access Denied" />;
  } else {
    if (!isAllowed(PageName, 'w'))
      return <InvalidPage message="Access Denied" />;
  }

  if (isLoading || loadingPayment) return null;

  return (
    <EntityForm
      key={formKey}
      title="New Purchase Payment"
      breadcrumbLabel="Purchase Payment"
      icon={<FiList />}
      fields={paymentFields}
      initialValues={payment || initialPayment}
      extraContent={
        <div className={PurchasePaymentsStyles.extraContentContainer}>
          <DetailsTable
            itemModalHeader="Payment Details"
            parentId={paymentId}
            columns={PurchasePaymentDetailsColumns}
            editable={true}
            showActions={false}
            itemFields={paymentItemFields}
            data={tableData}
            onChange={detailsUpdated}
          />
          <div className={PurchasePaymentsStyles.summaryContainer}>
            <div className={PurchasePaymentsStyles.notesContainer} />
            <div className={PurchasePaymentsStyles.totalContainer}>
              <div className={PurchasePaymentsStyles.totalLabel}>Amount:</div>
              <div className={PurchasePaymentsStyles.totalValue}>
                {computedAmount.toFixed(2)}
              </div>

              <div className={PurchasePaymentsStyles.totalLabel}>
                Withholding Tax:
              </div>
              <div className={PurchasePaymentsStyles.totalValue}>
                {computedWithholdingTax.toFixed(2)}
              </div>

              <div className={PurchasePaymentsStyles.totalLabel}>
                Net Amount:
              </div>
              <div
                className={`${PurchasePaymentsStyles.totalValue} ${PurchasePaymentsStyles.highlight}`}>
                {computedNetAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      }
      onSubmit={handleSaveConfirm}
      backPath="/purchase/payments"
      readOnly={mode === 'view'}
      showSubmitButton={false}
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          {mode === 'view' && isAllowed(PageName, 'w') && (
            <Button variant="primary" onClick={() => setMode('edit')}>
              Edit
            </Button>
          )}

          {mode !== 'view' && (
            <>
              {paymentId !== 0 && (
                <Button
                  variant="outlineDanger"
                  onClick={() => {
                    // Cancel edit: if editing existing payment, revert to view and reset table data and form
                    setTableData({
                      items: payment?.children || [],
                      deletedItems: payment?.deletedChildren || [],
                    });
                    setMode('view');
                    setFormKey((k) => k + 1);
                    if (payment?.supplierId) fetchInvoices(payment.supplierId);
                  }}>
                  Cancel
                </Button>
              )}

              {isAllowed(PageName, 'w') && (
                <Button type="submit" variant="save">
                  {paymentId !== 0 ? 'Save' : 'Create'}
                </Button>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
