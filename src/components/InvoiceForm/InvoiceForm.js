"use client";

import React, { useState } from "react";
import styles from "./InvoiceForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../ui/Select/Select";

// --- Supplier Data (mock, should match supplier page) ---
const SUPPLIERS = [
  {
    CompanyGuid: 'COMP001',
    CompanyCode: 'ACME',
    Name: 'Acme Corporation',
    Logo: '',
    Address: '123 Ayala Ave, Makati City',
    Phone: '+63 2 8123 4567',
    Fax: '+63 2 8123 4568',
    Email: 'john.smith@acme.com',
    Website: 'www.acme.com',
    TaxNumber: 'TX123456',
    ContactPerson: 'John Smith',
    ContactNumber: '+63 917 111 2222',
    PaymentTerms: 30,
    Status: 'ACTIVE',
    SupplierType: 'Local'
  },
  {
    CompanyGuid: 'COMP002',
    CompanyCode: 'GLOB',
    Name: 'Global Supplies Ltd',
    Logo: '',
    Address: '456 Ortigas Ave, Pasig City',
    Phone: '+63 2 8987 6543',
    Fax: '+63 2 8987 6544',
    Email: 'sarah.j@globalsupplies.com',
    Website: 'www.globalsupplies.com',
    TaxNumber: 'TX654321',
    ContactPerson: 'Sarah Johnson',
    ContactNumber: '+63 918 333 4444',
    PaymentTerms: 45,
    Status: 'ACTIVE',
    SupplierType: 'International'
  },
  {
    CompanyGuid: 'COMP003',
    CompanyCode: 'TECH',
    Name: 'Tech Solutions Inc',
    Logo: '',
    Address: '789 IT Park, Cebu City',
    Phone: '+63 32 456 7890',
    Fax: '+63 32 456 7891',
    Email: 'mbrown@techsolutions.com',
    Website: 'www.techsolutions.com',
    TaxNumber: 'TX789123',
    ContactPerson: 'Michael Brown',
    ContactNumber: '+63 919 555 6666',
    PaymentTerms: 60,
    Status: 'PENDING',
    SupplierType: 'Local'
  }
];

// Mock product and service catalogs (replace with API in real app)
const productCatalog = [
  { ProductGuid: "P001", Description: "Premium Widget A", UnitPrice: 150.0 },
  { ProductGuid: "P002", Description: "Standard Widget B", UnitPrice: 85.5 },
  { ProductGuid: "P003", Description: "Deluxe Widget C", UnitPrice: 220.75 },
  { ProductGuid: "P004", Description: "Basic Widget D", UnitPrice: 45.25 },
  { ProductGuid: "P005", Description: "Professional Service Package", UnitPrice: 500.0 },
];

const serviceCatalog = [
  { ServiceGuid: "S001", Description: "Consultation Service", Amount: 250.0 },
  { ServiceGuid: "S002", Description: "Installation Service", Amount: 400.0 },
  { ServiceGuid: "S003", Description: "Maintenance Package", Amount: 150.0 },
];

const initialProductItems = [];
const initialServiceItems = [];
const initialBlankServiceRow = { ServiceGuid: '', Description: '', Amount: 0 };

export default function InvoiceForm() {
  const [invoiceType, setInvoiceType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [form, setForm] = useState({
    Guid: "",
    CompanyGuid: "",
    SupplierGuid: "",
    DeliveryGuid: "",
    OrderGuid: "",
    PurchaseOrderNumber: "",
    PurchaseInvoiceNumber: "",
    Date: "",
    Description: "",
    PurchaseType: "inventory",
    PreparedBy: "",
    ApprovedBy: "",
    Status: "",
    SupplierPO: "",
    DueDate: "",
    InvoiceAmount: 0,
  });

  // Handle input changes (except Supplier)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle supplier dropdown change
  const handleSupplierChange = (e) => {
    const selectedGuid = e.target.value;
    const selectedSupplier = SUPPLIERS.find(s => s.CompanyGuid === selectedGuid);
    setForm(form => ({
      ...form,
      SupplierGuid: selectedGuid,
      CompanyGuid: selectedSupplier ? selectedSupplier.CompanyGuid : '',
    }));
  };

  const handleTypeChange = (e) => {
    setInvoiceType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
  };

  // Service row state/handlers
  const [blankServiceRow, setBlankServiceRow] = useState(initialBlankServiceRow);
  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    setBlankServiceRow((prev) => ({ ...prev, [name]: name === 'Amount' ? Number(value) : value }));
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

  // Product row state/handlers
  const [blankRowData, setBlankRowData] = useState({
    ProductGuid: '',
    Description: '',
    UnitPrice: 0,
    Quantity: 1,
    TotalPrice: 0,
    Discount: 0
  });
  const calculateTotalPrice = (unitPrice, quantity, discount = 0) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };
  const handleProductSelect = (productGuid) => {
    if (!productGuid) {
      setBlankRowData({ ProductGuid: '', Description: '', UnitPrice: 0, Quantity: 1, TotalPrice: 0, Discount: 0 });
      return;
    }
    const selectedProduct = productCatalog.find(p => p.ProductGuid === productGuid);
    if (selectedProduct) {
      const totalPrice = calculateTotalPrice(selectedProduct.UnitPrice, blankRowData.Quantity, blankRowData.Discount);
      setBlankRowData({
        ProductGuid: selectedProduct.ProductGuid,
        Description: selectedProduct.Description,
        UnitPrice: selectedProduct.UnitPrice,
        Quantity: blankRowData.Quantity,
        TotalPrice: totalPrice,
        Discount: blankRowData.Discount
      });
    }
  };
  const handleBlankRowQuantityChange = (newQuantity) => {
    const quantity = Math.max(1, Number(newQuantity) || 1);
    const totalPrice = calculateTotalPrice(blankRowData.UnitPrice, quantity, blankRowData.Discount);
    setBlankRowData({ ...blankRowData, Quantity: quantity, TotalPrice: totalPrice });
  };
  const handleBlankRowDiscountChange = (newDiscount) => {
    const discount = Math.max(0, Math.min(100, Number(newDiscount) || 0));
    const totalPrice = calculateTotalPrice(blankRowData.UnitPrice, blankRowData.Quantity, discount);
    setBlankRowData({ ...blankRowData, Discount: discount, TotalPrice: totalPrice });
  };
  const handleAddBlankRowItem = () => {
    if (blankRowData.ProductGuid) {
      const newItem = { id: Date.now(), ...blankRowData };
      setProductItems([...productItems, newItem]);
      setBlankRowData({ ProductGuid: '', Description: '', UnitPrice: 0, Quantity: 1, TotalPrice: 0, Discount: 0 });
    }
  };
  const handleRemoveItem = (itemId) => {
    setProductItems(items => items.filter(item => item.id !== itemId));
  };

  const items = invoiceType === "inventory" ? productItems : serviceItems;
  const formatNumber = (value) => Number(value).toFixed(2);

  // Create the blank row for adding new products
  const createBlankProductRow = () => {
    const availableProducts = productCatalog.filter(
      product => !productItems.find(item => item.ProductGuid === product.ProductGuid)
    );
    if (availableProducts.length === 0) return null;
    return {
      id: 'blank',
      ...blankRowData,
      isBlank: true,
      availableProducts
    };
  };

  // Columns
  const columns = invoiceType === "inventory"
    ? [
        { header: 'Product', key: 'ProductGuid', render: (row) => row.isBlank ? (
            <Select
              value={row.ProductGuid}
              onChange={(e) => handleProductSelect(e.target.value)}
              options={[
                { value: "", label: "Select Product..." },
                ...row.availableProducts.map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))
              ]}
            />
          ) : row.ProductGuid },
        { header: 'Description', key: 'Description', render: (row) => row.Description },
        { header: 'Unit Price', key: 'UnitPrice', render: (row) => row.isBlank && !row.ProductGuid ? '' : (
            <span className={styles.rightAlignNum}>{formatNumber(row.UnitPrice)}</span>
          ) },
        { header: 'Quantity', key: 'Quantity', render: (row) => row.isBlank ? (
            row.ProductGuid ? (
              <Input type="number" value={row.Quantity} onChange={(e) => handleBlankRowQuantityChange(e.target.value)} min="1" step="1" />
            ) : ''
          ) : <span className={styles.rightAlignNum}>{row.Quantity}</span> },
        { header: 'Discount (%)', key: 'Discount', render: (row) => row.isBlank ? (
            row.ProductGuid ? (
              <Input type="number" value={row.Discount} onChange={(e) => handleBlankRowDiscountChange(e.target.value)} min="0" max="100" step="0.01" />
            ) : ''
          ) : <span className={styles.rightAlignNum}>{formatNumber(row.Discount)}%</span> },
        { header: 'Total Price', key: 'TotalPrice', render: (row) => row.isBlank && !row.ProductGuid ? '' : (
            <span className={styles.rightAlignNum}>{formatNumber(row.TotalPrice)}</span>
          ) },
        { header: 'Actions', key: 'actions', render: (row) => row.isBlank ? (
            row.ProductGuid ? (
              <Button variant="primary" size="sm" onClick={handleAddBlankRowItem} icon={<FiPlus />} aria-label="Add" />
            ) : ''
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleRemoveItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" />
          ) },
      ]
    : [
        { header: 'Service', key: 'ServiceGuid', render: (row) => row.isBlank ? (
            <Select
              value={row.ServiceGuid}
              onChange={(e) => handleServiceSelect(e.target.value)}
              options={[
                { value: '', label: 'Select Service...' },
                ...serviceCatalog.map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))
              ]}
            />
          ) : row.ServiceGuid },
        { header: 'Description', key: 'Description', render: (row) => row.isBlank ? (
            <Input name="Description" value={row.Description} onChange={handleBlankServiceChange} placeholder="Service Description" readOnly={!!row.ServiceGuid} />
          ) : row.Description },
        { header: 'Amount', key: 'Amount', render: (row) => row.isBlank ? (
            <Input name="Amount" type="number" value={row.Amount} onChange={handleBlankServiceChange} min="0" step="0.01" placeholder="0.00" readOnly={!!row.ServiceGuid} />
          ) : <span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span> },
        { header: 'Actions', key: 'actions', render: (row) => row.isBlank ? (
            (!row.ServiceGuid && !row.Description) ? '' : (
              <Button variant="primary" size="sm" onClick={handleAddBlankServiceRow} icon={<FiPlus />} aria-label="Add" disabled={!row.Description || row.Amount <= 0} />
            )
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleRemoveServiceItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" />
          ) },
      ];

  // Table footer for total (for both inventory and service)
  let tableFooter = null;
  if (invoiceType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formatNumber(productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0))}
        </td>
        <td />
      </tr>
    );
  } else if (invoiceType === "service") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formatNumber(serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0))}
        </td>
        <td />
      </tr>
    );
  }

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const InvoiceAmount = invoiceType === "inventory"
      ? productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
      : serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);
    // Log the form data and items
    console.log({
      ...form,
      items: invoiceType === "inventory" ? productItems : serviceItems,
      InvoiceAmount,
    });
  };

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Invoice</h2>
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
          />
        </div>
      </div>

      {/* 8-column grid layout for top fields */}
      <div className={styles.topFields8Col}>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <label htmlFor="SupplierGuid" className={styles.inputLabel}>Supplier</label>
          <Select
            id="SupplierGuid"
            name="SupplierGuid"
            value={form.SupplierGuid}
            onChange={handleSupplierChange}
            options={[
              { value: '', label: 'Select Supplier...' },
              ...SUPPLIERS.map(s => ({
                value: s.CompanyGuid,
                label: `${s.CompanyCode} - ${s.Name}`
              }))
            ]}
          />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Company" placeholder="Company" id="CompanyGuid" name="CompanyGuid" value={form.CompanyGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Delivery" placeholder="Delivery" id="DeliveryGuid" name="DeliveryGuid" value={form.DeliveryGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Order" placeholder="Order" id="OrderGuid" name="OrderGuid" value={form.OrderGuid} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Supplier PO" placeholder="Supplier PO" id="SupplierPO" name="SupplierPO" value={form.SupplierPO} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Status" placeholder="Status" id="Status" name="Status" value={form.Status} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Due Date" id="DueDate" name="DueDate" value={form.DueDate} onChange={handleChange} type="date" />
        </div>
        <div className={`${styles.gridItem8} ${styles.span6}`}>
          <Input
            label="Description"
            placeholder="Description"
            id="Description"
            name="Description"
            value={form.Description}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Purchase Order Number" placeholder="PO Number" id="PurchaseOrderNumber" name="PurchaseOrderNumber" value={form.PurchaseOrderNumber} onChange={handleChange} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Purchase Invoice Number" placeholder="Invoice Number" id="PurchaseInvoiceNumber" name="PurchaseInvoiceNumber" value={form.PurchaseInvoiceNumber} onChange={handleChange} />
        </div>
      </div>

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (invoiceType === "inventory") {
          const blankRow = createBlankProductRow();
          if (blankRow) {
            itemsWithBlank.push(blankRow);
          }
        } else if (invoiceType === "service") {
          itemsWithBlank.push({ id: 'blank', ...blankServiceRow, isBlank: true });
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
