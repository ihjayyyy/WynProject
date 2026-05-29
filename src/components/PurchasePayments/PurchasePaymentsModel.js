import * as Yup from 'yup';

export const PurchasePaymentFields = (suppliers = [], onFieldChanged) => [
  { name: 'paymentNumber', hidden: true },
  {
    name: 'supplierId',
    label: 'Supplier',
    type: 'select',
    options: suppliers.map((s) => ({ label: s.name, value: s.id })),
    searchable: true,
    span: 'span2',
    onChange: (value, allValues, setValues) =>
      typeof onFieldChanged === 'function' &&
      onFieldChanged('supplierId', value, allValues, setValues),
    validator: Yup.number().typeError('Supplier is required').required('Supplier is required'),
  },
  { name: 'spacer-1', type: 'spacer', span: 'span4' },
  { name: 'paymentDate', label: 'Payment Date', type: 'date', span: 'span2', validator: Yup.date().typeError('Invalid date').required('Payment Date is required') },
  {
    name: 'withholdingTaxPercentage',
    label: 'Withholding Tax %',
    type: 'number',
    span: 'span2',
    onChange: (value, allValues, setValues) =>
      typeof onFieldChanged === 'function' &&
      onFieldChanged('withholdingTaxPercentage', value, allValues, setValues),
    validator: Yup.number()
      .typeError('Withholding Tax % must be a number')
      .min(0, 'Withholding Tax % cannot be less than 0')
      .max(100, 'Withholding Tax % cannot be greater than 100')
      .nullable(),
  },
  { name: 'spacer-2', type: 'spacer', span: 'span4' },
  {
    name: 'supplierReceiptNumber',
    label: 'Supplier Receipt Number',
    span: 'span2',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    span: 'span5',
  },
  { name: 'spacer-3', type: 'spacer', span: 'span1' },
  { name: 'checkNumber', label: 'Check Number', span: 'span2' },

  { name: 'supplierName', hidden: true },
  { name: 'contactNumber', hidden: true },
  { name: 'address', hidden: true },
  { name: 'contactPerson', hidden: true },
  { name: 'email', hidden: true },
  { name: 'name', hidden: true },
  { name: 'code', hidden: true },
];

export const PurchasePaymentDetailsColumns = [
  {
    header: 'Invoice',
    key: 'invoiceNumber',
    width: '180px',
    render: (it) => it.invoiceNumber,
  },
  {
    header: 'Invoice Amount',
    key: 'invoiceAmount',
    align: 'right',
    width: '120px',
    render: (it) => Number(it.invoiceAmount || 0).toFixed(2),
  },
  {
    header: 'Amount Paid',
    key: 'paidAmount',
    align: 'right',
    width: '120px',
    render: (it) => Number(it.paidAmount || 0).toFixed(2),
  },
  {
    header: 'Withholding Tax',
    key: 'withholdingTax',
    align: 'right',
    width: '120px',
    render: (it) => Number(it.withholdingTax || 0).toFixed(2),
  },
  {
    header: 'Net Amount',
    key: 'totalAmountPaid',
    align: 'right',
    width: '120px',
    render: (it) => Number(it.totalAmountPaid || 0).toFixed(2),
  },
  {
    header: 'Remaining Balance',
    key: 'balance',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.balance || 0).toFixed(2),
  },
];

export const PurchasePaymentItemFields = (
  invoices = [],
  withholdingTaxPercent = 0,
) => [
  { name: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'paymentId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'invoiceNumber', type: 'text', hidden: true, initialvalue: '' },
  {
    name: 'invoiceId',
    label: 'Invoice',
    type: 'select',
    options: invoices.map((i) => ({
      label: `${i.invoiceNumber || i.name || `Invoice #${i.id}`} `,
      value: i.id,
    })),
    searchable: true,
    span: 'span4',
    onChange: (target, updateField, fields) => {
      const found = invoices.find((i) => Number(i.id) === Number(target.value));
      const invoiceAmount = Number(found?.balance ?? found?.invoiceAmount ?? 0);
      updateField('invoiceAmount', invoiceAmount);
      const material =
        found?.children && found.children.length ? found.children[0] : null;
      const code = material?.code || found?.code || '';
      const displayName =
        material?.name ||
        found?.invoiceNumber ||
        found?.name ||
        `Invoice #${found?.id || 0}`;
      updateField('name', displayName);
      updateField('code', code);
      updateField('invoiceNumber', found?.invoiceNumber || '');

      const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
      updateField('paidAmount', 0);
      updateField('withholdingTax', 0);
      updateField('totalAmountPaid', 0);
      updateField('balance', round(invoiceAmount));
    },
    validator: Yup.number().typeError('Invoice is required').required('Invoice is required'),
  },
  {
    name: 'invoiceAmount',
    label: 'Invoice Amount',
    type: 'number',
    readonly: true,
    initialvalue: 0,
    span: 'span2',
    validator: Yup.number().typeError('Invoice Amount must be a number').min(0, 'Invoice Amount cannot be negative').nullable(),
  },
  {
    name: 'paidAmount',
    label: 'Paid Amount',
    type: 'number',
    initialvalue: 0,
    span: 'span2',
    onChange: (target, updateField, fields) => {
      const invoiceAmount = Number(
        fields.find((f) => f.name === 'invoiceAmount')?.value || 0,
      );
      const paid = Number(target.value) || 0;
      const pct = Number(withholdingTaxPercent) || 0;
      const tax = parseFloat((paid * (pct / 100)).toFixed(2));
      const total = parseFloat((paid - tax).toFixed(2));
      updateField('withholdingTax', tax);
      updateField('totalAmountPaid', total);
      updateField('balance', parseFloat((invoiceAmount - total).toFixed(2)));
    },
    validator: Yup.number().typeError('Paid Amount must be a number').min(0, 'Paid Amount cannot be negative').required('Paid Amount is required'),
  },
  {
    name: 'withholdingTax',
    label: 'Withholding Tax',
    type: 'number',
    initialvalue: 0,
    readonly: true,
    validator: Yup.number().typeError('Withholding Tax must be a number').min(0, 'Withholding Tax cannot be negative').nullable(),
  },
  {
    name: 'totalAmountPaid',
    label: 'Net Amount',
    type: 'number',
    initialvalue: 0,
    readonly: true,
    validator: Yup.number().typeError('Net Amount must be a number').min(0, 'Net Amount cannot be negative').nullable(),
  },
  {
    name: 'balance',
    label: 'Remaining Balance',
    type: 'number',
    readonly: true,
    initialvalue: 0,
    span: 'span2',
    validator: Yup.number().typeError('Balance must be a number').nullable(),
  },
];
