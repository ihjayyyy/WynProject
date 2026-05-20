import DropdownAction from '../ui/DropdownAction/DropdownAction';

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
  },
  { name: 'spacer-1', type: 'spacer', span: 'span4' },
  { name: 'paymentDate', label: 'Payment Date', type: 'date', span: 'span2' },
  {
    name: 'withholdingTaxPercentage',
    label: 'Withholding Tax %',
    type: 'number',
    span: 'span2',
    onChange: (value, allValues, setValues) =>
      typeof onFieldChanged === 'function' &&
      onFieldChanged('withholdingTaxPercentage', value, allValues, setValues),
  },
  { name: 'spacer-2', type: 'spacer', span: 'span4' },
  {
    name: 'supplierReceiptNumber',
    label: 'Supplier Receipt Number',
    span: 'span2',
  },
  { name: 'spacer-3', type: 'spacer', span: 'span6' },
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
    key: 'name',
    width: '220px',
  },
  {
    header: 'Invoice Amount',
    key: 'invoiceAmount',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.invoiceAmount || 0).toFixed(2),
  },
  {
    header: 'Paid Amount',
    key: 'paidAmount',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.paidAmount || 0).toFixed(2),
  },
  {
    header: 'Remaining Balance',
    key: 'balance',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.balance || 0).toFixed(2),
  },
  {
    header: 'Actions',
    key: 'actions',
    width: '120px',
    align: 'center',
    render: (item) => (
      <DropdownAction
        item={item}
        items={[{ key: 'noop', label: 'No actions available', disabled: true }]}
      />
    ),
  },
];

export const PurchasePaymentItemFields = (
  invoices = [],
  withholdingTaxPercent = 0,
) => [
  { name: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'paymentId', type: 'number', hidden: true, initialvalue: 0 },
  {
    name: 'invoiceId',
    label: 'Invoice',
    type: 'select',
    options: invoices.map((i) => ({
      label: `${i.invoiceNumber || i.name || `Invoice #${i.id}`} (${Number((i.balance ?? i.invoiceAmount) || 0).toFixed(2)})`,
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

      const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
      updateField('paidAmount', 0);
      updateField('withholdingTax', 0);
      updateField('totalAmountPaid', 0);
      updateField('balance', round(invoiceAmount));
    },
  },
  {
    name: 'invoiceAmount',
    label: 'Invoice Amount',
    type: 'number',
    readonly: true,
    initialvalue: 0,
    span: 'span2',
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
  },
  {
    name: 'withholdingTax',
    label: 'Withholding Tax',
    type: 'number',
    initialvalue: 0,
  },
  {
    name: 'totalAmountPaid',
    label: 'Net Amount',
    type: 'number',
    initialvalue: 0,
    readonly: true,
  },
  {
    name: 'balance',
    label: 'Remaining Balance',
    type: 'number',
    readonly: true,
    initialvalue: 0,
    span: 'span2',
  },
];
