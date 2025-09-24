'use client';

import React, { useState } from "react";
import styles from "./QuotationForm.module.scss";
import Input from "../ui/Input/Input";
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

  // Helper to format numbers to 2 decimal places
  const formatNumber = (value) => Number(value).toFixed(2);

  // Dynamically set columns based on type
  const columns = quotationType === "inventory"
    ? [
        { header: 'Product', key: 'ProductGuid' },
        { header: 'Description', key: 'Description' },
        {
          header: 'Unit Price',
          key: 'UnitPrice',
          render: (row) => (
            <span className={styles.rightAlignNum}>{formatNumber(row.UnitPrice)}</span>
          )
        },
        {
          header: 'Quantity',
          key: 'Quantity',
          render: (row) => (
            <span className={styles.rightAlignNum}>{formatNumber(row.Quantity)}</span>
          )
        },
        {
          header: 'Discount',
          key: 'Discount',
          render: (row) => (
            <span className={styles.rightAlignNum}>{formatNumber(row.Discount)}%</span>
          )
        },
        {
          header: 'Total Price',
          key: 'TotalPrice',
          render: (row) => (
            <span className={styles.rightAlignNum}>{formatNumber(row.TotalPrice)}</span>
          )
        },
      ]
    : [
        { header: 'Service', key: 'Description' },
        {
          header: 'Amount',
          key: 'Amount',
          render: (row) => (
            <span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span>
          )
        },
      ];

  // Table footer for total (for both inventory and service)
  let tableFooter = null;
  if (quotationType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 1} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold' }}>
          {formatNumber(items.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0))}
        </td>
      </tr>
    );
  } else if (quotationType === "service") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 1} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold' }}>
          {formatNumber(items.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0))}
        </td>
      </tr>
    );
  }

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

      {/* 8-column grid layout for top fields */}
      <div className={styles.topFields8Col}>
        {/* Row 1: Supplier (span 3), Contact Number (span 2), Date (span 3, right-aligned) */}
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Supplier" placeholder="Supplier" id="SupplierGuid" name="SupplierGuid" value={form.SupplierGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Contact Number" placeholder="Contact Number" id="ContactNum" name="ContactNum" value={form.ContactNum} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" />
        </div>
        
        {/* Row 2: Address (span 5), Quotation Number (span 3, right-aligned) */}
        <div className={`${styles.gridItem8} ${styles.span6}`}>
          <Input label="Address" placeholder="Address" id="Address" name="Address" value={form.Address} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Quotation Number" placeholder="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} onChange={handleChange} />
        </div>
        
        {/* Row 3: Description full width (span 8) */}
        <div className={`${styles.gridItem8} ${styles.span8}`}>
          <Input
            label="Description"
            placeholder="Description"
            id="Description"
            name="Description"
            value={form.Description}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        showActions={false}
        footer={tableFooter}
      />

      <div className={styles.bottomFields}>
        <div className={styles.leftBottomFields}>
          <Input label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} />
          <Input label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} />
        </div>
        <Button type="submit" variant="save">Save</Button>
      </div>
    </form>
  );
}