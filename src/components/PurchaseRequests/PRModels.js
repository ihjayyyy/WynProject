import * as Yup from 'yup';
import { getMaterialInventoryReportByMaterialId } from '@/services/MaterialInventory';

export const FormFields = (projects, onFieldhanged) => [
  {
    name: 'projectCode',
    label: 'Project Code',
    span: 'span1',
    readOnly: true,
    hidden: true,
  },
  {
    name: 'projectId',
    label: 'Project',
    type: 'select',
    options: projects.map((s) => ({ label: s.name, value: s.id })),
    searchable: true,
    span: 'span3',
    hidden: true,
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
  },
  { name: 'code', hidden: true },
  { name: 'name', label: 'Name', type: 'textbox', span: 'span4' },
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
    name: 'materialId',
    label: 'materialId',
    type: 'number',
    hidden: true,
    initialvalue: 0,
  },
  {
    name: 'material',
    label: 'Material',
    type: 'select',
    searchable: true,
    options: materials.map(({ id, name, code }) => ({
  value: id,
  label: `${code ? `[${code}] ` : ''}${name || ''}`.trim(),
})),
    readonly: false,
    initialvalue: '',
    hydrateOnOpen: true,
    validator: Yup.string().required(`Material is required`),
    onChange: async (item, updateField, fields) => {
      const material = materials.find((a) => a.id == item.value);
      if (!material) {
        updateField('materialId', 0);
        updateField('code', '');
        updateField('name', '');
        updateField('uom', '');
        updateField('stockQuantity', 0);
        updateField('requestedQuantity', 0);
        updateField('orderedQuantity', 0);
        updateField('effectiveQuantity', 0);
        return;
      }
      updateField('materialId', material.id);
      updateField('code', material.code);
      updateField('name', material.name);
      updateField('uom', material.purchaseUnitOfMeasure);

      const inventory = await getMaterialInventoryReportByMaterialId(
        material.id,
      );
      if (inventory && !inventory.error && inventory.data) {
        updateField('stockQuantity', inventory.data.stockQuantity ?? 0);
        updateField('requestedQuantity', inventory.data.requestedQuantity ?? 0);
        updateField('orderedQuantity', inventory.data.orderedQuantity ?? 0);
        updateField('effectiveQuantity', inventory.data.effectiveQuantity ?? 0);
      } else {
        updateField('stockQuantity', 0);
        updateField('requestedQuantity', 0);
        updateField('orderedQuantity', 0);
        updateField('effectiveQuantity', 0);
      }
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
  {
    name: 'stockQuantity',
    label: 'Stock Quantity',
    type: 'number',
    readonly: true,
    initialvalue: 0,
  },
  {
    name: 'requestedQuantity',
    label: 'Requested Quantity',
    type: 'number',
    readonly: true,
    initialvalue: 0,
  },
  {
    name: 'orderedQuantity',
    label: 'Ordered Quantity',
    type: 'number',
    readonly: true,
    initialvalue: 0,
  },
  {
    name: 'effectiveQuantity',
    label: 'Effective Quantity',
    type: 'number',
    readonly: true,
    initialvalue: 0,
  },

  { name: 'uom', label: 'Unit of Measure', type: 'text', readonly: true },
  { name: 'remarks', label: 'Remarks', type: 'text' },
];
