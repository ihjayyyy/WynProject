 'use client';
 import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
 import { useRouter } from 'next/navigation';
import styles from './EntityForm.module.scss';
 import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
 import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import inputStyles from '../ui/Input/Input.module.scss';
 import Button from '../ui/Button/Button';

/**
 * EntityForm
 * Props:
 * - title: string - form title/heading
 * - icon: ReactNode - breadcrumb back icon
 * - fields: Array<{ name, label, type?, placeholder?, span?, hidden?, readOnly?, options?, searchable?, multiline?, rows?, className?, onChange?, render?, component? }> - form fields
 * - initialValues: object - initial form values
 * - onSubmit: async function(values) => void | string | { redirect: string } (optional) - submit handler. Returns redirect path or object with redirect property
 * - backPath: string (optional) - path to navigate to after submit or on back. Defaults to '/'
 * - readOnly: boolean (optional) - make entire form read-only. Defaults to false
 * - width: string (optional) - controls form width. Accepts '25%','50%','75%','100%' or shorthand '1/4','1/2','3/4'. Defaults to '100%'
 * - columns: number (optional) - grid columns: 3 or 8. Defaults to '8'
 * - extraContent: ReactNode (optional) - extra content rendered after fields
 * - rightActions: ReactNode (optional) - custom action buttons rendered on the right side before submit button
 * - headerActions: ReactNode (optional) - custom actions rendered in header
 * - breadcrumbLabel: string (optional) - breadcrumb label override. Defaults to title
 * - breadcrumbItems: Array<{ label, href? }> (optional) - breadcrumb items override
 * - submitPosition: 'bottom' | 'beforeExtra' (optional) - placement of submit/right actions area. Defaults to 'bottom'
 * - showSubmitButton: boolean (optional) - controls rendering of default Create/Save button. Defaults to true
 * - collapsed: boolean (optional) - controlled collapse state. Requires allowCollapse=true
 * - onCollapsedChange: function(collapsed: boolean) => void (optional) - callback when collapse state changes
 * - allowCollapse: boolean (optional) - enable/disable collapse toggle button. Defaults to false
 */
export default function EntityForm({ title, icon, fields, initialValues = {}, onSubmit, backPath = '/', readOnly = false, width = '100%', columns = 8, extraContent = null, rightActions = null, headerActions = null, breadcrumbLabel, breadcrumbItems, submitPosition = 'bottom', showSubmitButton = true, collapsed: collapsedProp, onCollapsedChange, allowCollapse = false }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...initialValues });
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isControlled = typeof collapsedProp !== 'undefined';
  const collapsed = isControlled ? !!collapsedProp : internalCollapsed;
  const setCollapsed = (v) => {
    if (isControlled) {
      if (typeof onCollapsedChange === 'function') onCollapsedChange(v);
    } else {
      setInternalCollapsed(v);
    }
  };

  // normalize width prop: allow '1/4','1/2','3/4' or percentages
  const normalizedWidth = (() => {
    if (!width) return '100%';
    const w = String(width).trim();
    if (w === '1/4') return '25%';
    if (w === '1/2') return '50%';
    if (w === '3/4') return '75%';
    // allow plain numbers like '50' -> '50%'
    if (/^\d+$/.test(w)) return w + '%';
    // allow values already with %
    if (/%$/.test(w)) return w;
    return w; // fallback (user provided valid css unit)
  })();

  // Keep internal state in sync when parent updates `initialValues` (e.g., when loading existing entity)
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
      const incomingId = initialValues && (initialValues.id || initialValues.Guid || null);
      const currentId = values && (values.id || values.Guid || null);

      // If incoming values represent a different entity (different id), replace values.
      if (incomingId && incomingId !== currentId) {
        setValues(normalize(initialValues));
        return;
      }

      // If there is no id (new entity flow), avoid overwriting the user's in-progress edits
      // when parent updates props (for example, when a derived `proposalTotal` changes).
      // Only initialize empty values on first mount when values are empty.
      if (!incomingId && (!values || Object.keys(values).length === 0)) {
        setValues(normalize(initialValues));
      }
    } catch (err) {
      // fallback to safe behavior
      setValues((() => {
        try { return normalize(initialValues); } catch (e) { return { ...initialValues }; }
      })());
    }
  }, [initialValues]);

  const handleChange = (e) => {

    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files && files[0];
      const newValues = { ...values, [name]: file ? file.name : '' };
      setValues(newValues);
      // call field-level onChange if provided
      const field = (fields || []).find((f) => f.name === name);

      if (field && typeof field.onChange === 'function') {
        console.log('on change')
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

    // call field-level onChange if provided
    const field = (fields || []).find((f) => f.name === name);
    
    if (field && typeof field.onChange === 'function') {
      try {
        
        field.onChange(newValues[name], newValues, setValues);
      } catch (err) {
        console.log(err)
        // ignore errors from onChange
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        // default behavior: log
        console.log('Form submitted', values);
      }

      router.push(redirectTo || backPath);
    } catch (err) {
      console.error('EntityForm submit error', err);
      alert('Failed to submit: ' + (err.message || err));
    }
  };

  const formatDisplayValue = (value, field) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    // Format date/datetime values for read-only display when field type is provided
    try {
      const fieldType = field && field.type ? String(field.type).toLowerCase() : '';
      if (fieldType === 'date') {
        const d = new Date(value);
        if (!isNaN(d)) return d.toLocaleDateString();
      }
      if (fieldType === 'datetime-local' || fieldType === 'datetime') {
        const d = new Date(value);
        if (!isNaN(d)) return d.toLocaleString();
      }
    } catch (err) {
      // fallthrough to default
    }

    return String(value);
  };

  const shouldRenderActions = !readOnly || rightActions;
  const actionBlock = shouldRenderActions ? (
    <div className={styles.bottomFields}>
      <div className={styles.rightBottomButtons}>
        {rightActions}
        {!readOnly && showSubmitButton && (
          <Button type="submit" variant="save">{(initialValues && (initialValues.Guid || initialValues.id)) ? 'Save' : 'Create'}</Button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <form className={styles.entityForm} onSubmit={handleSubmit} >
      <Breadcrumbs
        showBack
        items={breadcrumbItems || [{ label: breadcrumbLabel || `${title}` }]}
        backIcon={icon}
        backHref={backPath}
      />

      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {allowCollapse ? (
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setCollapsed(!collapsed)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Show details' : 'Hide details'}
            >
              <span className={styles.caret}>
                {collapsed ? <FiChevronDown size={16} /> : <FiChevronUp size={16} />}
              </span>
              <span className={styles.collapseLabel}>{collapsed ? 'Show details' : 'Hide details'}</span>
            </button>
          ) : null}
        </div>
        {headerActions ? <div className={styles.headerActions}>{headerActions}</div> : null}
      </div>

      <div className={`${columns === 3 ? styles.topFields3Col : styles.topFields8Col} ${collapsed ? styles.collapsed : ''}`} style={{ width: normalizedWidth }}>
        {fields.map((f) => {
          // per-field hidden support: allow boolean or function(values) => boolean
          const fieldHidden = (() => {
            if (typeof f.hidden === 'function') return !!f.hidden(values);
            if (typeof f.hidden === 'boolean') return f.hidden;
            return false;
          })();

          // if hidden, don't render the field at all
          if (fieldHidden) return null;

          const defaultSpan = columns === 3 ? 'span1' : 'span3';
          const classes = `${styles.gridItem8} ${styles[f.span || defaultSpan] || ''} ${f.rightAlign ? styles.rightAlign : ''}`;
          // spacer field: render empty grid cell to occupy space
          if (f.type === 'spacer') {
            return <div key={f.name} className={classes} aria-hidden="true" />;
          }

          // field-level readOnly support:
          // - if `readOnly` prop (component) is true -> field is readonly
          // - else if field.readOnly is a function -> call with current values
          // - else if field.readOnly is boolean -> use it
          const fieldReadOnly = (() => {
            if (readOnly) return true;
            if (typeof f.readOnly === 'function') return !!f.readOnly(values);
            if (typeof f.readOnly === 'boolean') return f.readOnly;
            // Make `code` non-editable for existing entities (when values contain an id/Guid).
            // This enforces that the `code` field cannot be changed during edit flows across forms.
            try {
              if (f && f.name === 'code' && values && (values.id || values.Guid)) return true;
            } catch (err) {
              // ignore
            }
            return false;
          })();

          if (fieldReadOnly) {
            return (
              <div key={f.name} className={classes}>
                <div className={styles.readOnlyField}>
                  {f.label && <label className={styles.readOnlyLabel}>{f.label}</label>}
                  <div className={`${styles.readOnlyValue} ${f.multiline ? styles.multilineValue : ''}`}>
                    {formatDisplayValue(values[f.name], f)}
                  </div>
                </div>
              </div>
            );
          }

          // custom render field support: allow embedding arbitrary nodes
          if (f.type === 'custom') {
            return (
              <div key={f.name} className={classes}>
                {typeof f.render === 'function' ? f.render({ values, setValues }) : f.component || null}
              </div>
            );
          }

          return (
            <div key={f.name} className={classes}>
              {f.type === 'select' ? (
                <div className={inputStyles.field}>
                  {f.label && <label htmlFor={f.name}>{f.label}</label>}
                  <Select
                    id={f.name}
                    value={values[f.name] ?? ''}
                    // Wrap onChange to provide a `name` on the event target so
                    // EntityForm.handleChange can pick up which field changed.
                    onChange={(ev) =>
                      handleChange({ target: { name: f.name, value: ev?.target?.value ?? ev } })
                    }
                    options={f.options || []}
                    placeholder={f.placeholder || f.label}
                    searchable={!!f.searchable}
                    className={f.className}
                    disabled={fieldReadOnly}
                  />
                </div>
              ) : (
                <Input
                  label={f.label}
                  placeholder={f.placeholder || f.label}
                  id={f.name}
                  name={f.name}
                  value={values[f.name] ?? ''}
                  onChange={handleChange}
                  readOnly={fieldReadOnly}
                  type={f.type}
                  multiline={!!f.multiline}
                  rows={f.rows || 3}
                />
              )}
            </div>
          );
        })}
      </div>

      {submitPosition === 'beforeExtra' ? actionBlock : null}

      {extraContent ? <div className={styles.extraContent}>{extraContent}</div> : null}

      {submitPosition !== 'beforeExtra' ? actionBlock : null}
    </form>
  );
}
