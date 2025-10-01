'use client';

import React, { useState } from "react";
import styles from "./PaymentForm.module.scss";
import Input from "../ui/Input/Input";

import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import Select from "../ui/Select/Select";
import { FiDollarSign, FiPlus, FiTrash2 } from "react-icons/fi";
import Breadcrumbs from "../ui/Breadcrumbs/Breadcrumbs";

// Payment form for invoice payments

// Mock invoice catalog for inventory payments
const invoiceCatalog = [
  {
    Guid: "INVITEM001",
    InvoiceGuid: "INV001",
    OrderGuid: "ORD001",
    ProductGuid: "P001",
    Quantity: 2,
    UnitPrice: 150.00,
    TotalPrice: 300.00,
    Discount: 0,
    Description: "Premium Widget A"
  },
  {
    Guid: "INVITEM002",
    InvoiceGuid: "INV002",
    OrderGuid: "ORD002",
    ProductGuid: "P002",
    Quantity: 1,
    UnitPrice: 85.50,
    TotalPrice: 85.50,
    Discount: 0,
    Description: "Standard Widget B"
  },
  {
    Guid: "INVITEM003",
    InvoiceGuid: "INV003",
    OrderGuid: "ORD003",
    ProductGuid: "P003",
    Quantity: 3,
    UnitPrice: 220.75,
    TotalPrice: 662.25,
    Discount: 0,
    Description: "Deluxe Widget C"
  },
  {
    Guid: "INVITEM004",
    InvoiceGuid: "INV004",
    OrderGuid: "ORD004",
    ProductGuid: "P004",
    Quantity: 5,
    UnitPrice: 45.25,
    TotalPrice: 226.25,
    Discount: 0,
    Description: "Basic Widget D"
  },
  {
    Guid: "INVITEM005",
    InvoiceGuid: "INV005",
    OrderGuid: "ORD005",
    ProductGuid: "P005",
    Quantity: 1,
    UnitPrice: 500.00,
    TotalPrice: 500.00,
    Discount: 0,
    Description: "Professional Service Package"
  }
];

const serviceCatalog = [
  { ServiceGuid: "S001", Description: "Consultation Service", Amount: 250.0 },
  { ServiceGuid: "S002", Description: "Installation Service", Amount: 400.0 },
  { ServiceGuid: "S003", Description: "Maintenance Package", Amount: 150.0 },
];

const initialProductItems = [];
const initialServiceItems = [];
const initialBlankServiceRow = { ServiceGuid: '', Description: '', Amount: 0 };

export default function PaymentForm() {
  const [paymentType, setPaymentType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [form, setForm] = useState({
    Guid: "",
    CompanyGuid: "",
    SupplierGuid: "",
    SupplierOR: "",
    TotalAmount: 0,
    CheckNumber: "",
    Description: "",
    PaymentDate: "",
    Status: "",
    PreparedBy: "",
    ApprovedBy: ""
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Toggle payment type
  const handleTypeChange = (e) => {
    setPaymentType(e.target.value);
  };

  // --- Product Table Logic ---
  const [blankRowData, setBlankRowData] = useState({
    Guid: '',
    InvoiceGuid: '',
    OrderGuid: '',
    ProductGuid: '',
    Quantity: 1,
    UnitPrice: 0,
    TotalPrice: 0,
    Discount: 0,
    Description: ''
  });

  const calculateTotalPrice = (unitPrice, quantity, discount = 0) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleInvoiceSelect = (invoiceGuid) => {
    if (!invoiceGuid) {
      setBlankRowData({
        Guid: '',
        InvoiceGuid: '',
        OrderGuid: '',
        ProductGuid: '',
        Quantity: 1,
        UnitPrice: 0,
        TotalPrice: 0,
        Discount: 0,
        Description: ''
      });
      return;
    }
    const selectedInvoice = invoiceCatalog.find(inv => inv.InvoiceGuid === invoiceGuid);
    if (selectedInvoice) {
      setBlankRowData({
        ...selectedInvoice
      });
    }
  };

  const handleBlankRowQuantityChange = (newQuantity) => {
    const quantity = Math.max(1, Number(newQuantity) || 1);
    const totalPrice = calculateTotalPrice(blankRowData.UnitPrice, quantity, blankRowData.Discount);
    setBlankRowData({
      ...blankRowData,
      Quantity: quantity,
      TotalPrice: totalPrice
    });
  };

  const handleBlankRowDiscountChange = (newDiscount) => {
    const discount = Math.max(0, Math.min(100, Number(newDiscount) || 0));
    const totalPrice = calculateTotalPrice(blankRowData.UnitPrice, blankRowData.Quantity, discount);
    setBlankRowData({
      ...blankRowData,
      Discount: discount,
      TotalPrice: totalPrice
    });
  };

  const handleAddBlankRowItem = () => {
    if (blankRowData.ProductGuid) {
      const newItem = {
        id: Date.now(),
        ...blankRowData
      };
      setProductItems([...productItems, newItem]);
      setBlankRowData({
        Guid: '',
        InvoiceGuid: '',
        OrderGuid: '',
        ProductGuid: '',
        Quantity: 1,
        UnitPrice: 0,
        TotalPrice: 0,
        Discount: 0,
        Description: ''
      });
    }
  };

  const handleRemoveItem = (itemId) => {
    setProductItems(items => items.filter(item => item.id !== itemId));
  };

  // --- Service Table Logic ---
  const [blankServiceRow, setBlankServiceRow] = useState(initialBlankServiceRow);

  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    setBlankServiceRow((prev) => ({
      ...prev,
      [name]: name === 'Amount' ? Number(value) : value
    }));
  };

  const handleServiceSelect = (serviceGuid) => {
    if (!serviceGuid) {
      setBlankServiceRow(initialBlankServiceRow);
      return;
    }
    const selectedService = serviceCatalog.find(s => s.ServiceGuid === serviceGuid);
    if (selectedService) {
      setBlankServiceRow({
        ServiceGuid: selectedService.ServiceGuid,
        Description: selectedService.Description,
        Amount: selectedService.Amount
      });
    }
  };

  const handleAddBlankServiceRow = () => {
    if (blankServiceRow.Description && blankServiceRow.Amount > 0) {
      setServiceItems([...serviceItems, { id: Date.now(), ...blankServiceRow }]);
      setBlankServiceRow(initialBlankServiceRow);
    }
  };

  const handleRemoveServiceItem = (itemId) => {
    setServiceItems(items => items.filter(item => item.id !== itemId));
  };

  // Helper to format numbers
  const formatNumber = (value) => Number(value).toFixed(2);

  // Table columns
  const columns = paymentType === "inventory"
    ? [
        { 
          header: 'Invoice', 
          key: 'InvoiceGuid',
          render: (row) => {
            if (row.isBlank) {
              return (
                <Select
                  value={row.InvoiceGuid}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  options={[
                    { value: "", label: "Select Invoice..." },
                    ...row.availableProducts.map(inv => ({
                      value: inv.InvoiceGuid,
                      label: `${inv.InvoiceGuid} - ${inv.Description}`
                    }))
                  ]}
                />
              );
            }
            return row.InvoiceGuid || '';
          }
        },
        { header: 'Order', key: 'OrderGuid', render: (row) => row.OrderGuid || '' },
        { 
          header: 'Product', 
          key: 'ProductGuid',
          render: (row) => row.ProductGuid || ''
        },
        { header: 'Quantity', key: 'Quantity', render: (row) => {
            if (row.isBlank) {
              if (!row.ProductGuid) return '';
              return (
                <Input
                  type="number"
                  value={row.Quantity}
                  onChange={(e) => handleBlankRowQuantityChange(e.target.value)}
                  min="1"
                  step="1"
                />
              );
            }
            return (<span className={styles.rightAlignNum}>{row.Quantity}</span>);
          }
        },
        { header: 'Unit Price', key: 'UnitPrice', render: (row) => row.isBlank && !row.ProductGuid ? '' : (<span className={styles.rightAlignNum}>{formatNumber(row.UnitPrice)}</span>) },
        { header: 'Discount (%)', key: 'Discount', render: (row) => {
            if (row.isBlank) {
              if (!row.ProductGuid) return '';
              return (
                <Input
                  type="number"
                  value={row.Discount}
                  onChange={(e) => handleBlankRowDiscountChange(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                />
              );
            }
            return (<span className={styles.rightAlignNum}>{formatNumber(row.Discount)}%</span>);
          }
        },
        { header: 'Description', key: 'Description', render: (row) => row.Description },
        { header: 'Total Price', key: 'TotalPrice', render: (row) => row.isBlank && !row.ProductGuid ? '' : (<span className={styles.rightAlignNum}>{formatNumber(row.TotalPrice)}</span>) },
        { header: 'Actions', key: 'actions', render: (row) => {
            if (row.isBlank) {
              if (!row.ProductGuid) return '';
              return (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddBlankRowItem}
                  icon={<FiPlus />}
                  aria-label="Add"
                />
              );
            }
            return (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveItem(row.id)}
                icon={<FiTrash2 />}
                aria-label="Remove"
              />
            );
          }
        }
      ]
    : [
        { header: 'Service', key: 'ServiceGuid', render: (row) => row.isBlank ? (
            <Select
              value={row.ServiceGuid}
              onChange={(e) => handleServiceSelect(e.target.value)}
              options={[
                { value: '', label: 'Select Service...' },
                ...serviceCatalog.map(s => ({
                  value: s.ServiceGuid,
                  label: `${s.ServiceGuid} - ${s.Description}`
                }))
              ]}
            />
          ) : row.ServiceGuid
        },
        { header: 'Description', key: 'Description', render: (row) => row.isBlank ? (
            <Input
              name="Description"
              value={row.Description}
              onChange={handleBlankServiceChange}
              placeholder="Service Description"
              readOnly={!!row.ServiceGuid}
            />
          ) : row.Description
        },
        { header: 'Amount', key: 'Amount', render: (row) => row.isBlank ? (
            <Input
              name="Amount"
              type="number"
              value={row.Amount}
              onChange={handleBlankServiceChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              readOnly={!!row.ServiceGuid}
            />
          ) : (<span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span>)
        },
        { header: 'Actions', key: 'actions', render: (row) => {
            if (row.isBlank) {
              if (!row.ServiceGuid && !row.Description) return '';
              return (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddBlankServiceRow}
                  icon={<FiPlus />}
                  aria-label="Add"
                  disabled={!row.Description || row.Amount <= 0}
                />
              );
            }
            return (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemoveServiceItem(row.id)}
                icon={<FiTrash2 />}
                aria-label="Remove"
              />
            );
          }
        }
      ];

  // Calculate total
  const totalAmount = paymentType === "inventory"
    ? productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
    : serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);

  // Table footer
  let tableFooter = null;
  if (paymentType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{formatNumber(totalAmount)}</td>
        <td />
      </tr>
    );
  } else if (paymentType === "service") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{formatNumber(totalAmount)}</td>
        <td />
      </tr>
    );
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // Log the form data and items
    console.log({
      ...form,
      items: paymentType === "inventory" ? productItems : serviceItems,
      TotalAmount: totalAmount,
      PaymentType: paymentType
    });
  };

  const items = paymentType === "inventory" ? productItems : serviceItems;

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <Breadcrumbs showBack items={[{ label: 'Payment Form' }]} backIcon={<FiDollarSign size={18}/>} />
      
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Payment Form</h2>
        <div className={styles.typeSelector}>
          <label htmlFor="PaymentType" className={styles.typeLabel}>Type:</label>
          <Select
            id="PaymentType"
            name="PaymentType"
            value={paymentType}
            onChange={handleTypeChange}
            options={[
              { value: "inventory", label: "Inventory" },
              { value: "service", label: "Service" }
            ]}
          />
        </div>
      </div>
      <div className={styles.topFields8Col}>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Company GUID" placeholder="Company GUID" id="CompanyGuid" name="CompanyGuid" value={form.CompanyGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Supplier GUID" placeholder="Supplier GUID" id="SupplierGuid" name="SupplierGuid" value={form.SupplierGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Payment Date" id="PaymentDate" name="PaymentDate" value={form.PaymentDate} onChange={handleChange} type="date" />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Supplier OR" placeholder="Supplier OR" id="SupplierOR" name="SupplierOR" value={form.SupplierOR} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Check Number" placeholder="Check Number" id="CheckNumber" name="CheckNumber" value={form.CheckNumber} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Total Amount" placeholder="0.00" id="TotalAmount" name="TotalAmount" value={formatNumber(totalAmount)} readOnly type="number" min="0" step="0.01" />
        </div>
        <div className={`${styles.gridItem8} ${styles.span8}`}>
          <Input label="Description" placeholder="Description" id="Description" name="Description" value={form.Description} onChange={handleChange} multiline rows={3} />
        </div>
      </div>

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (paymentType === "inventory") {
          const availableProducts = invoiceCatalog.filter(
            invoice => !productItems.find(item => item.ProductGuid === invoice.ProductGuid)
          );
          if (availableProducts.length > 0) {
            itemsWithBlank.push({
              id: 'blank',
              ...blankRowData,
              isBlank: true,
              availableProducts
            });
          }
        } else if (paymentType === "service") {
          itemsWithBlank.push({
            id: 'blank',
            ...blankServiceRow,
            isBlank: true
          });
        }
        return (
          <DataTable
            columns={columns}
            data={itemsWithBlank}
            showActions={false}
            footer={tableFooter}
          />
        );
      })()}

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
