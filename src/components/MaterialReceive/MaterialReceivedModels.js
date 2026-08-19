import React from "react";
import * as Yup from "yup";
import StatusBadge from "@/components/ui/StatusBadge/StatusBadge";

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
  { header: 'Remarks', key: 'remarks', width: '220px', render: (it) => it.existingRemarks || it.remarks || '' },
  {
    header: 'Status',
    key: 'status',
    width: '100px',
    render: (it) =>
      React.createElement(StatusBadge, {
        status: Number(it.originalReceivedQuantity || 0) > 0 ? 'RECEIVED' : 'PENDING',
      }),
  },
];

// status: the current MaterialTransfer status (e.g. transferData?.status).
// When it's "PartiallyReceived", remarks become mandatory on this receive pass,
// and any remarks left over from a previous partial receive are shown
// read-only under the input via `description`, so the user's new text
// gets appended rather than overwriting history.
export const ItemsFields = (status) => {
  const isPartiallyReceived = String(status || '').toLowerCase() === 'partiallyreceived';

  return [
    { name: 'id', label: 'id', type: 'number', hidden: true, initialvalue: 0 },
    { name: 'parentId', label: 'parentId', type: 'number', hidden: true, initialvalue: 0 },

    // Carried over from the original transfer — fixed already, not editable here.
    // `info: true` renders these read-only at the top of the item modal
    // instead of as hidden fields, so the user can see what material/rack
    // they're receiving against.
    { name: 'materialId', label: 'materialId', type: 'number', hidden: true, initialvalue: 0 },
    { name: 'code', label: 'Material Code', type: 'text', info: true },
    { name: 'name', label: 'Material Name', type: 'text', info: true },

    { name: 'rackId', label: 'rackId', type: 'number', hidden: true, initialvalue: 0 },
    { name: 'rackCode', label: 'rackCode', type: 'text', hidden: true },
    { name: 'rackName', label: 'rackName', type: 'text', hidden: true },

    {
      name: 'quantity',
      label: 'Transferred Quantity',
      type: 'number',
      readonly: true,
    },

    // Snapshot of the backend's receivedQuantity at load time. Hidden —
    // used only to determine whether this line was already fully received
    // in a prior pass (see isLineAlreadyFullyReceived above).
    { name: 'originalReceivedQuantity', label: 'originalReceivedQuantity', type: 'number', hidden: true, initialvalue: 0 },

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

    // Remarks left on this item from a prior partial receive. Not directly
    // editable — kept so it can be displayed under the "remarks" input and
    // merged back in on save.
    { name: 'existingRemarks', label: 'Previous Remarks', type: 'text', hidden: true, initialvalue: '' },

    {
      name: 'remarks',
      label: isPartiallyReceived ? 'New Remarks' : 'Remarks',
      type: 'text',
      // Renders under the input, showing prior remarks (if any) for context.
      description: (values) =>
        values?.existingRemarks ? `Previous remarks: ${values.existingRemarks}` : '',
      validator: isPartiallyReceived
        ? Yup.string().trim().required('Remarks are required for partially received items')
        : Yup.string(),
    },

    // Flags consumed by ItemModal for this flow specifically:
    // - hides the delete/trash button in the modal footer
    // - relabels the primary action button from "Save" to "Receive"
    // These aren't rendered as inputs; ItemModal reads them via itemModalProps
    // passed down from DetailsTable / MaterialReceivedForm, not from this array.
  ];
};

export default { TableColumns, ItemsFields };