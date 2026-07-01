import React, { useEffect, useState, useContext, useMemo, useRef } from "react";
import { createPortal } from 'react-dom';
import { FiX } from "react-icons/fi";
import modalstyle from "./itemmodal.module.scss"
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Button from '../ui/Button/Button';
import { FiTrash2 } from 'react-icons/fi';

import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import inputStyles from '../ui/Input/Input.module.scss';
import { useConfirmModal } from "@/app/contextProviders/confirmModalContext";

const ItemModal = ({ headerLabel, mode = "new", itemIndex = -1, isOpen, onClose, fields, onItemRemove, closeOnOutsideClick = false, confirmOnClose = false }) => {

  const confirmModal = useConfirmModal();

  const handleShowConfirm = (itemindex) => {
    const title = "Remove item";
    const message = "Are you sure you want to remove this item?";
    const confirmText = "Remove";
    const variant = "danger";
    const action = () => () => handleRemove(itemindex);
    confirmModal.show(title, message, confirmText, variant, action);
  }

  const [itemFields, setFields] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const hasHydratedOnOpenRef = useRef(false);

  // Reset dirty flag each time the modal opens
  useEffect(() => {
    if (isOpen) setIsDirty(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      hasHydratedOnOpenRef.current = false;
    }
  }, [isOpen]);

  // Sync itemFields from props. Refresh when fields change or modal opens so
  // reopening the modal always resets the inputs even if the props stringify
  // identically to the previous values.
  const prevFieldsRef = useRef(null);
  useEffect(() => {
    const next = JSON.stringify((fields || []).map(f => ({ name: f.name, value: f.value, optionsLen: (f.options || []).length })));
    // If nothing changed and modal is closed, skip update. If modal is opening
    // (isOpen true), always refresh to ensure form inputs reflect prop values.
    if (prevFieldsRef.current === next && !isOpen) return;
    prevFieldsRef.current = next;
    setFields([...fields]);
  }, [fields, isOpen]);

  // Build schema only when itemFields structure changes (field names / validators)
  const schema = useMemo(() => {
    const shape = {};
    itemFields.forEach(field => {
      const validator = field.validator;
      if (validator && field.type === 'number') {
        shape[field.name] = validator.transform((currentValue, originalValue) => {
          if (originalValue === '' || originalValue === null || originalValue === undefined) return undefined;
          if (typeof originalValue === 'number' && Number.isNaN(originalValue)) return undefined;
          return currentValue;
        });
      } else {
        shape[field.name] = validator;
      }
    });
    return Yup.object().shape(shape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemFields.map(f => f.name).join(',')]);

  const {
    register,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  // Validate against schema; guarded by a ref so we only run when values truly change
  const [isValid, setIsValid] = useState(false);
  const prevValidationKeyRef = useRef(null);
  useEffect(() => {
    const key = JSON.stringify(itemFields.map(f => ({ name: f.name, value: f.value })));
    if (prevValidationKeyRef.current === key) return;
    prevValidationKeyRef.current = key;

    schema
      .validate(
        itemFields.reduce((acc, field) => ({ ...acc, [field.name]: field.value }), {}),
        { abortEarly: false }
      )
      .then(() => setIsValid(true))
      .catch(() => setIsValid(false));
  }, [itemFields, schema]);

  const handleClose = () => {
    if (confirmOnClose && isDirty) {
      confirmModal.show(
        'Discard changes',
        'Are you sure you want to close? All unsaved changes will be lost.',
        'Discard',
        'danger',
        () => () => { reset(); setIsDirty(false); onClose(null); }
      );
      return;
    }
    reset();
    onClose(null);
  };

  const handleBackdropClick = () => {
    if (closeOnOutsideClick) {
      handleClose();
    }
  };

  const handleSave = () => {
    const itemData = itemFields.reduce((item, data) => {
      item[data.name] = data.value;
      return item;
    }, {});
    onClose(itemData, itemIndex);
    reset();
  };

  const handleRemove = (itemIndex) => {
    onItemRemove(itemIndex);
    onClose();
    reset();
  };

  const handleChange = (e, item) => {
    setIsDirty(true);
    const val = e.target.type === "checkbox"
      ? e.target.checked
      : e.target.type === "number"
        ? (e.target.value === '' ? '' : Number(e.target.value))
        : e.target.value;
    const nextFields = (itemFields || []).map((field) => (
      field.name === item.name ? { ...field, value: val } : field
    ));
    setFields(nextFields);
    item.onChange && item.onChange(e.target, updateField, nextFields, val);
  };

  const updateField = (fieldNameToUpdate, value) => {
    setFields((prevFields) => {
      const fieldcopy = [...prevFields];
      const i = fieldcopy.find(x => x.name === fieldNameToUpdate);
      if (!i) return prevFields;
      i.value = value;
      return fieldcopy;
    });
  };

  // Hydrate dependent fields when editing existing rows.
  // This allows fields like rack select (dependent on material) to load options
  // and resolve the initial selected value on modal open.
  useEffect(() => {
    if (!isOpen || hasHydratedOnOpenRef.current) return;

    const fieldsToHydrate = (itemFields || []).filter(
      (field) =>
        Boolean(field?.hydrateOnOpen) &&
        typeof field?.onChange === 'function' &&
        field?.value !== '' &&
        field?.value !== null &&
        typeof field?.value !== 'undefined'
    );

    if (fieldsToHydrate.length === 0) return;

    hasHydratedOnOpenRef.current = true;

    fieldsToHydrate.forEach((field) => {
      const syntheticTarget = {
        value: field.value,
        type: field.type === 'number' ? 'number' : 'select-one',
      };

      Promise.resolve(field.onChange(syntheticTarget, updateField, itemFields, field.value)).catch(() => {
        // Keep modal stable even if hydration calls fail.
      });
    });
  }, [isOpen, itemFields]);

  const content = (
    <div className={modalstyle.itemModal} onClick={handleBackdropClick}>
      <div className={modalstyle.modalcontainer} onClick={(e) => e.stopPropagation()}>
        <div className={modalstyle.modalHeader}>
          <h3 className={modalstyle.title}>{headerLabel}</h3>
          <button className={modalstyle.buttonCloseContainer} type="button" onClick={handleClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>
        <div className={modalstyle.modalBody}>
          {itemFields.map((item) => (
            item.hidden ? null : (
              <div key={item.name} className={modalstyle.fieldContainer}>
                {item.type === "currency" || item.type === "number" ? (
                  <Input
                    label={item.label}
                    {...register(item.name)}
                    readOnly={item.readonly}
                    type="number"
                    step="0.01"
                    placeholder="Enter value"
                    value={item.value ?? 0}
                    onChange={(e) => { handleChange(e, item) }}
                  />
                ) : item.type === "select" ? (
                  <div className={inputStyles.field}>
                    <label>{item.label}</label>
                    <Select
                      id={item.name}
                      value={item.value !== "undefined" ? item.value : ""}
                      onChange={(e) => { handleChange(e, item) }}
                      searchable={item.searchable || false}
                      options={[
                        { value: '', label: `Select ${item.label}` },
                        ...((item.options || []).map((opt) => ({
                          value: opt.value,
                          label: opt.label || opt.name || String(opt.value),
                        }))),
                      ]}
                    />
                  </div>
                ) : item.type === "checkbox" ? (
                  <Input
                    label={item.label}
                    {...register(item.name)}
                    type="checkbox"
                    checked={Boolean(item.value)}
                    onChange={(e) => { handleChange(e, item) }}
                  />
                ) : (
                  <Input
                    label={item.label}
                    {...register(item.name)}
                    type={item.type}
                    readOnly={item.readonly}
                    value={item.value ?? ""}
                    onChange={(e) => { handleChange(e, item) }}
                  />
                )}
                {errors[item.name] && (
                  <p style={{ color: "red" }} className={modalstyle.error}>
                    {errors[item.name].message}
                  </p>
                )}
                {item.description && (() => {
                  const values = itemFields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {});
                  const desc = typeof item.description === 'function' ? item.description(values) : item.description;
                  return desc ? <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>{desc}</p> : null;
                })()}
              </div>
            )
          ))}
        </div>

        <div className={modalstyle.actionContainer}>
          <button
            className={isValid ? modalstyle.saveButton : modalstyle.saveDisabledButton}
            type="button"
            onClick={handleSave}
            disabled={!isValid}
          >
            Save
          </button>
          {mode !== "new" && (
            <Button size="lg" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => { handleShowConfirm(itemIndex); }} />
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;
  return createPortal(content, document.body);
};

export default ItemModal;