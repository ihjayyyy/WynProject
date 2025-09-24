'use client';

import React, { useState} from 'react';
import styles from './page.module.scss';
import Input from '../../../../components/ui/Input/Input';
import Button from '../../../../components/ui/Button/Button';
import { FiHash, FiFileText, FiMapPin, FiPhone, FiPrinter, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

// --- Data & Configs ---
const COMPANY = {
  Guid: 'COMP001',
  CompanyCode: 'ACME',
  Name: 'Acme Corporation',
  Logo: '',
  Address: '123 Ayala Ave, Makati City',
  Phone: '+63 2 8123 4567',
  Fax: '+63 2 8123 4568',
  Email: 'john.smith@acme.com',
  Website: 'www.acme.com',
  TaxNumber: 'TX123456',
};


export default function CompanyPage() {
  const [company, setCompany] = useState(COMPANY);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => setIsEditing(false);

  return (
    <div className={styles.container}>
      <div className={styles.companyCard}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerLeft}>
            <div className={styles.companyIcon}>
              {/* Use a placeholder SVG icon from public folder */}
              <img src="/file.svg" alt="Company Icon" width={24} height={24} />
            </div>
            <div>
              <h1 className={styles.companyName}>{company.Name}</h1>
              <div className={styles.companyCode}>Code: {company.CompanyCode}</div>
            </div>
          </div>
          <div>
            {/* Show Edit button when not editing, Save/Cancel when editing */}
            {!isEditing ? (
              <Button
                type="button"
                icon={<FiEdit2 size={18} />}
                onClick={handleEdit}
              >
                Edit Details
              </Button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5em' }}>
                <Button
                  type="button"
                  variant="save"
                  icon={<FiCheck size={18} />}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="transparent"
                  icon={<FiX size={18} />}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information Section */}
        <form className={styles.form}>
          <div className={styles.sectionTitle}>Basic Information</div>
          <div className={styles.formGrid}>
            <Input
              label="Company Code"
              id="companyCode"
              name="CompanyCode"
              value={company.CompanyCode}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiHash size={18} />}
            />
            <Input
              label="Company Name"
              id="name"
              name="Name"
              value={company.Name}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiFileText size={18} />}
            />
          </div>

          {/* Contact Information Section */}
          <div className={styles.sectionTitle}>Contact Information</div>
          <div className={styles.formGrid}>
            <Input
              label="Address"
              id="address"
              name="Address"
              value={company.Address}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiMapPin size={18} />}
            />
            <Input
              label="Phone"
              id="phone"
              name="Phone"
              value={company.Phone}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiPhone size={18} />}
            />
            <Input
              label="Fax"
              id="fax"
              name="Fax"
              value={company.Fax}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiPrinter size={18} />}
            />
              <Input
                label="Email"
                id="email"
                name="Email"
                value={company.Email}
                onChange={handleChange}
                readOnly={!isEditing}
                icon={<FiFileText size={18} />}
              />
              <Input
                label="Website"
                id="website"
                name="Website"
                value={company.Website}
                onChange={handleChange}
                readOnly={!isEditing}
                icon={<FiFileText size={18} />}
              />
          </div>
          {/* Legal Information Section */}
          <div className={styles.sectionTitle}>Legal Information</div>
          <div className={styles.formGrid}>
            <Input
              label="Tax Number"
              id="taxNumber"
              name="TaxNumber"
              value={company.TaxNumber}
              onChange={handleChange}
              readOnly={!isEditing}
              icon={<FiHash size={18} />}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
