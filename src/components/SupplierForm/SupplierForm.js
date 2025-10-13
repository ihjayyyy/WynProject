'use client';
import React, { useState } from 'react';
import styles from './SupplierForm.module.scss';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import { FiTruck } from 'react-icons/fi';
import Input from '../ui/Input/Input';
import Button from '../ui/Button/Button';

export default function SupplierForm() {
  const [form, setForm] = useState({
    CompanyGuid: '',
    CompanyCode: '',
    Name: '',
    Logo: '',
    Address: '',
    Phone: '',
    Fax: '',
    Email: '',
    Website: '',
    TaxNumber: '',
    ContactPerson: '',
    ContactNumber: '',
    PaymentTerms: 0,
    Status: '',
    SupplierType: '',
  });

  // Handlers and helpers
  const handleChange = (e) => {
    const { name, value } = e.target;
    // // Special handling for Date: auto-set ValidUntil to one month later
    // if (name === 'Date') {
    //   const prevDate = form.Date;
    //   const prevValid = form.ValidUntil;
    //   let newValid = prevValid;
    //   try {
    //     const shouldAuto = !prevValid || prevValid === prevDate;
    //     if (shouldAuto && value) {
    //       const base = new Date(value);
    //       const d = new Date(base);
    //       d.setMonth(d.getMonth() + 1);
    //       newValid = d.toISOString().slice(0, 10);
    //     }
    //   } catch (err) {
    //     // ignore
    //   }
    //   setForm({ ...form, Date: value, ValidUntil: newValid });
    //   return;
    // }
    setForm({ ...form, [name]: value });
  };
  return (
    <form className={styles.supplierForm}>
      <Breadcrumbs
        showBack
        items={[{ label: 'Supplier Form' }]}
        backIcon={<FiTruck size={18} />}
      />

      <div className={styles.headerSection}>
        <h2 className={styles.title}>Supplier Form</h2>
      </div>

      {/* Row 1 */}
      <div className={styles.topFields8Col}>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Supplier Name"
            placeholder="Supplier Name"
            id="SupplierName"
            name="SupplierName"
            value={form.Name}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Address"
            placeholder="Address"
            id="Address"
            name="Address"
            value={form.Address}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input
            label="Logo"
            placeholder="Logo"
            id="Logo"
            name="Logo"
            value={form.Logo}
            onChange={handleChange}
            type="file"
          />
        </div>

        {/* Row 2 */}
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Phone"
            placeholder="Phone"
            id="Phone"
            name="Phone"
            value={form.Phone}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Fax"
            placeholder="Fax"
            id="Fax"
            name="Fax"
            value={form.Fax}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input
            label="Website"
            placeholder="Website"
            id="Website"
            name="Website"
            value={form.Website}
            onChange={handleChange}
            type="url"
          />
        </div>

        {/* Row 3 */}
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Contact Person"
            placeholder="Contact Person"
            id="ContactPerson"
            name="ContactPerson"
            value={form.ContactPerson}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Contact Number"
            placeholder="Contact Number"
            id="ContactNumber"
            name="ContactNumber"
            value={form.ContactNumber}
            onChange={handleChange}
          />
        </div>

        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input
            label="Tax Number"
            placeholder="Tax Number"
            id="TaxNumber"
            name="TaxNumber"
            value={form.TaxNumber}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className={styles.bottomFields}>
        <div className={styles.rightBottomButtons}>
          <Button type="button" variant="save">
            Create
          </Button>
        </div>
      </div>
    </form>
  );
}
