"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Yup from 'yup';

import ItemModal from '../ItemDetails/itemModal';
import { byTypeMaterials } from '../../services/Materials';

// ─────────────────────────────────────────────────────────────────────────
// VAT / amount computation (inlined — no separate file)
// ─────────────────────────────────────────────────────────────────────────
const round2 = (n) => Number((Number(n) || 0).toFixed(2));

// "Not Included" / "VAT Not-Included" / "Exclusive" -> 'exclusive'
// "Included" / "VAT Included" / "Inclusive"          -> 'inclusive'
// anything else (Non-VAT, blank)                     -> 'none'
function normalizeVatType(t) {
  const s = String(t || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return 'none';
  if (s.includes('notincluded') || s.includes('exclusive') || s.includes('excluded')) return 'exclusive';
  if (s.includes('included') || s.includes('inclusive')) return 'inclusive';
  return 'none';
}

function computeAmounts({
  materialBase,            // unitCost * qty - discount
  laborPercentage = 0,     // whole number, e.g. 10
  laborCostOverride = 0,   // used only when laborPercentage is 0
  vatPercentage = 0,       // whole number, e.g. 12
  vatType = '',
}) {
  const material = round2(Math.max(0, Number(materialBase) || 0));
  const pct = Number(laborPercentage) || 0;
  const labor = pct > 0 ? round2((material * pct) / 100) : round2(laborCostOverride);
  const subtotal = round2(material + labor);

  const type = normalizeVatType(vatType);
  const rate = type === 'none' ? 0 : (Number(vatPercentage) || 0) / 100;

  let vat = 0;
  let totalAmount = subtotal;
  if (type === 'exclusive') {
    vat = round2(subtotal * rate);
    totalAmount = round2(subtotal + vat);
  } else if (type === 'inclusive') {
    vat = round2(subtotal - subtotal / (1 + rate));
  }
  return { materialCost: material, laborCost: labor, vat, totalAmount };
}

const DEFAULT_FORM = {
  id: 0,
  name: '',
  code: '',
  parentId: 0,
  materialId: 0,
  materialType: '',
  uom: '',

  unitCost: 0,

  actualQuantity: 0,
  marginQuantity: 0,
  quantity: 0,

  vat: 0,
  materialCost: 0,
  margin: 0,
  discount: 0,
  laborCost: 0,
  extendedCost: 0,
  totalAmount: 0,

  isAssembly: false,
  totalPrice: 0,

  forecastedStartDate: null,
  forecastedEndDate: null,

  scopeOfWork: '',
  remarks: '',

  laborPercentage: 0,
};

export default function ProposalMaterialModal({
  open,
  initial = {},
  onCancel,
  onConfirm,
  keepOpenOnSave = false,
  // Finance permission (lowercase 'f'). When false, Price, Discount, and
  // Labor Percentage render read-only and their recompute handlers no-op,
  // while item type, material selection, and quantities stay editable.
  canEditFinance = true,
  // From the Proposal Form
  vatPercentage = 0, // whole number, e.g. 12
  vatType = '',      // e.g. "Included" / "Not Included" / non-VAT
}) {
  const [resetKey, setResetKey] = useState(0);

  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initial,
  });

  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    setForm({
      ...DEFAULT_FORM,
      ...initial,
    });
  }, [initial]);

  const normalizeMaterialCategory = (
    type,
    isAssembly = false
  ) => {
    if (!type) return isAssembly ? 'Assembly' : '';

    const lower = type.toLowerCase();

    if (lower === 'service') return 'Service';

    if (lower === 'tools' || lower === 'tool') {
      return 'Tool';
    }

    if (
      lower === 'materials' ||
      lower === 'material'
    ) {
      return 'Material';
    }

    if (
      lower === 'assembly' ||
      lower === 'assemblies'
    ) {
      return 'Assembly';
    }

    if (isAssembly) return 'Assembly';

    return '';
  };

  const [materialCategory, setMaterialCategory] =
    useState(() =>
      normalizeMaterialCategory(
        initial?.materialType || '',
        initial?.isAssembly
      )
    );

  useEffect(() => {
    setMaterialCategory(
      normalizeMaterialCategory(
        initial?.materialType || '',
        initial?.isAssembly
      )
    );
  }, [initial]);

  const getMaterialFilters = useCallback((category) => {
    if (category === 'Assembly') {
      return { isAssembly: true };
    }

    if (category === 'Tool') {
      return {
        materialType: 'Tool',
        isAssembly: false,
      };
    }

    if (category === 'Material') {
      return {
        materialType: 'Material',
        isAssembly: false,
      };
    }

    if (category === 'Service') {
      return {
        materialType: 'Service',
        isAssembly: false,
      };
    }

    return {};
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!open) return;

    if (materialCategory === 'Service') {
      setMaterials([]);
      return;
    }

    (async () => {
      try {
        const res = await byTypeMaterials(
          getMaterialFilters(materialCategory)
        );

        if (!mounted) return;

        if (!res.error && Array.isArray(res.data)) {
          setMaterials(res.data || []);
        } else {
          setMaterials([]);
        }
      } catch {
        setMaterials([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, materialCategory, getMaterialFilters]);

  // Keep form totals in sync with VAT settings / inputs
  useEffect(() => {
    const a = computeAmounts({
      materialBase:
        (Number(form.unitCost) || 0) * (Number(form.quantity) || 0) -
        (Number(form.discount) || 0),
      laborPercentage: Number(form.laborPercentage) || 0,
      laborCostOverride: Number(form.laborCost) || 0,
      vatPercentage,
      vatType,
    });

    setForm((f) => ({
      ...f,
      ...a,
      extendedCost: a.totalAmount,
      totalPrice: a.totalAmount,
    }));
  }, [
    form.unitCost,
    form.quantity,
    form.discount,
    form.laborPercentage,
    form.laborCost,
    vatPercentage,
    vatType,
  ]);

  const applyMaterialSelect = useCallback(
    (val, sourceFields = null) => {
      const id = Number(val) || 0;

      const mat = (materials || []).find(
        (m) => Number(m.id) === Number(id)
      );

      const source = sourceFields
        ? sourceFields.reduce(
            (acc, f) => ({
              ...acc,
              [f.name]: f.value,
            }),
            {}
          )
        : form;

      if (mat) {
        return {
          ...source,
          materialId: Number(mat.id) || 0,
          materialType: source.materialType,

          uom:
            mat.unitOfMeasure ||
            mat.uom ||
            source.uom,

          unitCost:
            Number(
              mat.sellingPrice
            ) || 0,

          code: mat.code || source.code || '',
          name: mat.name || source.name || '',
        };
      }

      return {
        ...source,
        materialId: 0,
      };
    },
    [form, materials]
  );

  const calculatedForm = useMemo(() => {
    const a = computeAmounts({
      materialBase:
        (Number(form.unitCost) || 0) * (Number(form.quantity) || 0) -
        (Number(form.discount) || 0),
      laborPercentage: Number(form.laborPercentage) || 0,
      laborCostOverride: Number(form.laborCost) || 0,
      vatPercentage,
      vatType,
    });

    return {
      ...form,
      ...a,
      extendedCost: a.totalAmount,
      totalPrice: a.totalAmount,
    };
  }, [form, vatPercentage, vatType]);

  const recomputeTotals = (
    updateField,
    itemFields,
    qtyOverride = null,
    unitCostOverride = null,
    extraFormPatch = {}
  ) => {
    const getVal = (n) => itemFields.find((f) => f.name === n)?.value;

    const uc = unitCostOverride ?? (Number(getVal('unitCost')) || 0);
    const qty = qtyOverride ?? (Number(getVal('quantity')) || 0);
    // itemFields is stale for the field currently being edited, so prefer the patch
    const disc =
      extraFormPatch.discount ?? (Number(getVal('discount')) || 0);
    const pctExplicit = extraFormPatch.laborPercentage != null;
    const pct = pctExplicit
      ? Number(extraFormPatch.laborPercentage) || 0
      : Number(getVal('laborPercentage')) || 0;

    const {
      materialCost,
      laborCost: lab,
      vat,
      totalAmount: total,
    } = computeAmounts({
      materialBase: uc * qty - disc,
      laborPercentage: pct,
      laborCostOverride: pctExplicit ? 0 : Number(getVal('laborCost')) || 0,
      vatPercentage,
      vatType,
    });

    updateField('vat', vat);
    updateField('materialCost', materialCost);
    updateField('laborCost', lab);

    updateField('totalAmount', total);
    updateField('extendedCost', total);
    updateField('totalPrice', total);

    // Mirror the recomputed values (plus any field-specific patch passed
    // in by the caller) back into the parent `form` state so it never
    // goes stale relative to itemFields.
    setForm((f) => ({
      ...f,
      ...extraFormPatch,
      vat,
      materialCost,
      laborCost: lab,
      totalAmount: total,
      extendedCost: total,
      totalPrice: total,
      ...(qtyOverride != null ? { quantity: qtyOverride } : {}),
    }));
  };

  const fields = useMemo(() => {
    const isService =
      materialCategory === 'Service';

    const categorySelected =
      materialCategory === 'Tool' ||
      materialCategory === 'Material' ||
      materialCategory === 'Service' ||
      materialCategory === 'Assembly';

    return [
      {
        name: 'id',
        label: 'Id',
        type: 'number',
        value: Number(calculatedForm.id) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },

      {
        name: 'parentId',
        label: 'Parent Id',
        type: 'number',
        value:
          Number(calculatedForm.parentId) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },

      {
        name: 'materialCategory',
        label: 'Item Type',
        type: 'select',
        value: materialCategory,

        options: [
          {
            value: 'Tool',
            label: 'Tools',
          },
          {
            value: 'Material',
            label: 'Materials',
          },
          {
            value: 'Assembly',
            label: 'Assembly',
          },
          {
            value: 'Service',
            label: 'Service',
          },
        ],

        validator: Yup.string().required(
          'Material Type is required'
        ),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          const isNextService =
            nextValue === 'Service';

          const isNextAssembly =
            nextValue === 'Assembly';

          setMaterialCategory(nextValue);

          setForm((f) => ({
            ...f,

            materialId: 0,
            name: '',

            code: isNextService
              ? 'SRVC'
              : '',

            uom: isNextService
              ? 'lot'
              : '',

            unitCost: 0,

            actualQuantity: 0,
            marginQuantity: 0,

            quantity: isNextService
              ? 1
              : 0,

            materialType: nextValue,
            isAssembly: isNextAssembly,
          }));

          updateField('materialId', '');
          updateField('name', '');

          updateField(
            'code',
            isNextService ? 'SRVC' : ''
          );

          updateField(
            'uom',
            isNextService ? 'lot' : ''
          );

          updateField('unitCost', 0);

          updateField('actualQuantity', 0);
          updateField('marginQuantity', 0);

          updateField(
            'quantity',
            isNextService ? 1 : 0
          );

          updateField(
            'materialType',
            nextValue
          );

          updateField(
            'isAssembly',
            isNextAssembly
          );
        },
      },

      {
        name: 'name',
        label: 'Service Name',
        type: 'text',
        value: calculatedForm.name || '',
        hidden: !isService,

        validator: isService
          ? Yup.string().required(
              'Service Name is required'
            )
          : Yup.string().notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          updateField('name', nextValue);
          setForm((f) => ({ ...f, name: nextValue }));
        },
      },

      {
        name: 'materialId',

        label:
          materialCategory === 'Tool'
            ? 'Tool Name'
            : materialCategory === 'Service'
            ? 'Service Name'
            : materialCategory === 'Assembly'
            ? 'Assembly Name'
            : 'Material Name',

        type: 'select',
        searchable: true,

        hidden:
          isService || !categorySelected,

        value: calculatedForm.materialId
          ? String(calculatedForm.materialId)
          : '',

        options:
          materials.length === 0
            ? [
                {
                  value: '__loading__',
                  label:
                    'Loading materials...',
                },
              ]
            : materials
                .filter(
                  (m) =>
                    m &&
                    m.id != null &&
                    m.id !== ''
                )
              .map((m) => ({
                value: String(m.id),
                label: `${m.code ? `[${m.code}] ` : ''}${m.name || ''}`.trim(),
              })),

        validator:
          !isService && categorySelected
            ? Yup.string().required(
                'Material is required'
              )
            : Yup.string().notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          const next = applyMaterialSelect(
            nextValue,
            itemFields
          );

          const newUnitCost =
            Number(next.unitCost) || 0;

          updateField(
            'materialId',
            next.materialId
              ? String(next.materialId)
              : ''
          );

          updateField('uom', next.uom || '');

          updateField(
            'unitCost',
            newUnitCost
          );

          updateField('code', next.code || '');
          updateField('name', next.name || '');

          const formPatch = {
            materialId: next.materialId || 0,
            uom: next.uom || '',
            unitCost: newUnitCost,
            code: next.code || '',
            name: next.name || '',
          };

          setForm((f) => ({
            ...f,
            ...formPatch,
          }));

          // Recompute using the new unitCost. itemFields is still the array
          // from before this onChange fired, so pass it explicitly.
          recomputeTotals(
            updateField,
            itemFields,
            null,
            newUnitCost,
            formPatch
          );
        },
      },

      {
        name: 'code',

        label:
          materialCategory === 'Tool'
            ? 'Tool Code'
            : materialCategory === 'Service'
            ? 'Service Code'
            : materialCategory === 'Assembly'
            ? 'Assembly Code'
            : 'Material Code',

        type: 'text',
        value: calculatedForm.code || '',
        readonly: true,

        validator: Yup.string().notRequired(),
      },

      {
        name: 'materialType',
        label: 'Type',
        type: 'text',
        value:
          calculatedForm.materialType || '',
        hidden: true,
        validator: Yup.string().notRequired(),
      },

      {
        name: 'uom',
        label: 'UoM',
        type: 'text',
        value: calculatedForm.uom || '',
        readonly: true,
        validator: Yup.string().notRequired(),
      },

      {
        name: 'unitCost',
        label: canEditFinance ? 'Price (Editable)' : 'Price',
        type: 'number',
        value:
          Number(calculatedForm.unitCost) || 0,

        // FINANCE FIELD: read-only without 'f' access.
        readonly: !canEditFinance,

        validator: Yup.number()
          .min(0)
          .notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          if (!canEditFinance) return;

          const newUnitCost = Number(nextValue) || 0;

          recomputeTotals(
            updateField,
            itemFields,
            null,
            newUnitCost,
            { unitCost: newUnitCost }
          );
        },
      },

      {
        name: 'actualQuantity',
        label: 'Actual Quantity (Editable)',
        type: 'number',

        value:
          (Number(calculatedForm.quantity) || 0) -
          (Number(calculatedForm.marginQuantity) || 0),

        validator: Yup.number().min(0).notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          const actualQty = Number(nextValue) || 0;

          const marginQty =
            Number(
              itemFields.find(
                (f) => f.name === 'marginQuantity'
              )?.value
            ) || 0;

          const proposedQty = actualQty + marginQty;

          updateField('quantity', proposedQty);

          recomputeTotals(
            updateField,
            itemFields,
            proposedQty,
            null,
            { marginQuantity: marginQty, quantity: proposedQty }
          );
        },
      },

      {
        name: 'marginQuantity',
        label: 'Margin Quantity (Editable)',
        type: 'number',

        value:
          Number(calculatedForm.marginQuantity) ||
          0,

        validator: Yup.number()
          .min(0)
          .notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          const marginQty =
            Number(nextValue) || 0;

          const actualQty =
            Number(
              itemFields.find(
                (f) =>
                  f.name ===
                  'actualQuantity'
              )?.value
            ) || 0;

          const proposedQty =
            actualQty + marginQty;

          updateField(
            'quantity',
            proposedQty
          );

          recomputeTotals(
            updateField,
            itemFields,
            proposedQty,
            null,
            { marginQuantity: marginQty, quantity: proposedQty }
          );
        },
      },

      {
        name: 'quantity',
        label: 'Proposed Quantity',
        type: 'number',

        value: Number(calculatedForm.quantity) || 0,

        readonly: true,

        validator: Yup.number()
          .required('Proposed Quantity is required')
          .moreThan(0, 'Proposed Quantity must be greater than 0'),
      },

      {
        name: 'discount',
        label: canEditFinance ? 'Discount (Editable)' : 'Discount',
        type: 'number',

        value:
          Number(calculatedForm.discount) || 0,

        // FINANCE FIELD: read-only without 'f' access.
        readonly: !canEditFinance,

        validator: Yup.number()
          .min(0)
          .notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          if (!canEditFinance) return;

          const newDiscount = Number(nextValue) || 0;

          recomputeTotals(
            updateField,
            itemFields,
            null,
            null,
            { discount: newDiscount }
          );
        },
      },

      {
        name: 'vat',
        label: 'VAT',
        type: 'number',
        value:
          Number(calculatedForm.vat) || 0,
        readonly: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'materialCost',

        label:
          materialCategory === 'Tool'
            ? 'Tool Amount'
            : materialCategory === 'Service'
            ? 'Service Amount'
            : materialCategory === 'Assembly'
            ? 'Assembly Amount'
            : 'Material Amount',

        type: 'number',

        value:
          Number(calculatedForm.materialCost) ||
          0,

        readonly: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'laborPercentage',
        label: canEditFinance ? 'Margin of Profit (%) (Editable)' : 'Margin of Profit (%)',
        type: 'number',

        value:
          Number(
            calculatedForm.laborPercentage
          ) || 0,

        // FINANCE FIELD: read-only without 'f' access.
        readonly: !canEditFinance,

        validator: Yup.number()
          .min(0)
          .max(100)
          .notRequired(),

        onChange: (
          item,
          updateField,
          itemFields,
          nextValue
        ) => {
          if (!canEditFinance) return;

          const pct = Number(nextValue) || 0;

          recomputeTotals(
            updateField,
            itemFields,
            null,
            null,
            { laborPercentage: pct }
          );
        },
      },

      {
        name: 'laborCost',
        label: 'Margin of Profit',
        type: 'number',
        readonly: true,
        value:
          Number(calculatedForm.laborCost) || 0,

        validator: Yup.number()
          .min(0)
          .notRequired(),
      },

      {
        name: 'totalAmount',
        label: 'Total Amount',
        type: 'number',

        value:
          Number(calculatedForm.totalAmount) ||
          0,

        readonly: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'margin',
        label: 'Margin',
        type: 'number',

        value:
          Number(calculatedForm.margin) || 0,

        hidden: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'extendedCost',
        label: 'Extended Cost',
        type: 'number',

        value:
          Number(
            calculatedForm.extendedCost
          ) || 0,

        hidden: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'isAssembly',
        label: 'Is Assembly',
        type: 'checkbox',

        value: Boolean(
          calculatedForm.isAssembly
        ),

        hidden: true,

        validator: Yup.boolean().notRequired(),
      },

      {
        name: 'totalPrice',
        label: 'Total Price',
        type: 'number',

        value:
          Number(calculatedForm.totalPrice) ||
          0,

        hidden: true,

        validator: Yup.number().notRequired(),
      },

      {
        name: 'forecastedStartDate',
        label: 'Forecasted Start',
        type: 'date',

        value:
          calculatedForm.forecastedStartDate ||
          '',

        hidden: true,

        validator: Yup.string().notRequired(),
      },

      {
        name: 'forecastedEndDate',
        label: 'Forecasted End',
        type: 'date',

        value:
          calculatedForm.forecastedEndDate ||
          '',

        hidden: true,

        validator: Yup.string().notRequired(),
      },

      {
        name: 'scopeOfWork',
        label: 'Scope Of Work',
        type: 'text',

        value:
          calculatedForm.scopeOfWork || '',

        hidden: true,

        validator: Yup.string().notRequired(),
      },

      {
        name: 'remarks',
        label: 'Remarks',
        type: 'text',

        value: calculatedForm.remarks || '',

        hidden: true,

        validator: Yup.string().notRequired(),
      },

    ];
  }, [
    calculatedForm,
    materials,
    applyMaterialSelect,
    materialCategory,
    canEditFinance,
    vatPercentage,
    vatType,
  ]);

  const isEditMode = Boolean(
    initial && initial.id
  );

  return (
    <ItemModal
      key={resetKey}
      headerLabel={
        isEditMode
          ? 'Edit Item'
          : 'Add Item'
      }
      mode="new"
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      confirmOnClose
      onClose={(val) => {
        if (!val) {
          onCancel && onCancel();
          return;
        }

        const getIsoDate = (d) => {
          if (d && d.trim()) {
            if (/T/.test(d)) return d;

            return new Date(d).toISOString();
          }

          return new Date().toISOString();
        };

        // Guard: if the user lacks finance access, force these fields back
        // to their original/incoming values regardless of what was
        // submitted, so a stray bypass of the disabled input can't change
        // pricing data.
        const originalUnitCost = Number(initial?.unitCost) || 0;
        const originalDiscount = Number(initial?.discount) || 0;
        const originalLaborPct = Number(initial?.laborPercentage) || 0;
        const originalLaborCost = Number(initial?.laborCost) || 0;
        const originalMaterialCost = Number(initial?.materialCost) || 0;
        const originalVat = Number(initial?.vat) || 0;
        const originalTotalAmount = Number(initial?.totalAmount) || 0;
        const originalExtendedCost = Number(initial?.extendedCost) || 0;
        const originalTotalPrice = Number(initial?.totalPrice) || 0;

        const payload = {
          id: Number(val.id) || 0,

          name: val.name || '',
          code: val.code || '',

          parentId:
            Number(val.parentId) || 0,

          materialId:
            Number(val.materialId) || 0,

          materialType:
            val.materialType || '',

          uom: val.uom || '',

          unitCost: canEditFinance
            ? (Number(val.unitCost) || 0)
            : originalUnitCost,

          marginQuantity:
            Number(val.marginQuantity) || 0,

          quantity:
            Number(val.quantity) || 0,

          vat: canEditFinance
            ? (Number(val.vat) || 0)
            : originalVat,

          materialCost: canEditFinance
            ? (Number(val.materialCost) || 0)
            : originalMaterialCost,

          margin:
            Number(val.margin) || 0,

          discount: canEditFinance
            ? (Number(val.discount) || 0)
            : originalDiscount,

          laborCost: canEditFinance
            ? (Number(val.laborCost) || 0)
            : originalLaborCost,

          extendedCost: canEditFinance
            ? (Number(val.extendedCost) || 0)
            : originalExtendedCost,

          totalAmount: canEditFinance
            ? (Number(val.totalAmount) || 0)
            : originalTotalAmount,

          isAssembly: Boolean(
            val.isAssembly
          ),

          totalPrice: canEditFinance
            ? (Number(val.totalPrice) || 0)
            : originalTotalPrice,

          forecastedStartDate:
            getIsoDate(
              val.forecastedStartDate
            ),

          forecastedEndDate:
            getIsoDate(
              val.forecastedEndDate
            ),

          scopeOfWork:
            val.scopeOfWork || '',

          remarks: '',

          laborPercentage: canEditFinance
            ? (Number(val.laborPercentage) || 0)
            : originalLaborPct,
        };

        const shouldKeepOpen =
          keepOpenOnSave && !isEditMode;

        onConfirm &&
          onConfirm(payload, {
            closeModal: !shouldKeepOpen,
          });

        setForm({
          ...DEFAULT_FORM,

          parentId:
            Number(payload.parentId) || 0,

          scopeOfWork:
            payload.scopeOfWork || '',
        });

        setResetKey((k) => k + 1);
      }}
    />
  );
}