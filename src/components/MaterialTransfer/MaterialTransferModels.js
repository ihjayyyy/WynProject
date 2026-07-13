import * as Yup from "yup";
import BarcodeService from '@/services/Barcode';

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
    validator: Yup.string().typeError('From Type is required').required('From Type is required'),
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
    validator: Yup.number().typeError('From is required').required('From is required'),
  },

  { name: 'spacer-1', type: 'spacer', span: 'span2' },

  { name: 'date', label: 'Date', type: 'date', span: 'span2', validator: Yup.date().typeError('Invalid date').required('Date is required') },

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
    validator: Yup.number().typeError('To is required').required('To is required'),
  },

  { name: 'spacer-2', type: 'spacer', span: 'span2' },
  { name: 'description', label: 'Description', type: 'textbox', span: 'span8' },
]);

/**
 * TableColumns — used by DetailsTable to render the items list.
 *
 * When a row represents multiple merged barcode-level items (it._merged
 * is set by groupItemsByMaterial in MaterialTransferForm), showing a single
 * barcode next to the material name would be misleading, so just the
 * material name is shown instead. Individual (non-merged) rows keep the
 * original "barcode - name" display.
 */
export const TableColumns = [
  {
    header: 'Material',
    key: 'material',
    width: '240px',
    render: (it) => (it._merged ? it.name : (it.code ? `${it.code} - ${it.name}` : it.name)),
  },
  { header: 'UOM', key: 'uom', width: '80px', render: (it) => it.uom },
  { header: 'Quantity', key: 'quantity', align: 'right', width: '100px', render: (it) => (Number(it.quantity) || 0).toFixed(0) },
];

/**
 * ItemsFields — barcode-driven item entry.
 *
 * Maps 1:1 onto the transfer-item schema:
 *   { id, parentId, materialId, name, code, quantity, uom, remarks, rackId }
 *
 * The "Barcode" input IS the `code` field — whatever the user scans/types is
 * saved as-is as children[].code. This also means it round-trips correctly
 * when re-opening an existing saved item: child.code from the API becomes
 * this field's initial value.
 *
 * Barcode status (matched / not found / already used / not available) is
 * carried in a hidden `barcodeMessage` field and surfaced via the `code`
 * field's `description` — the same pattern MaterialReceivedModels uses for
 * existingRemarks under the remarks input: a hidden field holds the value,
 * and the visible field's description reads it back as plain text.
 *
 * On the debounced (400ms) change to the barcode field:
 *   0. Do nothing (just clear material fields / message) until the value is
 *      at least MIN_BARCODE_LENGTH characters long — avoids firing a lookup
 *      (and a premature "not found") on every keystroke while the user is
 *      still typing or the scanner is still streaming characters in.
 *   1. Reject the scan if that exact barcode is already attached to another
 *      item in this transfer (existingItems). The item currently being
 *      edited is excluded from this check via its `id`, so re-saving an
 *      existing item doesn't flag against itself.
 *   2. Otherwise, look up the barcode via BarcodeService.getByBarcodeWithMaterial:
 *      a. Verify the scanned material is part of this transfer's available
 *         balance (materialOptions — requested/allocated balance for
 *         Warehouse→Project, or project on-hand stock for Project→Warehouse).
 *         If not found, the scan is rejected.
 *      b. Auto-fill materialId, name, uom, rackId from the response.
 *      c. Default quantity to 1 (still editable/adjustable by the user).
 *
 * Quantity is only validated as "required, positive" here — there's no
 * client-side cap against rack/project stock, so the backend should enforce
 * that limit on save.
 */
const MIN_BARCODE_LENGTH = 6;

export const ItemsFields = (materialOptions = [], isWarehouseToProject = false, isProjectToWarehouse = false, existingItems = []) => {
  // Scoped to this ItemsFields() call, which the item-entry modal treats as one
  // in-flight item at a time — safe to share a single debounce timer here.
  let barcodeLookupTimer = null;

  const clearMaterialFields = (updateField) => {
    updateField('materialId', 0);
    updateField('name', '');
    updateField('uom', '');
    updateField('rackId', 0);
    updateField('rackDisplay', '');
  };

  return [
    { name: 'id', label: 'id', type: 'number', hidden: true, initialvalue: 0 },
    { name: 'parentId', label: 'parentId', type: 'number', hidden: true, initialvalue: 0 },

    // Populated by the barcode lookup below; this is what actually gets validated.
    {
      name: 'materialId',
      label: 'materialId',
      type: 'number',
      hidden: true,
      initialvalue: 0,
      validator: Yup.number()
        .min(1, 'Scan a valid barcode to select a material')
        .required('Scan a valid barcode to select a material'),
    },

    // Carries the barcode status text (matched / not found / duplicate /
    // not available / too short). Not shown directly — read back via
    // `code`'s description below, same pattern as existingRemarks -> remarks.
    { name: 'barcodeMessage', label: 'barcodeMessage', type: 'text', hidden: true, initialvalue: '' },

    {
      name: 'code',
      label: 'Barcode',
      type: 'text',
      span: 'span2',
      placeholder: 'Scan or type barcode',
      description: (values) => values?.barcodeMessage || '',
      validator: Yup.string().required('Barcode is required'),
      onChange: (item, updateField, fields) => {
        const value = (item.value ?? '').toString().trim();
        updateField('code', value);
        updateField('barcodeMessage', '');

        if (barcodeLookupTimer) clearTimeout(barcodeLookupTimer);

        if (!value) {
          clearMaterialFields(updateField);
          return;
        }

        // Don't fire a lookup (or clear/flag anything beyond the reset above)
        // until there are enough characters to plausibly be a real barcode.
        // Prevents a "not found" flash while the user/scanner is mid-input.
        if (value.length < MIN_BARCODE_LENGTH) {
          clearMaterialFields(updateField);
          return;
        }

        barcodeLookupTimer = setTimeout(async () => {
          // Reject if this exact barcode is already attached to another item
          // in this transfer. Exclude the row currently being edited (by id)
          // so editing an existing item doesn't flag against itself.
          const currentItemId = fields?.id;
          const duplicate = (existingItems || []).find(
            (existing) =>
              existing?.code &&
              existing.code.toString().trim().toLowerCase() === value.toLowerCase() &&
              String(existing.id ?? '') !== String(currentItemId ?? '')
          );

          if (duplicate) {
            updateField('barcodeMessage', `Barcode "${value}" is already used in this transfer.`);
            clearMaterialFields(updateField);
            return;
          }

          const res = await BarcodeService.getByBarcodeWithMaterial(value);

          if (res.error || !res.data) {
            updateField('barcodeMessage', 'Barcode not found.');
            clearMaterialFields(updateField);
            return;
          }

          const data = res.data;
          const material = data.material || {};
          const rack = data.rack || {};

          // Verify the scanned material actually has available balance/stock
          // for this transfer (materialOptions is built upstream per direction).
          const matched = (materialOptions || []).find(
            (m) => String(m.value) === String(data.materialId)
          );

          if (!matched) {
            updateField(
              'barcodeMessage',
              `"${material.code ? `${material.code} - ` : ''}${material.name || data.materialId}" is not available for this transfer.`
            );
            clearMaterialFields(updateField);
            return;
          }

          updateField('materialId', data.materialId);
          updateField('name', material.name || matched.name || '');
          updateField('uom', material.unitOfMeasure || material.purchaseUnitOfMeasure || matched.uom || '');

          if (isWarehouseToProject) {
            updateField('rackId', rack.id || 0);
            updateField('rackDisplay', rack.code ? `${rack.code} - ${rack.name || ''}`.trim() : (rack.name || ''));
          }

          updateField('barcodeMessage', `Matched: ${material.code ? `${material.code} - ` : ''}${material.name || ''}`);
          updateField('quantity', 1);
        }, 400);
      },
    },

    { name: 'name', label: 'Name', type: 'text', readonly: true },

    // Rack id feeds the save payload; rackDisplay is what the user sees.
    { name: 'rackId', label: 'rackId', type: 'number', hidden: true, initialvalue: 0 },
    // { name: 'rackDisplay', label: 'Rack', type: 'text', readonly: true, span: 'span2', hidden: isProjectToWarehouse },

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
    { name: 'remarks', label: 'Remarks', type: 'text' },
  ];
};

export default { INITIAL_MATERIAL_TRANSFER, FormFields, TableColumns, ItemsFields };