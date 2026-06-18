import * as Yup from "yup";

export const TableColumns = [
  {
    header: 'Material',
    key: 'material',
    width: '240px',
    render: (it) => (it.code ? `${it.code} - ${it.name}` : it.name),
  },
  {
    header: 'Rack',
    key: 'rack',
    width: '140px',
    render: (it) =>
      it.rackCode
        ? `${it.rackCode}${it.rackName ? ' - ' + it.rackName : ''}`
        : (it.rackId ? `Rack #${it.rackId}` : ''),
  },
  { header: 'UOM', key: 'uom', width: '80px', render: (it) => it.uom },
  {
    header: 'Quantity',
    key: 'quantity',
    align: 'right',
    width: '100px',
    render: (it) => (Number(it.quantity) || 0).toFixed(0),
  },
  {
    header: 'Received',
    key: 'receivedQuantity',
    align: 'right',
    width: '100px',
    render: (it) => (Number(it.receivedQuantity) || 0).toFixed(0),
  },
  { header: 'Remarks', key: 'remarks', width: '220px', render: (it) => it.remarks || '' },
];

export const ItemsFields = () => ([
  { name: 'id', label: 'id', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'parentId', label: 'parentId', type: 'number', hidden: true, initialvalue: 0 },

  // Carried over from the original transfer — fixed already, not editable here
  { name: 'materialId', label: 'materialId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'code', label: 'Code', type: 'text', hidden: true },
  { name: 'name', label: 'Name', type: 'text', hidden: true },

  { name: 'rackId', label: 'rackId', type: 'number', hidden: true, initialvalue: 0 },
  { name: 'rackCode', label: 'rackCode', type: 'text', hidden: true },
  { name: 'rackName', label: 'rackName', type: 'text', hidden: true },

  {
    name: 'quantity',
    label: 'Transferred Quantity',
    type: 'number',
    readonly: true,
  },

  {
    name: 'receivedQuantity',
    label: 'Received Quantity',
    type: 'number',
    initialvalue: 0,
    validator: Yup.number()
      .typeError('Must be a number')
      .min(0, 'Cannot be negative')
      .required('Received quantity is required'),
  },

  { name: 'uom', label: 'Unit of Measure', type: 'text', readonly: true },

  { name: 'remarks', label: 'Remarks', type: 'text' },
]);

export default { TableColumns, ItemsFields };