import * as Yup from 'yup';

export const PSRFields = (
  suppliers = [],
  onFieldChanged,
  purchaseRequests = [],
  onPRSelected,
) => [
  { name: 'code', label: 'Supplier Code', span: 'span1', readOnly: true },
  {
    name: 'supplierId',
    label: 'Supplier',
    type: 'select',
    options: suppliers.map((s) => ({ label: s.name, value: s.id })),
    searchable: true,
    span: 'span3',
    validator: Yup.number()
      .typeError('Supplier is required')
      .required('Supplier is required'),
    onChange: (val, values, setValues) => {
      const found = suppliers.find((s) => s.id === val);
      if (!found) {
        const clearedValues = {
          ...values,
          supplierCode: '',
          address: '',
          contactPerson: '',
          email: '',
          contactNumber: '',
          supplierName: '',
          code: '',
          name: '',
        };
        setValues(clearedValues);
        if (typeof onFieldChanged === 'function')
          onFieldChanged('supplierId', val, clearedValues);
        return;
      }
      const valuesCopy = {
        ...values,
        supplierCode: found.code,
        address: found.address,
        contactPerson: found.contactPerson,
        email: found.email,
        contactNumber: found.contactNumber,
        supplierName: found.name,
        code: found.code,
        name: found.name,
      };
      setValues(valuesCopy);
      if (typeof onFieldChanged === 'function')
        onFieldChanged('supplierId', val, valuesCopy);
    },
  },
  { name: 'supplierName', hidden: true },
  { name: 'code', hidden: true },
  { name: 'name', hidden: true },

  { name: 'purchaseRequestNumber', hidden: true },
  { name: 'spacer-2', type: 'spacer', span: 'span2' },
  {
    name: 'requestDate',
    label: 'Request Date',
    type: 'date',
    span: 'span2',
    validator: Yup.date()
      .typeError('Request Date is required')
      .required('Request Date is required'),
  },
  { name: 'address', label: 'Address', span: 'span4' },
  {
    name: 'purchaseRequestId',
    label: 'Purchase Request',
    type: 'select',
    options: purchaseRequests.map((r) => ({
      label: r.requestNumber + (r.name ? ' - ' + r.name : ''),
      value: r.id,
    })),
    searchable: true,
    span: 'span2',
    onChange: (val, values, setValues) => {
      const found = purchaseRequests.find((p) => p.id === val);
      if (!found) {
        const cleared = {
          ...values,
          purchaseRequestNumber: '',
          jobOrder: '',
        };
        setValues(cleared);
        if (typeof onFieldChanged === 'function')
          onFieldChanged('purchaseRequestId', val, cleared);
        onPRSelected && onPRSelected(null, setValues, cleared);
        return;
      }
      const copy = {
        ...values,
        purchaseRequestNumber: found.requestNumber,
        jobOrder: found.jobOrder || '',
      };
      setValues(copy);
      if (typeof onFieldChanged === 'function')
        onFieldChanged('purchaseRequestId', val, copy);
      onPRSelected && onPRSelected(found, setValues, copy);
    },
  },
  { name: 'supplierReferenceNo', label: 'Supplier PO', span: 'span2' },
  { name: 'contactPerson', label: 'Contact Person', span: 'span4' },
  { name: 'contactNumber', label: 'Contact Number', span: 'span2' },
  { name: 'email', label: 'Email', span: 'span2' },
  { name: 'jobOrder', label: 'Job Order', span: 'span2', readOnly: true },
];

export const PSRDetailsColumns = [
  {
    header: 'Material',
    key: 'material',
    width: '260px',
    render: (it) => (it.code ? `${it.code} - ${it.name}` : it.name),
  },
  {
    header: 'UOM',
    key: 'uom',
    width: '100px',
  },
  {
    header: 'Qty',
    key: 'quantity',
    align: 'right',
    width: '100px',
  },
  {
    header: 'Remarks',
    key: 'remarks',
    width: '220px',
    render: (it) => it.remarks || '',
  },
];

export const PSRItemsFields = (materials = []) => [
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
    label: 'Material',
    type: 'select',
    searchable: true,
    options: materials.map(({ id, name, code }) => ({
      value: id,
      label: `${code ? `[${code}] ` : ''}${name || ''}`.trim(),
    })),
    readonly: false,
    initialvalue: '',
    validator: Yup.string().required('Material is required'),
    onChange: (item, updateField) => {
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
      .required('Quantity is required')
      .typeError('Quantity must be a number')
      .positive('Quantity must be greater than 0.')
      .min(1, 'Quantity must be greater than 0.'),
  },
  { name: 'uom', label: 'Unit of Measure', type: 'text', readonly: true },
  {
    name: 'remarks',
    label: 'Remarks',
    type: 'text',
    readonly: false,
    initialvalue: '',
  },
];

export default {};
