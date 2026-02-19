 'use client';
 import React, { useState, useEffect } from 'react';
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
 * - title: string
 * - icon: ReactNode
 * - fields: Array<{ name, label, type?, placeholder?, span? }>
 * - initialValues: object
 * - onSubmit: async function(values) => void (optional)
 * - backPath: string (path to navigate to after submit/default back)
 * - width: string (optional) - controls form width. Accepts '25%','50%','75%','100%' or shorthand '1/4','1/2','3/4'. Defaults to '100%'.
 * - submitPosition: 'bottom' | 'beforeExtra' (optional) - placement of submit/right actions area. Defaults to 'bottom'.
 * - showSubmitButton: boolean (optional) - controls rendering of default Create/Save button. Defaults to true.
 */
export default function EntityForm({ title, icon, fields, initialValues = {}, onSubmit, backPath = '/', readOnly = false, width = '100%', columns = 8, extraContent = null, rightActions = null, headerActions = null, breadcrumbLabel, breadcrumbItems, submitPosition = 'bottom', showSubmitButton = true }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...initialValues });

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
    setValues({ ...initialValues });
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files && files[0];
      setValues((s) => ({ ...s, [name]: file ? file.name : '' }));
      return;
    }
    setValues((s) => ({ ...s, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // default behavior: log and navigate back to list
        console.log('Form submitted', values);
      }
      router.push(backPath);
    } catch (err) {
      console.error('EntityForm submit error', err);
      alert('Failed to submit: ' + (err.message || err));
    }
  };

  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—';
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
        <h2 className={styles.title}>{title}</h2>
        {headerActions ? <div className={styles.headerActions}>{headerActions}</div> : null}
      </div>

      <div
        className={columns === 3 ? styles.topFields3Col : styles.topFields8Col}
        style={{ width: normalizedWidth }}>
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
            return false;
          })();

          if (fieldReadOnly) {
            return (
              <div key={f.name} className={classes}>
                <div className={styles.readOnlyField}>
                  {f.label && <label className={styles.readOnlyLabel}>{f.label}</label>}
                  <div className={`${styles.readOnlyValue} ${f.multiline ? styles.multilineValue : ''}`}>
                    {formatDisplayValue(values[f.name])}
                  </div>
                </div>
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
