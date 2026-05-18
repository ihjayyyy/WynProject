'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from 'react';
import { useRouter } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { getSuppliers } from '@/services/Supplier';
import { GetAll as getAllInvoices } from '@/services/PurchaseInvoice';
import { createPayment } from '@/services/PurchasePayments';
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

  const fetchInvoices = async (supplierId) => {
    if (!supplierId) {
      setInvoices([]);
      return;
    }

    const res = await getAllInvoices();
    if (res && !res.error && Array.isArray(res.data)) {
      const filtered = res.data.filter(
        (invoice) => Number(invoice.supplierId) === Number(supplierId),
      );
      setInvoices(filtered);
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
    const amount = parseFloat(
      (tableData.items || [])
        .reduce((sum, it) => sum + (Number(it.paidAmount) || 0), 0)
        .toFixed(2),
    );
    const withholding = parseFloat(
      (amount * (withholdingTaxPercentage || 0)) / 100 || 0,
    ).toFixed(2);
    const net = parseFloat((amount - Number(withholding)).toFixed(2));

    setComputedAmount(amount);
    setComputedWithholdingTax(Number(withholding));
    setComputedNetAmount(Number(net));
  }, [tableData.items, withholdingTaxPercentage]);

  const paymentFields = useMemo(
    () => PurchasePaymentFields(suppliers, handleMainFieldChange),
    [suppliers, handleMainFieldChange],
  );

  const paymentItemFields = useMemo(
    () => PurchasePaymentItemFields(invoices),
    [invoices],
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

    const res = await createPayment(payload);
    if (res?.error) {
      toast.error('Failed to create payment.');
      return;
    }

    toast.success('Payment has been created.');
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

  if (!isAllowed(PageName, 'w')) return <InvalidPage message="Access Denied" />;
  if (isLoading) return null;

  return (
    <EntityForm
      title="New Purchase Payment"
      breadcrumbLabel="Purchase Payment"
      icon={<FiList />}
      fields={paymentFields}
      initialValues={initialPayment}
      extraContent={
        <div className={PurchasePaymentsStyles.extraContentContainer}>
          <DetailsTable
            itemModalHeader="Payment Details"
            parentId={0}
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
              <div className={PurchasePaymentsStyles.totalValue}>{computedAmount.toFixed(2)}</div>

              <div className={PurchasePaymentsStyles.totalLabel}>Withholding Tax:</div>
              <div className={PurchasePaymentsStyles.totalValue}>{computedWithholdingTax.toFixed(2)}</div>

              <div className={PurchasePaymentsStyles.totalLabel}>Net Amount:</div>
              <div className={`${PurchasePaymentsStyles.totalValue} ${PurchasePaymentsStyles.highlight}`}>{computedNetAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      }
      onSubmit={handleSaveConfirm}
      backPath="/purchase/payments"
      readOnly={false}
      showSubmitButton={false}
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="submit" variant="save">
            Create
          </Button>
        </div>
      }
    />
  );
}
