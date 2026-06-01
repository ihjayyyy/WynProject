import * as Yup from 'yup';

export const FormFields = (projects, onFieldhanged) => [
  { name: 'projectCode', label: 'Project Code', span: 'span1', readOnly: true },
  {
    name: 'projectId',
    label: 'Project',
    type: 'select',
    options: projects.map((s) => ({ label: s.name, value: s.id })),
    searchable: true,
    span: 'span3',
    onChange: (val, values, setValues) => {
      const found = projects.find((s) => s.id === val);
      if (!found) {
        const clearedValues = {
          ...values,
          code: '',
          name: '',
        };
        setValues(clearedValues);
        onFieldhanged('projectId', val, clearedValues);
        return;
      }
      const valuesCopy = { ...values, code: found.code, name: found.name };
      if (found) setValues(valuesCopy);
      onFieldhanged('projectId', val, valuesCopy);
    },
    validator: Yup.number()
      .typeError('Project is required')
      .required('Project is required'),
  },
  { name: 'code', hidden: true },
  { name: 'name', hidden: true },
  { name: 'spacer-1', type: 'spacer', span: 'span2' },
  {
    name: 'requestDate',
    label: 'Request Date',
    type: 'date',
    span: 'span2',
    validator: Yup.date()
      .typeError('Invalid date')
      .required('Request Date is required'),
  },
  { name: 'jobOrder', label: 'Job Order', type: 'textbox', span: 'span4' },
  { name: 'spacer-4', type: 'spacer', span: 'span2' },
  {
    name: 'requestedBy',
    label: 'Requested By',
    type: 'textbox',
    span: 'span2',
    validator: Yup.string().required('Requested By is required'),
  },
];

export const TableColumns = [
  {
    header: 'Material',
    key: 'material',
    width: '200px',
    render: (it) => {
      return it.code + ' - ' + it.name;
    },
  },
  {
    header: 'Qty',
    key: 'quantity',
    align: 'right',
    width: '80px',
    render: (it) => Number(it.quantity).toFixed(0) + ' ' + it.uom,
  },
  {
    header: 'Remarks',
    key: 'remarks',
    width: '200px',
    render: (it) => {
      return it.remarks;
    },
  },
];

export const ItemsFields = (materials, pr) => [
  { name: 'id', label: 'id', type: 'number', hidden: true, initialvalue: 0 },
  {
    name: 'parentId',
    label: 'id',
    type: 'number',
    hidden: true,
    initialvalue: 0,
  },
  {
    name: 'material',
    label: 'Material',
    type: 'select',
    options: materials.map(({ id, name }) => ({ value: id, name: name })),
    readonly: false,
    initialvalue: '',
    validator: Yup.string().required(`Material is required`),
    onChange: (item, updateField, fields) => {
      const material = materials.find((a) => a.id == item.value);
      if (!material) {
        updateField('code', '');
        updateField('name', '');
        updateField('uom', '');
        return;
      }
      updateField('code', material.code);
      updateField('name', material.name);
      updateField('uom', material.purchaseUnitOfMeasure);
    },
  },
  { name: 'code', label: 'Code', type: 'text', hidden: true },
  { name: 'name', label: 'Name', type: 'text', hidden: true },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    readonly: false,
    initialvalue: 1,
    validator: Yup.number()
      .required(`Quantity is required`)
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than 0.')
      .min(1, 'Quantity must be greater than 0.'),
    onChange: (item, updateField, fields) => {
      console.log('quantity changed:', item.quantity);
    },
  },
  { name: 'uom', label: 'Unit of Measure', type: 'text', readonly: true },
  { name: 'remarks', label: 'Remarks', type: 'text' },
];
