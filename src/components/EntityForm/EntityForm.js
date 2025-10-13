 'use client';
 import React, { useState } from 'react';
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
 */
export default function EntityForm({ title, icon, fields, initialValues = {}, onSubmit, backPath = '/' }) {
  const router = useRouter();
  const [values, setValues] = useState({ ...initialValues });

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
    <form className={styles.entityForm} onSubmit={handleSubmit}>
      <Breadcrumbs showBack items={[{ label: `${title}` }]} backIcon={icon} />

      <div className={styles.headerSection}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.topFields8Col}>
        {fields.map((f) => (
          <div key={f.name} className={`${styles.gridItem8} ${styles[f.span || 'span3'] || ''} ${f.rightAlign ? styles.rightAlign : ''}`}>
            <Input
              label={f.label}
              placeholder={f.placeholder || f.label}
              id={f.name}
              name={f.name}
              value={values[f.name] ?? ''}
              onChange={handleChange}
              type={f.type}
            />
          </div>
        ))}
      </div>

      <div className={styles.bottomFields}>
        <div className={styles.rightBottomButtons}>
          <Button type="submit" variant="save">Create</Button>
        </div>
      </div>
    </form>
  );
}
