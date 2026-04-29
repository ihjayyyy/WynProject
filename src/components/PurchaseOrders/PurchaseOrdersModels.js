import * as Yup from 'yup';

export const SalesBillingFields = (
  projects = [],
  customers = [],
  onFieldChanged
) => [
  { name: 'code', label: 'Billing Code', span: 'span1', readOnly: true },

  {
    name: 'customerName',
    label: 'Customer Name',
    type: 'select',
    options: customers.map((c) => ({
      label: c.name,
      value: c.name,
    })),
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const found = customers.find((c) => c.name === val);

      const valuesCopy = {
        ...values,
        customerName: found?.name || '',
        customerNumber: found?.contactNumber || '',
        contactPerson: found?.customerName || '',
        vatType: found?.vatType || '',
      };

      setValues(valuesCopy);

      if (onFieldChanged) {
        onFieldChanged('customerName', val, valuesCopy);
      }
    },
  },

  {
    name: 'projectId',
    label: 'Project',
    type: 'select',
    options: projects.map((p) => ({
      label: p.name,
      value: p.id,
    })),
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const found = projects.find((p) => p.id === val);

      if (!found) {
        const clearedValues = {
          ...values,
          projectContractAmount: '',
          customerName: '',
          customerNumber: '',
          contactPerson: '',
          name: '',
        };

        setValues(clearedValues);

        if (onFieldChanged) {
          onFieldChanged('projectId', val, clearedValues);
        }

        return;
      }

      const valuesCopy = {
        ...values,
        projectContractAmount: found.contractPrice || '',
        customerName: found.attention || '',
        customerNumber: found.contactNumber || '',
        contactPerson: found.contactPerson || '',
        name: found.name || '',
      };

      setValues(valuesCopy);

      if (onFieldChanged) {
        onFieldChanged('projectId', val, valuesCopy);
      }
    },
  },

  { name: 'name', hidden: true, span: 'span1' },
  { name: 'spacer-2', type: 'spacer', span: 'span1' },

  { name: 'billingDate', label: 'Billing Date', type: 'date', span: 'span2' },
  { name: 'customerNumber', label: 'Customer Number', span: 'span2' },
  { name: 'contactPerson', label: 'Contact Person', span: 'span2' },
  {
    name: 'vatType',
    label: 'VAT Type',
    type: 'select',
    options: [
      { label: 'Included', value: 'Included' },
      { label: 'Not Included', value: 'Not Included' },
      { label: 'NON-VAT', value: 'NON-VAT' },
    ],
    span: 'span1',
  },
  { name: 'spacer-3', type: 'spacer', span: 'span1' },
  { name: 'paymentDate', label: 'Payment Date', type: 'date', span: 'span2' },

  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    span: 'span4',
  },

  { name: 'spacer-4', type: 'spacer', span: 'span2' },

  { name: 'dueDate', label: 'Due Date', type: 'date', span: 'span2' },

  { name: 'balance', label: 'Balance', type: 'number', span: 'span1' },
  { name: 'amount', label: 'Amount', type: 'number', span: 'span1' },
  {
    name: 'projectContractAmount',
    label: 'Project Contract Amount',
    type: 'number',
    span: 'span1',
  },

  {
    name: 'status',
    label: 'Status',
    type: 'text',
    span: 'span2',
    hidden: true,
  },

  {
    name: 'billingType',
    label: 'Billing Type',
    type: 'text',
    span: 'span2',
    hidden: true,
  },
];

export const SalesBillingDetailsColumns = [
  { header: 'Name', key: 'name', width: '200px' },
  { header: 'Milestone', key: 'milestone', width: '120px' },
  {
    header: '% of Work',
    key: 'percentageOfWork',
    align: 'right',
    width: '100px',
    render: (it) => Number(it.percentageOfWork || 0).toFixed(2),
  },
  {
    header: 'Amount',
    key: 'amount',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.amount || 0).toFixed(2),
  },
  { header: 'Description', key: 'description', width: '200px' },
];

// ---------------------------------------------------------------------------
// VAT helper — mirrors PO logic, uses Sales Billing vatType casing
// ---------------------------------------------------------------------------
const computeVatAndAmount = (subamount, vatType) => {
  let vat = 0;
  let amount = subamount;

  switch (vatType) {
    case 'Included':
      vat = Math.round((subamount - subamount / 1.12) * 100) / 100;
      break;
    case 'Not Included':
      vat = Math.round(subamount * 0.12 * 100) / 100;
      amount = subamount + vat;
      break;
    case 'NON-VAT':
    default:
      vat = 0;
      break;
  }

  return { vat, amount };
};

// ---------------------------------------------------------------------------
// SalesBillingItemsFields
// - `amount`     = what the user types (acts as the unit cost / gross amount)
// - `discount`   = deducted from amount to get subamount
// - `vat`        = computed from subamount based on vatType (readonly)
// - `totalAmount`= final VAT-adjusted amount (readonly)
// - `billingId`  = NOT here; inject it in the save payload: { ...item, billingId: billing.id }
// ---------------------------------------------------------------------------
export const SalesBillingItemsFields = (billing) => [
  { name: 'id',          label: 'ID',          type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId',    label: 'Parent ID',   type: 'number', hidden: true, initialvalue: 0 },
  { name: 'materialId',  label: 'Material ID', type: 'number', hidden: true, initialvalue: 0 },

  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    validator: Yup.string().required('Name is required'),
  },

  { name: 'code',             label: 'Code',      type: 'text',   hidden: true },
  { name: 'milestone',        label: 'Milestone', type: 'text' },
  { name: 'percentageOfWork', label: '% of Work', type: 'number' },

  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    initialvalue: 1,
    validator: Yup.number()
      .required('Quantity is required')
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than 0.')
      .min(1, 'Quantity must be greater than 0.'),
  },

  {
    name: 'unitCost',
    label: 'Unit Cost',
    type: 'currency',
    hidden: true,
    initialvalue: 0,
  },

  {
    name: 'discount',
    label: 'Discount',
    type: 'currency',
    initialvalue: 0,
    validator: Yup.number().required('Discount is required'),
    onChange: (item, updateField, fields) => {
      const amountField = fields.find((f) => f.name === 'amount');
      const subamount   = Number(amountField?.value || 0) - Number(item.value || 0);
      const vatType     = billing?.vatType || '';
      const { vat, amount } = computeVatAndAmount(subamount, vatType);
      updateField('vat', vat);
      updateField('totalAmount', amount);
    },
  },

  {
    name: 'vat',
    label: `VAT (${billing?.vatType || ''})`,
    type: 'currency',
    readonly: true,
    initialvalue: 0,
    validator: Yup.number().required('VAT is required'),
  },

  {
    name: 'amount',
    label: 'Amount',
    type: 'currency',
    required: true,
    initialvalue: 0,
    validator: Yup.number().required('Amount is required'),
    onChange: (item, updateField, fields) => {
      const discountField = fields.find((f) => f.name === 'discount');
      const subamount     = Number(item.value || 0) - Number(discountField?.value || 0);
      const vatType       = billing?.vatType || '';
      const { vat, amount } = computeVatAndAmount(subamount, vatType);
      updateField('vat', vat);
      updateField('totalAmount', amount);
    },
  },

  {
    name: 'totalAmount',
    label: 'Total Amount',
    type: 'currency',
    readonly: true,
    initialvalue: 0,
  },

  { name: 'description', label: 'Description', type: 'textarea' },
];