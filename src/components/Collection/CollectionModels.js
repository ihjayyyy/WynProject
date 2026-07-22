import * as Yup from 'yup';

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
    validator: Yup.number()
      .typeError('Customer is required')
      .required('Customer is required'),
  },
  { name: 'spacer-1', type: 'spacer', span: 'span4' },
  { name: 'date', label: 'Date', type: 'date', span: 'span2', validator: Yup.date().typeError('Invalid date').required('Date is required') },

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
    validator: Yup.number()
      .typeError('Withholding Tax % must be a number')
      .min(0, 'Withholding Tax % cannot be less than 0')
      .max(100, 'Withholding Tax % cannot be greater than 100')
      .nullable(),
  },
  { name: 'spacer-2', type: 'spacer', span: 'span4' },

  { name: 'receiptNumber', label: 'Receipt Number', span: 'span2' },
  { name: 'description', label: 'Description', type: 'textarea', span: 'span5' },
  { name: 'spacer-3', type: 'spacer', span: 'span1' },

  { name: 'checkNumber', label: 'Check Number', span: 'span2' },

];

export const CollectionDetailsColumns = [
  // { header: 'Collection No.', key: 'collectionNumber', width: '160px' },
  { header: 'Name', key: 'name', width: '180px' },
  { header: 'Billing Number', key: 'salesBillingNo', width: '200px' },

  { header: 'Amount to Collect', key: 'amount', align: 'right', width: '130px', render: (it) => Number(it.amount || 0).toFixed(2) },
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

        // Some billings report balance as 0 even though they are still unpaid
        // (e.g. balance hasn't been computed/synced on the backend yet).
        // Fall back to the billing's amount in that case so the field isn't
        // silently autofilled with 0.
        const rawBalance = Number(found.balance) || 0;
        const rawAmount = Number(found.amount) || 0;
        const amount = rawBalance > 0 ? rawBalance : rawAmount;
        updateField('amount', amount);

        // Calculate amountPaid so that balance becomes zero after withholding
        const pct = Number(withholdingTaxPercent) || 0;
        let paid = 0;
        if (pct >= 100) {
          paid = amount; // avoid division by zero; fallback
        } else {
          paid = amount / (1 - pct / 100);
        }
        // round to 2 decimals for currency-like values
        const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
        const paidRounded = round(paid);
        const tax = round(paidRounded * (pct / 100));
        const total = round(paidRounded - tax);

        updateField('amountPaid', paidRounded);
        updateField('withholdingTax', tax);
        updateField('totalAmountPaid', total);
        // compute balance (should be ~0)
updateField('balance', Math.max(0, round(amount - total)));
      }
    },
    validator: Yup.number().typeError('Billing is required').required('Billing is required'),
  },
  // { name: 'collectionNumber', label: 'Collection Number', type: 'text' },
  { name: 'amount', label: 'Amount to Collect', type: 'number', readonly: true, initialvalue: 0, validator: Yup.number().typeError('Amount must be a number').min(0, 'Amount cannot be negative').required('Amount is required') },
{
  name: 'amountPaid',
  label: 'Amount Paid',
  type: 'number',
  initialvalue: 0,
  onChange: (target, updateField, nextFields) => {
    const paid = Number(target.value) || 0;
    const pct = Number(withholdingTaxPercent) || 0;

    const tax = parseFloat((paid * (pct / 100)).toFixed(2));
    const total = parseFloat((paid - tax).toFixed(2));

    const amountField = nextFields.find((f) => f.name === 'amount');
    const amount = Number(amountField?.value) || 0;

    // Never allow balance to become negative
    const balance = Math.max(
      0,
      parseFloat((amount - total).toFixed(2))
    );

    updateField('withholdingTax', tax);
    updateField('totalAmountPaid', total);
    updateField('balance', balance);
  },
  validator: Yup.number()
    .typeError('Amount Paid must be a number')
    .min(0, 'Amount Paid cannot be negative')
    .required('Amount Paid is required')
    .test(
      'not-overpaid',
      'Amount Paid cannot exceed the remaining balance',
      function (value) {
        const { amount } = this.parent;

        const paid = Number(value) || 0;
        const originalAmount = Number(amount) || 0;
        const pct = Number(withholdingTaxPercent) || 0;

        const tax = paid * (pct / 100);
        const totalPaid = paid - tax;

        // Prevent overpayment (negative balance)
        return totalPaid <= originalAmount;
      }
    ),
},
  { name: 'withholdingTax', label: 'Withholding Tax', type: 'number', readonly: true, initialvalue: 0, validator: Yup.number().typeError('Withholding Tax must be a number').min(0, 'Withholding Tax cannot be negative').nullable() },
  { name: 'totalAmountPaid', label: 'Total Amount Paid', type: 'number', initialvalue: 0, readonly: true, validator: Yup.number().typeError('Total Amount Paid must be a number').min(0, 'Total Amount Paid cannot be negative').nullable() },
  { name: 'balance', label: 'Balance', type: 'number', initialvalue: 0, readonly: true, validator: Yup.number().typeError('Balance must be a number').nullable() },
];