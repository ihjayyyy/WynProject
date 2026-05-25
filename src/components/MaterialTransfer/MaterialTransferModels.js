import * as Yup from "yup";

export const INITIAL_MATERIAL_TRANSFER = {
  name: '',
  code: '',
  children: [],
  deletedChildren: [],
  transferFrom: 0,
  transferFromType: '',
  transferTo: 0,
  transferToType: '',
  date: '',
  description: '',
};

const OPPOSITE_TYPE = {
  Warehouse: 'Project',
  Project: 'Warehouse',
};

export const FormFields = (warehouses = [], projects = [], onFieldChanged) => ([
  { name: 'name', label: 'Name', type: 'textbox', hidden: true },
  { name: 'code', label: 'Code', type: 'textbox', hidden: true },

  {
    name: 'transferFromType',
    label: 'From Type',
    type: 'select',
    options: [
      { label: 'Warehouse', value: 'Warehouse' },
      { label: 'Project', value: 'Project' },
    ],
    span: 'span2',
    onChange: (val, values, setValues) => {
      const opposite = OPPOSITE_TYPE[val] ?? '';
      setValues((prev) => ({
        ...prev,
        transferFromType: val,
        transferToType: opposite,
        transferFrom: 0,
        transferTo: 0,
        name: '',
        code: '',
      }));
      onFieldChanged?.('transferFromType', val, {
        ...values,
        transferFromType: val,
        transferToType: opposite,
        transferFrom: 0,
        transferTo: 0,
        name: '',
        code: '',
      });
    },
  },

  {
    name: 'transferFrom',
    label: 'From',
    type: 'select',
    options: (values) => {
      const list = values?.transferFromType === 'Warehouse' ? warehouses : projects;
      return list.map((l) => ({ label: l.name, value: l.id }));
    },
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const list = values?.transferFromType === 'Warehouse' ? warehouses : projects;
      const selected = list.find((l) => String(l.id) === String(val));
      if (selected) {
        setValues((prev) => ({
          ...prev,
          transferFrom: val,
          name: selected.name || '',
          code: selected.code || '',
        }));
      }
      onFieldChanged?.('transferFrom', val, values);
    },
  },

  { name: 'spacer-1', type: 'spacer', span: 'span2' },

  { name: 'date', label: 'Date', type: 'date', span: 'span2' },

  {
    name: 'transferToType',
    label: 'To Type',
    type: 'select',
    options: (values) => {
      const opposite = OPPOSITE_TYPE[values?.transferFromType];
      if (!opposite) return [
        { label: 'Warehouse', value: 'Warehouse' },
        { label: 'Project', value: 'Project' },
      ];
      return [{ label: opposite, value: opposite }];
    },
    span: 'span2',
    disabled: true,
    onChange: (val, values, setValues) => {
      onFieldChanged?.('transferToType', val, values);
    },
  },

  {
    name: 'transferTo',
    label: 'To',
    type: 'select',
    options: (values) => {
      const toType = OPPOSITE_TYPE[values?.transferFromType];
      const list = toType === 'Warehouse' ? warehouses : projects;
      return list.map((l) => ({ label: l.name, value: l.id }));
    },
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const toType = OPPOSITE_TYPE[values?.transferFromType];
      const list = toType === 'Warehouse' ? warehouses : projects;
      const selectedTo = list.find((l) => String(l.id) === String(val));

      // find selected from (may be in warehouses or projects depending on transferFromType)
      const fromList = values?.transferFromType === 'Warehouse' ? warehouses : projects;
      const selectedFrom = fromList.find((l) => String(l.id) === String(values?.transferFrom));

      const fromName = selectedFrom ? (selectedFrom.name || '') : '';
      const toName = selectedTo ? (selectedTo.name || '') : '';

      setValues((prev) => ({
        ...prev,
        transferTo: val,
        name: fromName && toName ? `${fromName} to ${toName}` : (selectedTo?.name || prev.name || ''),
      }));

      onFieldChanged?.('transferTo', val, {
        ...values,
        transferTo: val,
        name: fromName && toName ? `${fromName} to ${toName}` : (selectedTo?.name || values.name || ''),
      });
    },
  },

  { name: 'spacer-2', type: 'spacer', span: 'span2' },
  { name: 'description', label: 'Description', type: 'textbox', span: 'span8' },
]);

export const TableColumns = [
  { header: 'Material', key: 'material', width: '240px', render: (it) => (it.code ? `${it.code} - ${it.name}` : it.name) },
  { header: 'UOM', key: 'uom', width: '80px', render: (it) => it.uom },
  { header: 'Quantity', key: 'quantity', align: 'right', width: '100px', render: (it) => (Number(it.quantity) || 0).toFixed(0) },
  { header: 'Remarks', key: 'remarks', width: '220px', render: (it) => it.remarks || '' },
];

export const ItemsFields = (materialOptions = []) => ([
  { name: 'id', label: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId', label: 'parentId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'scopeId', label: 'scopeId', type: 'number', hidden: true, initialvalue: 0 },
  {
    name: 'materialId',
    label: 'Material',
    type: 'select',
    options: Array.isArray(materialOptions) ? materialOptions : [],
    validator: Yup.string().required('Material is required'),
    onChange: (item, updateField) => {
      const material = Array.isArray(materialOptions)
        ? materialOptions.find((m) => String(m.value) === String(item.value))
        : null;

      if (!material) {
        updateField('code', '');
        updateField('name', '');
        updateField('uom', '');
        updateField('scopeId', 0);
        return;
      }
      updateField('code', material.code || '');
      updateField('name', material.name || material.label || '');
      updateField('uom', material.uom || '');
      updateField('scopeId', material.scopeId ?? 0);
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
      .required('Quantity is required')
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than 0.')
      .min(1, 'Quantity must be greater than 0.'),
    onChange: () => {},
  },
  { name: 'uom', label: 'Unit of Measure', type: 'text', readonly: true },
  { name: 'remarks', label: 'Remarks', type: 'text' },
]);

export default { INITIAL_MATERIAL_TRANSFER, FormFields, TableColumns, ItemsFields };