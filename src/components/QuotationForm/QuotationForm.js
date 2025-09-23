'use client';

import React, { useState } from "react";
import styles from "./QuotationForm.module.scss";
import Input from "../ui/Input/Input";
import TextAreaField from "../ui/TextAreaField/TextAreaField";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import Select from "../ui/Select/Select";

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
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Quotation</h2>
        <div className={styles.typeSelector}>
          <label htmlFor="PurchaseType" className={styles.typeLabel}>Type:</label>
          <Select
            id="PurchaseType"
            name="PurchaseType"
            value={form.PurchaseType}
            onChange={handleTypeChange}
            options={[
              { value: "inventory", label: "Inventory" },
              { value: "service", label: "Service" }
            ]}
            className={styles.typeSelect}
          />
        </div>
      </div>

      <div className={styles.topFields}>
        {/* Row 1: Supplier, Contact Number, Date */}
        <div className={styles.gridItem}>
          <Input label="Supplier" placeholder="Supplier" id="SupplierGuid" name="SupplierGuid" value={form.SupplierGuid} onChange={handleChange} />
        </div>
        <div className={styles.gridItem}>
          <Input label="Contact Number" placeholder="Contact Number" id="ContactNum" name="ContactNum" value={form.ContactNum} onChange={handleChange} />
        </div>
        <div className={styles.gridItem}>
          <Input label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" />
        </div>
        {/* Row 2: Address, Quotation Number */}
        <div className={`${styles.gridItem} ${styles.gridItemSpan2}`}>
          <Input label="Address" placeholder="Address" id="Address" name="Address" value={form.Address} onChange={handleChange} />
        </div>
        <div className={styles.gridItem}>
          <Input label="Quotation Number" placeholder="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} onChange={handleChange} />
        </div>
        {/* Row 3: Description full width */}
        <div className={`${styles.gridItem} ${styles.gridItemSpanAll}`}>
          <TextAreaField label="Description" placeholder="Description" name="Description" value={form.Description} onChange={handleChange} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        showActions={false}
      />

      <div className={styles.bottomFields}>
        <div className={styles.leftBottomFields}>
          <Input label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} />
          <Input label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} />
        </div>
        {quotationType === "inventory" && (
          <div className={styles.rightBottomFields}>
            <Input label="Total" placeholder="Total" value={items.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)} readOnly />
          </div>
        )}
      </div>

      <div className={styles.saveButtonWrapper}>
        <Button type="submit" variant="save">Save</Button>
      </div>
    </form>
  );
}