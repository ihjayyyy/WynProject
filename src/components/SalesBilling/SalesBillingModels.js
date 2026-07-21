import * as Yup from 'yup';

export const SalesBillingFields = (
  projects = [],
  customers = [],
  onFieldChanged,
  selectedCustomerId
) => {
  const filteredProjects = selectedCustomerId
    ? projects.filter((p) => Number(p.customerId) === Number(selectedCustomerId))
    : projects;

  return [
    { name: 'code', label: 'Billing Code', span: 'span1', readOnly: true, hidden: true },
    {
      name: 'customerName',
      label: 'Customer Name',
      type: 'select',
      options: customers.map((c) => ({ label: c.name, value: c.name })),
      searchable: true,
      span: 'span2',
      onChange: (val, values, setValues) => {
        const found = customers.find((c) => c.name === val);
        const valuesCopy = {
          ...values,
          customerName: found?.name || '',
          customerId: found?.id ?? '',
          customerNumber: found?.contactNumber || '',
          contactPerson: found?.customerName || '',
          vatType: found?.vatType || '',
          projectId: '',
          projectContractAmount: '',
        };
        setValues(valuesCopy);
        if (onFieldChanged) onFieldChanged('customerName', val, valuesCopy);
      },
      // Must have Customer
      validator: Yup.string()
        .typeError('Customer is required')
        .required('Customer is required'),
    },
    {
      name: 'projectId',
      label: 'Project',
      type: 'select',
      options: filteredProjects.map((p) => ({ label: p.projectNo + " | " + p.name, value: p.id })),
      searchable: true,
      span: 'span2',
      onChange: (val, values, setValues) => {
        const found = projects.find((p) => p.id === val);

        if (!found) {
          const valuesCopy = {
            ...values,
            projectContractAmount: '',
            customerName: '',
            customerId: '',
            customerNumber: '',
            contactPerson: '',
            name: '',
          };
          setValues(valuesCopy);
          if (onFieldChanged) onFieldChanged('projectId', val, valuesCopy);
          return;
        }

        const relatedCustomer = customers.find((c) => c.id === found.customerId);

        const valuesCopy = {
          ...values,
          projectContractAmount: found.contractPrice || '',
          customerName: relatedCustomer?.name || '',
          customerId: found.customerId ?? '',
          customerNumber: relatedCustomer?.contactNumber || found.contactNumber || '',
          contactPerson: relatedCustomer?.customerName || found.contactPerson || '',
          vatType: relatedCustomer?.vatType || values.vatType || '',
          name: found.name || '',
        };

        setValues(valuesCopy);
        if (onFieldChanged) onFieldChanged('projectId', val, valuesCopy);
      },
      // Must have Project
      validator: Yup.number()
        .typeError('Project is required')
        .required('Project is required'),
    },
    { name: 'name', hidden: true, span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span2' },
    { name: 'billingDate', label: 'Billing Date', type: 'date', span: 'span2', validator: Yup.date().typeError('Invalid date').required('Billing Date is required') },
    { name: 'customerNumber', label: 'Customer Number', span: 'span2' },
    { name: 'contactPerson', label: 'Contact Person', span: 'span2' },

    { name: 'spacer-3', type: 'spacer', span: 'span2' },
    { name: 'dueDate', label: 'Due Date', type: 'date', span: 'span2' },

    { name: 'description', label: 'Description', type: 'textarea', span: 'span5' },
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
      onChange: (val, values, setValues) => {
        const valuesCopy = { ...values, vatType: val };
        setValues(valuesCopy);
        if (onFieldChanged) onFieldChanged('vatType', val, valuesCopy);
      }
    },
    {
      name: 'projectContractAmount',
      label: 'Project Contract Amount',
      type: 'number',
      span: 'span2',
      // Must have Project Contract Amount
      validator: Yup.number()
        .typeError('Project Contract Amount must be a number')
        .required('Project Contract Amount is required')
        .moreThan(0, 'Project Contract Amount must be greater than 0'),
    },
    { name: 'amount', label: 'Amount', type: 'number', span: 'span1', hidden: true },
  ];
};

export const SalesBillingDetailsColumns = [
  { header: 'Name', key: 'name', width: '200px' },
  { header: 'Description', key: 'description', width: '200px' },
  // { header: 'Quantity', key: 'quantity', align: 'right', width: '80px' },
  {
    header: 'Amount',
    key: 'amount',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.amount || 0).toFixed(2),
  },
  {
    header: 'Discount',
    key: 'discount',
    align: 'right',
    width: '100px',
    render: (it) => Number(it.discount || 0).toFixed(2),
  },
  {
    header: 'VAT',
    key: 'vat',
    align: 'right',
    width: '100px',
    render: (it) => Number(it.vat || 0).toFixed(2),
  },
  {
    header: 'Total Amount',
    key: 'totalAmount',
    align: 'right',
    width: '140px',
    render: (it) => Number(it.totalAmount || 0).toFixed(2),
  },
];

export const computeVatAndAmount = (subamount, vatType) => {
  let vat = 0;
  let totalAmount = subamount;
  switch (vatType) {
    case 'Included':
      vat = Math.round((subamount - subamount / 1.12) * 100) / 100;
      break;
    case 'Not Included':
      vat = Math.round(subamount * 0.12 * 100) / 100;
      totalAmount = subamount + vat;
      break;
    default:
      vat = 0;
      break;
  }
  return { vat, totalAmount };
};

export const SalesBillingItemsFields = (billing = {}) => [
  { name: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'name', label: 'Name', type: 'text', required: true, validator: Yup.string().required('Name is required') },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'quantity', label: 'Quantity', type: 'number', initialvalue: 0, hidden: true },
  {
    name: 'amount',
    label: 'Amount',
    type: 'currency',
    initialvalue: 0,
    validator: Yup.number().typeError('Amount must be a number').min(0, 'Amount cannot be negative').required('Amount is required'),
    onChange: (item, updateField, fields) => {
      const discountField = fields.find((f) => f.name === 'discount');
      const subamount = Number(item.value || 0) - Number(discountField?.value || 0);
      const { vat, totalAmount } = computeVatAndAmount(subamount, billing?.vatType || '');
      updateField('vat', vat);
      updateField('totalAmount', totalAmount);
    },
  },
  {
    name: 'discount',
    label: 'Discount',
    type: 'currency',
    initialvalue: 0,
    validator: Yup.number().typeError('Discount must be a number').min(0, 'Discount cannot be negative').nullable(),
    onChange: (item, updateField, fields) => {
      const amountField = fields.find((f) => f.name === 'amount');
      const subamount = Number(amountField?.value || 0) - Number(item.value || 0);
      const { vat, totalAmount } = computeVatAndAmount(subamount, billing?.vatType || '');
      updateField('vat', vat);
      updateField('totalAmount', totalAmount);
    },
  },
  {
    name: 'vat',
    label: `VAT (${billing?.vatType || 'N/A'})`,
    type: 'currency',
    readonly: true,
    validator: Yup.number().typeError('VAT must be a number').min(0, 'VAT cannot be negative').nullable(),
  },
  { name: 'totalAmount', label: 'Total Amount', type: 'currency', readonly: true, validator: Yup.number().typeError('Total Amount must be a number').min(0, 'Total Amount cannot be negative').nullable() },
];