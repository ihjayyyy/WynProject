'use client';

import React, { useState } from "react";
import styles from "./QuotationForm.module.scss";
import FormInput from "../ui/FormInput/FormInput";
import TextAreaField from "../ui/TextAreaField/TextAreaField";
import DataTable from "../ui/DataTable/DataTable";
import SaveButton from "../ui/Button/SaveButton";

const initialProductItems = [
  {
    ProductGuid: "P001",
    Description: "Product 1",
    UnitPrice: 100,
    Quantity: 2,
    TotalPrice: 200,
    Discount: 0
  },
  {
    ProductGuid: "P001",
    Description: "Product 1",
    UnitPrice: 100,
    Quantity: 2,
    TotalPrice: 200,
    Discount: 0
  },
  {
    ProductGuid: "P001",
    Description: "Product 1",
    UnitPrice: 100,
    Quantity: 2,
    TotalPrice: 200,
    Discount: 0
  },
  {
    ProductGuid: "P001",
    Description: "Product 1",
    UnitPrice: 100,
    Quantity: 2,
    TotalPrice: 200,
    Discount: 0
  },
  {
    ProductGuid: "P001",
    Description: "Product 1",
    UnitPrice: 100,
    Quantity: 2,
    TotalPrice: 200,
    Discount: 0
  },
];
const initialServiceItems = [
  {
    Description: "Service 1",
    Amount: 1,
  },
];

export default function QuotationForm() {
  const [quotationType, setQuotationType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [form, setForm] = useState({
    SupplierGuid: "",
    QuotationNumber: "",
    Address: "",
    ContactNum: "",
    Date: "",
    Description: "",
    PurchaseType: "inventory", // "inventory" or "service"
    PreparedBy: "",
    ApprovedBy: "",
    // ValidUntil: "",
    // Status: "draft",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e) => {
    setQuotationType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
  };

  const items = quotationType === "inventory" ? productItems : serviceItems;

  // Dynamically set columns based on type
  const columns = quotationType === "inventory"
    ? [
        { header: 'Product', key: 'ProductGuid' },
        { header: 'Description', key: 'Description' },
        { header: 'Unit Price', key: 'UnitPrice' },
        { header: 'Quantity', key: 'Quantity' },
        { header: 'Total Price', key: 'TotalPrice' },
        { header: 'Discount', key: 'Discount' },
      ]
    : [
        { header: 'Service', key: 'Description' },
        { header: 'Amount', key: 'Amount' },
      ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Log the form data and items
    console.log({
      ...form,
      items: quotationType === "inventory" ? productItems : serviceItems,
    });
  };

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className={styles.title}>Quotation</h2>
        <div>
          <label htmlFor="PurchaseType" style={{ fontWeight: 600, marginRight: 8 }}>Type:</label>
          <select id="PurchaseType" name="PurchaseType" value={form.PurchaseType} onChange={handleTypeChange}>
            <option value="inventory">Inventory</option>
            <option value="service">Service</option>
          </select>
        </div>
      </div>

      <div className={styles.topFields}>
        <div className={styles.leftTopFields}>
          <FormInput label="Supplier" placeholder="Supplier" id="SupplierGuid" name="SupplierGuid" value={form.SupplierGuid} onChange={handleChange} />
          <FormInput label="Address" placeholder="Address" id="Address" name="Address" value={form.Address} onChange={handleChange} />
          <FormInput label="Contact Number" placeholder="Contact Number" id="ContactNum" name="ContactNum" value={form.ContactNum} onChange={handleChange} />
          <TextAreaField label="Description" placeholder="Description" name="Description" value={form.Description} onChange={handleChange}  />
        </div>

        <div className={styles.rightTopFields}>
          <FormInput label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" />
          <FormInput label="Quotation Number" placeholder="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} onChange={handleChange} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        showActions={false}
      />

      <div className={styles.bottomFields}>
        <div className={styles.leftBottomFields}>
          <FormInput label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} />
          <FormInput label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} />
        </div>
        <div className={styles.rightBottomFields}>
          <FormInput label="Total" placeholder="Total" value={items.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)} readOnly />
        </div>
      </div>

      <div className={styles.saveButtonWrapper}>
        <SaveButton type="submit" />
      </div>
    </form>
  );
}
