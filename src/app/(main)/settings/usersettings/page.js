'use client';

import React, { useEffect, useState } from 'react';
import styles from './page.module.scss';
import Select from '@/components/ui/Select/Select';

const FONT_OPTIONS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, Times, serif' },
  { label: 'Monospace', value: 'Courier New, monospace' },
  { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", Arial, sans-serif' },
];

const DATE_FORMAT_OPTIONS = [
  { label: 'YYYY-MM-DD', value: 'yyyy-MM-dd' },
  { label: 'DD/MM/YYYY', value: 'dd/MM/yyyy' },
  { label: 'MM/DD/YYYY', value: 'MM/dd/yyyy' },
  { label: 'MMMM D, YYYY', value: 'MMMM d, yyyy' },
  { label: 'D MMM YYYY', value: 'd MMM yyyy' },
];

export default function UserSettingsPage() {
  const [fontFamily, setFontFamily] = useState('inherit');
  const [dateFormat, setDateFormat] = useState(DATE_FORMAT_OPTIONS[0].value);

  useEffect(() => {
    // Load font and date format from localStorage
    const storedFont = localStorage.getItem('odr-font-family');
    if (storedFont) {
      setFontFamily(storedFont);
      document.body.style.fontFamily = storedFont;
    }
    const storedDateFormat = localStorage.getItem('odr-date-format');
    if (storedDateFormat) {
      setDateFormat(storedDateFormat);
    }
  }, []);

  useEffect(() => {
    document.body.style.fontFamily = fontFamily;
    localStorage.setItem('odr-font-family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('odr-date-format', dateFormat);
  }, [dateFormat]);

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>User Settings</h1>
      </div>
      <div className={styles.settingsCard}>
        <div className={styles.settingItem}>
          <label htmlFor="font-family-select" className={styles.label}>Font Family</label>
          <Select
            id="font-family-select"
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
            options={FONT_OPTIONS}
          />
        </div>
        <div className={styles.settingItem}>
          <label htmlFor="date-format-select" className={styles.label}>Date Format</label>
          <Select
            id="date-format-select"
            value={dateFormat}
            onChange={e => setDateFormat(e.target.value)}
            options={DATE_FORMAT_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
