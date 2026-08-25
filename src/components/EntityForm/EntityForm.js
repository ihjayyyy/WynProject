'use client';
import React, { useState, useEffect, useMemo } from 'react';
import * as Yup from 'yup';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import styles from './EntityForm.module.scss';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import inputStyles from '../ui/Input/Input.module.scss';
import Button from '../ui/Button/Button';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

/**
 * EntityForm
 * Props:
 * - title: string - form title/heading
 * - icon: ReactNode - breadcrumb back icon
 * - fields: Array<{
 *     name, label, type?, placeholder?, span?, hidden?, readOnly?,
 *     options?, searchable?, multiline?, rows?, className?, onChange?,
 *     render?, component?,
 *     validator?: Yup.Schema,   // <-- NEW: field-level Yup validator
 *     required?: boolean,       // <-- NEW: shorthand required (shows * on label)
 *   }> - form fields
 * - initialValues: object - initial form values
 * - onSubmit: async function(values) => void | string | { redirect: string }
 * - onValidate: async (values) => ({ fieldName: 'error msg' }) | null  // <-- NEW: custom async validation
 * - backPath: string (optional)
 * - readOnly: boolean (optional)
 * - width: string (optional)
 * - columns: number (optional)
 * - extraContent: ReactNode (optional)
 * - rightActions: ReactNode (optional)
 * - headerActions: ReactNode (optional)
 * - breadcrumbLabel: string (optional)
 * - breadcrumbItems: Array<{ label, href? }> (optional)
 * - showBreadcrumbs: boolean (optional)
 * - submitPosition: 'bottom' | 'beforeExtra' (optional)
 * - showSubmitButton: boolean (optional)
 * - showCloseButton: boolean (optional)
 * - collapsed: boolean (optional)
 * - onCollapsedChange: function(collapsed: boolean) => void (optional)
 * - allowCollapse: boolean (optional)
 */
export default function EntityForm({
  title,
  icon,
  fields,
  initialValues = {},
  onSubmit,
  onValidate,
  backPath = '/',
  readOnly = false,
  width = '100%',
  columns = 8,
  extraContent = null,
  rightActions = null,
  headerActions = null,
  breadcrumbLabel,
  breadcrumbItems,
  showBreadcrumbs = true,
  submitPosition = 'bottom',
  showSubmitButton = true,
  showCloseButton = true,
  collapsed: collapsedProp,
  onCollapsedChange,
  allowCollapse = false,
}) {
  const router = useRouter();
  const confirmModal = useConfirmModal();
  const [values, setValues] = useState({ ...initialValues });
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // ── Validation state ──────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── Build Yup schema from field validators ────────────────────────────────
  const schema = useMemo(() => {
    const shape = {};
    (fields || []).forEach((f) => {
      if (!f || !f.name) return;
      if (f.validator) {
        // number fields: coerce empty string → undefined so Yup required fires
        if (f.type === 'number' || f.type === 'currency') {
          shape[f.name] = f.validator.transform((currentValue, originalValue) => {
            if (
              originalValue === '' ||
              originalValue === null ||
              originalValue === undefined
            )
              return undefined;
            if (typeof originalValue === 'number' && Number.isNaN(originalValue))
              return undefined;
            return currentValue;
          });
        } else {
          shape[f.name] = f.validator;
        }
      } else if (f.required) {
        // Shorthand: required:true without a full Yup schema
        shape[f.name] = Yup.mixed().test(
          'required',
          `${f.label || f.name} is required`,
          (val) => val !== null && val !== undefined && val !== '',
        );
      }
    });
    return Yup.object().shape(shape);
  }, [fields]);

  // ── Validate a single field value (used on blur / onChange after submit attempted) ──
  const validateField = async (name, value) => {
    try {
      // pick only the single field's schema
      const fieldSchema = Yup.object().shape({ [name]: schema.fields[name] });
      if (!fieldSchema.fields[name]) {
        setErrors((prev) => {
          if (!prev[name]) return prev;
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return;
      }
      await fieldSchema.validate({ [name]: value }, { abortEarly: true });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (err) {
      if (err.message) {
        setErrors((prev) => ({ ...prev, [name]: err.message }));
      }
    }
  };

  // ── Validate all fields ───────────────────────────────────────────────────
  const validateAll = async (currentValues) => {
    let newErrors = {};

    // Yup schema validation
    try {
      await schema.validate(currentValues, { abortEarly: false });
    } catch (err) {
      if (err.inner && err.inner.length > 0) {
        err.inner.forEach((e) => {
          if (e.path) newErrors[e.path] = e.message;
        });
      } else if (err.path) {
        newErrors[err.path] = err.message;
      }
    }

    // Optional custom async validation (e.g. server-side checks)
    if (onValidate) {
      try {
        const customErrors = await onValidate(currentValues);
        if (customErrors && typeof customErrors === 'object') {
          newErrors = { ...newErrors, ...customErrors };
        }
      } catch (err) {
        console.error('EntityForm onValidate error', err);
      }
    }

    return newErrors;
  };

  // ── Collapse ──────────────────────────────────────────────────────────────
  const isControlled = typeof collapsedProp !== 'undefined';
  const collapsed = isControlled ? !!collapsedProp : internalCollapsed;
  const setCollapsed = (v) => {
    if (isControlled) {
      if (typeof onCollapsedChange === 'function') onCollapsedChange(v);
    } else {
      setInternalCollapsed(v);
    }
  };

  // ── Width normalization ───────────────────────────────────────────────────
  const normalizedWidth = (() => {
    if (!width) return '100%';
    const w = String(width).trim();
    if (w === '1/4') return '25%';
    if (w === '1/2') return '50%';
    if (w === '3/4') return '75%';
    if (/^\d+$/.test(w)) return w + '%';
    if (/%$/.test(w)) return w;
    return w;
  })();

  // ── Sync initialValues → internal state ──────────────────────────────────
  useEffect(() => {
    try {
      const normalize = (vals) => {
        if (!vals || !fields) return { ...vals };
        const out = { ...vals };
        (fields || []).forEach((f) => {
          try {
            const key = f && f.name;
            if (!key) return;
            const val = out[key];
            if (val === undefined || val === null || val === '') return;
            const t = f.type ? String(f.type).toLowerCase() : '';
            if (t === 'date') {
              const d = new Date(val);
              if (!isNaN(d)) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                out[key] = `${yyyy}-${mm}-${dd}`;
              }
            }
            if (t === 'datetime-local' || t === 'datetime') {
              const d = new Date(val);
              if (!isNaN(d)) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                out[key] = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
              }
            }
          } catch (err) {
            // ignore per-field normalization errors
          }
        });
        return out;
      };

      const incomingId =
        initialValues && (initialValues.id || initialValues.Guid || null);
      const currentId = values && (values.id || values.Guid || null);

      if (incomingId && incomingId !== currentId) {
        setValues(normalize(initialValues));
        setErrors({});
        setSubmitAttempted(false);
        return;
      }

      if (!incomingId && (!values || Object.keys(values).length === 0)) {
        setValues(normalize(initialValues));
      }
    } catch (err) {
      setValues({ ...initialValues });
    }
  }, [initialValues]);

  // ── handleChange ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files && files[0];
      const newValues = { ...values, [name]: file ? file.name : '' };
      setValues(newValues);
      const field = (fields || []).find((f) => f.name === name);
      if (field && typeof field.onChange === 'function') {
        try {
          field.onChange(newValues[name], newValues, setValues);
        } catch (err) {
          // swallow
        }
      }
      return;
    }

    const parsedValue = type === 'number' ? Number(value) : value;
    const newValues = { ...values, [name]: parsedValue };
    setValues(newValues);

    // Re-validate this field only if the user has already tried to submit
    if (submitAttempted && schema.fields[name]) {
      validateField(name, parsedValue);
    } else if (errors[name]) {
      // Clear the error optimistically if user is fixing it
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    const field = (fields || []).find((f) => f.name === name);
    if (field && typeof field.onChange === 'function') {
      try {
        field.onChange(newValues[name], newValues, setValues);
      } catch (err) {
        console.log(err);
      }
    }
  };

  // ── handleBlur — validate individual field on blur ────────────────────────
  const handleBlur = (e) => {
    const { name, value, type } = e.target;
    if (!schema.fields[name]) return;
    const parsedValue = type === 'number' ? Number(value) : value;
    validateField(name, parsedValue);
  };

  // ── handleSubmit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const newErrors = await validateAll(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error field
      const firstErrorName = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorName) || document.querySelector(`[name="${firstErrorName}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});

    try {
      let redirectTo = null;
      if (onSubmit) {
        const result = await onSubmit(values);
        if (typeof result === 'string') {
          redirectTo = result;
        } else if (result && typeof result === 'object' && result.redirect) {
          redirectTo = result.redirect;
        }
      } else {
        console.log('Form submitted', values);
      }
    } catch (err) {
      console.error('EntityForm submit error', err);
      alert('Failed to submit: ' + (err.message || err));
    }
  };

  // ── formatDisplayValue ────────────────────────────────────────────────────
  const formatDisplayValue = (value, field, allValues) => {
    if (value === null || value === undefined || value === '') return '—';

    if (typeof field?.readOnlyDisplay === 'function') {
      return field.readOnlyDisplay(allValues || {});
    }

    try {
      const fieldType =
        field && field.type ? String(field.type).toLowerCase() : '';
      if (fieldType === 'date') {
        const d = new Date(value);
        if (!isNaN(d)) return d.toLocaleDateString();
      }
      if (fieldType === 'datetime-local' || fieldType === 'datetime') {
        const d = new Date(value);
        if (!isNaN(d)) return d.toLocaleString();
      }
      if (fieldType === 'select') {
        try {
          const rawOpts =
            typeof field.options === 'function'
              ? field.options(allValues || {})
              : field.options;
          if (Array.isArray(rawOpts)) {
            const opts = rawOpts.map((o) => ({
              value: o.value,
              label: o.label ?? o.name ?? String(o.value),
            }));
            const match = opts.find((o) => String(o.value) === String(value));
            if (match) return match.label;
          }
        } catch (err) {
          // ignore
        }
      }
    } catch (err) {
      // fallthrough
    }

    return String(value);
  };

  // ── Action block ──────────────────────────────────────────────────────────
  const shouldRenderActions = !readOnly || rightActions;
  const actionBlock = shouldRenderActions ? (
    <div className={styles.bottomFields}>
      <div className={styles.rightBottomButtons}>
        {rightActions}
        {!readOnly && showSubmitButton && (
          <Button type="submit" variant="save">
            {initialValues && (initialValues.Guid || initialValues.id)
              ? 'Save'
              : 'Create'}
          </Button>
        )}
      </div>
    </div>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form className={styles.entityForm} onSubmit={handleSubmit} noValidate>
      {showBreadcrumbs ? (
        <Breadcrumbs
          showBack
          items={
            breadcrumbItems || [{ label: breadcrumbLabel || `${title}` }]
          }
          backIcon={icon}
          backHref={backPath}
        />
      ) : null}

      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {allowCollapse ? (
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Show details' : 'Hide details'}>
              <span className={styles.caret}>
                {collapsed ? (
                  <FiChevronDown size={16} />
                ) : (
                  <FiChevronUp size={16} />
                )}
              </span>
              <span className={styles.collapseLabel}>
                {collapsed ? 'Show details' : 'Hide details'}
              </span>
            </button>
          ) : null}
        </div>
        {showCloseButton || headerActions ? (
          <div className={styles.headerActions}>
            {showCloseButton && (
              <Button
                type="button"
                variant="warning"
                onClick={() =>
                  confirmModal.show(
                    'Close window',
                    'Are you sure you want to close this window?',
                    'Close',
                    'primary',
                    () => () => router.push(backPath),
                  )
                }>
                Close
              </Button>
            )}
            {headerActions}
          </div>
        ) : null}
      </div>

      <div
        className={`${columns === 3 ? styles.topFields3Col : styles.topFields8Col} ${collapsed ? styles.collapsed : ''}`}
        style={{ width: normalizedWidth }}>
        {fields.map((f) => {
          // ── hidden ──────────────────────────────────────────────────────
          const fieldHidden = (() => {
            if (typeof f.hidden === 'function') return !!f.hidden(values);
            if (typeof f.hidden === 'boolean') return f.hidden;
            return false;
          })();
          if (fieldHidden) return null;

          const defaultSpan = columns === 3 ? 'span1' : 'span3';
          const classes = `${styles.gridItem8} ${styles[f.span || defaultSpan] || ''} ${f.rightAlign ? styles.rightAlign : ''}`;

          // ── spacer ──────────────────────────────────────────────────────
          if (f.type === 'spacer') {
            return <div key={f.name} className={classes} aria-hidden="true" />;
          }

          // ── readOnly ────────────────────────────────────────────────────
          const fieldReadOnly = (() => {
            if (readOnly) return true;
            if (typeof f.readOnly === 'function') return !!f.readOnly(values);
            if (typeof f.readOnly === 'boolean') return f.readOnly;
            return false;
          })();
          
          const fieldDisabled = (() => {
            if (typeof f.disabled === 'function') return !!f.disabled(values);
            if (typeof f.disabled === 'boolean') return f.disabled;
            return false;
          })();

          if (fieldReadOnly) {
            return (
              <div key={f.name} className={classes}>
                <div className={styles.readOnlyField}>
                  {f.label && (
                    <label className={styles.readOnlyLabel}>{f.label}</label>
                  )}
                  <div
                    className={`${styles.readOnlyValue} ${f.multiline ? styles.multilineValue : ''}`}>
                    {formatDisplayValue(values[f.name], f, values)}
                  </div>
                </div>
              </div>
            );
          }

          // ── custom render ───────────────────────────────────────────────
          if (f.type === 'custom') {
            return (
              <div key={f.name} className={classes}>
                {typeof f.render === 'function'
                  ? f.render({ values, setValues })
                  : f.component || null}
              </div>
            );
          }

          // ── Whether this field has a validator / is required ─────────────
          const hasValidator = !!(f.validator || f.required);
          const fieldError = errors[f.name];

          // ── Build label with optional required asterisk ──────────────────
          const labelText = f.label
            ? hasValidator
              ? `${f.label} *`
              : f.label
            : undefined;

          // ── select ──────────────────────────────────────────────────────
          if (f.type === 'select') {
            return (
              <div key={f.name} className={classes}>
                <div className={inputStyles.field}>
                  {labelText && (
                    <label
                      htmlFor={f.name}
                      style={hasValidator ? { fontWeight: 500 } : undefined}>
                      {labelText}
                    </label>
                  )}
                  {(() => {
                    const rawOpts =
                      typeof f.options === 'function'
                        ? f.options(values)
                        : f.options || [];
                    const opts = Array.isArray(rawOpts)
                      ? rawOpts.map((o) => ({
                          value: o.value,
                          label: o.label ?? o.name ?? String(o.value),
                        }))
                      : [];
                    return (
                      <Select
                        id={f.name}
                        value={values[f.name] ?? ''}
                        onChange={(ev) => {
                          handleChange({
                            target: {
                              name: f.name,
                              value: ev?.target?.value ?? ev,
                            },
                          });
                        }}
                        options={opts}
                        placeholder={f.placeholder || f.label}
                        searchable={!!f.searchable}
                        className={`${f.className || ''} ${fieldError ? styles.inputError : ''}`}
                        disabled={fieldReadOnly || fieldDisabled}
                      />
                    );
                  })()}
                  {fieldError && (
                    <p className={styles.fieldError} role="alert">
                      {fieldError}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          // ── all other input types ───────────────────────────────────────
          return (
            <div key={f.name} className={classes}>
              <Input
                label={labelText}
                placeholder={f.placeholder || f.label}
                id={f.name}
                name={f.name}
                min={f.min}
                max={f.max}
                value={values[f.name] ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                readOnly={fieldReadOnly}
                type={f.type}
                multiline={!!f.multiline}
                rows={f.rows || 3}
                className={fieldError ? styles.inputError : ''}
                aria-invalid={!!fieldError}
                aria-describedby={fieldError ? `${f.name}-error` : undefined}
              />
              {fieldError && (
                <p
                  id={`${f.name}-error`}
                  className={styles.fieldError}
                  role="alert">
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {submitPosition === 'beforeExtra' ? actionBlock : null}

      {extraContent ? (
        <div className={styles.extraContent}>{extraContent}</div>
      ) : null}

      {submitPosition !== 'beforeExtra' ? actionBlock : null}
    </form>
  );
}