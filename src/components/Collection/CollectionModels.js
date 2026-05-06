export const CollectionFields = (customers = [], onFieldChanged) => [
  { name: 'code', label: 'Collection Code', span: 'span1', readOnly: true, hidden: true },
  {
    name: 'customerId',
    label: 'Customer',
    type: 'select',
    options: customers.map((c) => ({ label: c.name, value: c.id })),
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const valuesCopy = { ...values, customerId: val };
      setValues(valuesCopy);
      if (onFieldChanged) onFieldChanged('customerId', val, valuesCopy);
    },
  },
  { name: 'spacer-1', type: 'spacer', span: 'span4' },
  { name: 'date', label: 'Date', type: 'date', span: 'span2' },

  {
    name: 'withholdingTaxPercent',
    label: 'Withholding Tax %',
    type: 'number',
    span: 'span2',
    onChange: (val, values, setValues) => {
      const valuesCopy = { ...values, withholdingTaxPercent: val };
      setValues(valuesCopy);
      if (onFieldChanged) onFieldChanged('withholdingTaxPercent', val, valuesCopy);
    },
  },
  { name: 'spacer-2', type: 'spacer', span: 'span4' },

  { name: 'receiptNumber', label: 'Receipt Number', span: 'span2' },
  { name: 'description', label: 'Description', type: 'textarea', span: 'span5' },
  { name: 'spacer-3', type: 'spacer', span: 'span1' },

  { name: 'checkNumber', label: 'Check Number', span: 'span2' },

];

export const CollectionDetailsColumns = [
  { header: 'Collection No.', key: 'collectionNumber', width: '160px' },
  { header: 'Name', key: 'name', width: '180px' },
  {
    header: 'Amount Paid',
    key: 'amountPaid',
    align: 'right',
    width: '130px',
    render: (it) => Number(it.amountPaid || 0).toFixed(2),
  },
  {
    header: 'Withholding Tax',
    key: 'withholdingTax',
    align: 'right',
    width: '130px',
    render: (it) => Number(it.withholdingTax || 0).toFixed(2),
  },
  {
    header: 'Total Amount Paid',
    key: 'totalAmountPaid',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.totalAmountPaid || 0).toFixed(2),
  },
  {
    header: 'Balance',
    key: 'balance',
    align: 'right',
    width: '120px',
    render: (it) => Number(it.balance || 0).toFixed(2),
  },
];

export const CollectionItemFields = (billings = [], withholdingTaxPercent = 0) => [
  { name: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'collectionId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'name',hidden:true, label: 'Billing Name', readonly: true, initialvalue: '' },
  { name: 'code', hidden: true, initialvalue: '' },
  {
    name: 'billingId',
    label: 'Billing',
    type: 'select',
    options: billings.map((b) => ({ label: b.salesBillingNo || b.name || `Billing #${b.id}`, value: b.id })),
    searchable: true,
    initialvalue: 0,
    onChange: (target, updateField, fields, val) => {
      const found = billings.find((b) => b.id === Number(target.value));
      if (found) {
        updateField('name', found.name || '');
        updateField('code', found.code || '');
        updateField('amount', found.amount || 0);
        updateField('balance', found.balance || 0);
      }
    },
  },
  { name: 'collectionNumber', label: 'Collection Number', type: 'text' },
  { name: 'amount', label: 'Amount', type: 'number', initialvalue: 0 },
  {
    name: 'amountPaid',
    label: 'Amount Paid',
    type: 'number',
    initialvalue: 0,
    onChange: (target, updateField, nextFields) => {
      const paid = Number(target.value) || 0;
      const tax = parseFloat((paid * (withholdingTaxPercent / 100)).toFixed(2));
      const total = parseFloat((paid - tax).toFixed(2));
      const amountField = nextFields.find((f) => f.name === 'amount');
      const amount = Number(amountField?.value) || 0;
      updateField('withholdingTax', tax);
      updateField('totalAmountPaid', total);
      updateField('balance', parseFloat((amount - total).toFixed(2)));
    },
  },
  { name: 'withholdingTax', label: 'Withholding Tax', type: 'number', initialvalue: 0 },
  { name: 'totalAmountPaid', label: 'Total Amount Paid', type: 'number', initialvalue: 0, readonly: true },
  { name: 'balance', label: 'Balance', type: 'number', initialvalue: 0, readonly: true },
];
