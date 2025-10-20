 'use client';
 import React, { useState, useEffect } from 'react';
 import { useRouter } from 'next/navigation';
 import styles from './EntityForm.module.scss';
 import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
 import Input from '../ui/Input/Input';
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
 */
export default function EntityForm({ title, icon, fields, initialValues = {}, onSubmit, backPath = '/', readOnly = false, width = '100%' }) {
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

  return (
    <form className={styles.entityForm} onSubmit={handleSubmit} >
      <Breadcrumbs showBack items={[{ label: `${title}` }]} backIcon={icon} />

      <div className={styles.headerSection}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.topFields8Col} style={{ width: normalizedWidth }}>
        {fields.map((f) => {
          const classes = `${styles.gridItem8} ${styles[f.span || 'span3'] || ''} ${f.rightAlign ? styles.rightAlign : ''}`;
          // spacer field: render empty grid cell to occupy space
          if (f.type === 'spacer') {
            return <div key={f.name} className={classes} aria-hidden="true" />;
          }

          return (
            <div key={f.name} className={classes}>
              <Input
                label={f.label}
                placeholder={f.placeholder || f.label}
                id={f.name}
                name={f.name}
                value={values[f.name] ?? ''}
                onChange={handleChange}
                readOnly={readOnly}
                type={f.type}
              />
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className={styles.bottomFields}>
          <div className={styles.rightBottomButtons}>
            <Button type="submit" variant="save">{(initialValues && (initialValues.Guid || initialValues.id)) ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      )}
    </form>
  );
}
