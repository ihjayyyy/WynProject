'use client';

import React, { useState } from "react";
import styles from "./OrderForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../ui/Select/Select";


// Mock product catalog - in real app this would come from API
const productCatalog = [
  {
    ProductGuid: "P001",
    Description: "Premium Widget A",
    UnitPrice: 150.00
  },
  {
    ProductGuid: "P002", 
    Description: "Standard Widget B",
    UnitPrice: 85.50
  },
  {
    ProductGuid: "P003",
    Description: "Deluxe Widget C", 
    UnitPrice: 220.75
  },
  {
    ProductGuid: "P004",
    Description: "Basic Widget D",
    UnitPrice: 45.25
  },
  {
    ProductGuid: "P005",
    Description: "Professional Service Package",
    UnitPrice: 500.00
  }
];

const initialProductItems = [
  {
    id: 1,
    ProductGuid: "P001",
    Description: "Premium Widget A",
    UnitPrice: 150.00,
    Quantity: 2,
    TotalPrice: 300.00,
    Discount: 0
  },
  {
    id: 2,
    ProductGuid: "P002",
    Description: "Standard Widget B", 
    UnitPrice: 85.50,
    Quantity: 1,
    TotalPrice: 85.50,
    Discount: 0
  }
];


const initialServiceItems = [
  {
    id: 1,
    ServiceGuid: "S001",
    Description: "Consultation Service",
    Amount: 250.00,
  },
];

// Mock service catalog - in real app this would come from API
const serviceCatalog = [
  {
    ServiceGuid: "S001",
    Description: "Consultation Service",
    Amount: 250.00
  },
  {
    ServiceGuid: "S002",
    Description: "Installation Service",
    Amount: 400.00
  },
  {
    ServiceGuid: "S003",
    Description: "Maintenance Package",
    Amount: 150.00
  }
];

// State for the blank row for service
const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Amount: 0,
};



export default function OrderForm() {
  const [orderType, setOrderType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [form, setForm] = useState({
    SupplierGuid: "",
    QuotationNumber: "Q-2025-0001", // Static/fixed
    PurchaseOrderNumber: "",
    Address: "",
    ContactNum: "",
    Date: "",
    Description: "",
    PurchaseType: "inventory", // "inventory" or "service"
    PreparedBy: "",
    ApprovedBy: "",
    OrderAmount: 0,
    // Status: "draft",
    // ValidUntil: "",
  });


  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // State for blank service row
  const [blankServiceRow, setBlankServiceRow] = useState(initialBlankServiceRow);


  // Handle blank service row changes
  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    setBlankServiceRow((prev) => ({
      ...prev,
      [name]: name === 'Amount' ? Number(value) : value
    }));
  };

  // Handle service selection in blank row
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

  // Add blank service row to service items
  const handleAddBlankServiceRow = () => {
    if (blankServiceRow.Description && blankServiceRow.Amount > 0) {
      setServiceItems([...serviceItems, { id: Date.now(), ...blankServiceRow }]);
      setBlankServiceRow(initialBlankServiceRow);
    }
  };

  // Remove service item
  const handleRemoveServiceItem = (itemId) => {
    setServiceItems(items => items.filter(item => item.id !== itemId));
  };

   // Helper to format numbers to 2 decimal places
  const formatNumber = (value) => Number(value).toFixed(2);

  // Handle type change
  const handleTypeChange = (e) => {
    setOrderType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
  };


  // State for the blank row being edited
  const [blankRowData, setBlankRowData] = useState({
    ProductGuid: '',
    Description: '',
    UnitPrice: 0,
    Quantity: 1,
    TotalPrice: 0,
    Discount: 0
  });

  // Calculate total price based on quantity, unit price, and discount
  const calculateTotalPrice = (unitPrice, quantity, discount = 0) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  // Handle product selection in the blank row
  const handleProductSelect = (productGuid) => {
    if (!productGuid) {
      setBlankRowData({
        ProductGuid: '',
        Description: '',
        UnitPrice: 0,
        Quantity: 1,
        TotalPrice: 0,
        Discount: 0
      });
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

  // Handle blank row field changes
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

  // Add the blank row item to the list
  const handleAddBlankRowItem = () => {
    if (blankRowData.ProductGuid) {
      const newItem = {
        id: Date.now(),
        ...blankRowData
      };
      setProductItems([...productItems, newItem]);
      // Reset blank row
      setBlankRowData({
        ProductGuid: '',
        Description: '',
        UnitPrice: 0,
        Quantity: 1,
        TotalPrice: 0,
        Discount: 0
      });
    }
  };

  // Remove product item
  const handleRemoveItem = (itemId) => {
    setProductItems(items => items.filter(item => item.id !== itemId));
  };

  // Table columns (editable)
  const columns = orderType === "inventory"
    ? [
        // ...existing code for inventory columns...
        { 
          header: 'Product', 
          key: 'ProductGuid',
          render: (row) => {
            if (row.isBlank) {
              return (
                <Select
                  value={row.ProductGuid}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  options={[
                    { value: "", label: "Select Product..." },
                    ...row.availableProducts.map(p => ({
                      value: p.ProductGuid,
                      label: `${p.ProductGuid} - ${p.Description}`
                    }))
                  ]}
                />
              );
            }
            return row.ProductGuid;
          }
        },
        { 
          header: 'Description', 
          key: 'Description',
          render: (row) => row.isBlank ? row.Description : row.Description
        },
        {
          header: 'Unit Price',
          key: 'UnitPrice',
          render: (row) => row.isBlank && !row.ProductGuid ? '' : (
            <span className={styles.rightAlignNum}>{formatNumber(row.UnitPrice)}</span>
          )
        },
        {
          header: 'Quantity',
          key: 'Quantity',
          render: (row) => {
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
            // Existing items show quantity as read-only
            return (
              <span className={styles.rightAlignNum}>{row.Quantity}</span>
            );
          }
        },
        {
          header: 'Discount (%)',
          key: 'Discount',
          render: (row) => {
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
            // Existing items show discount as read-only
            return (
              <span className={styles.rightAlignNum}>{formatNumber(row.Discount)}%</span>
            );
          }
        },
        {
          header: 'Total Price',
          key: 'TotalPrice',
          render: (row) => row.isBlank && !row.ProductGuid ? '' : (
            <span className={styles.rightAlignNum}>{formatNumber(row.TotalPrice)}</span>
          )
        },
        {
          header: 'Actions',
          key: 'actions',
          render: (row) => {
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
        {
          header: 'Service',
          key: 'ServiceGuid',
          render: (row) => row.isBlank ? (
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
        {
          header: 'Description',
          key: 'Description',
          render: (row) => row.isBlank ? (
            <Input
              name="Description"
              value={row.Description}
              onChange={handleBlankServiceChange}
              placeholder="Service Description"
              readOnly={!!row.ServiceGuid}
            />
          ) : row.Description
        },
        {
          header: 'Amount',
          key: 'Amount',
          render: (row) => row.isBlank ? (
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
          ) : (
            <span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span>
          )
        },
        {
          header: 'Actions',
          key: 'actions',
          render: (row) => {
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

  // Calculate OrderAmount
  const orderAmount = orderType === "inventory"
    ? productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
    : serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);

  // Table footer for total (for both inventory and service)
  let tableFooter = null;
  if (orderType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 1} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold' }}>
          {formatNumber(orderAmount)}
        </td>
      </tr>
    );
  } else if (orderType === "service") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 1} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold' }}>
          {formatNumber(orderAmount)}
        </td>
      </tr>
    );
  }

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // Log the form data and items
    console.log({
      ...form,
      items: orderType === "inventory" ? productItems : serviceItems,
      OrderAmount: orderAmount,
    });
  };

  const items = orderType === "inventory" ? productItems : serviceItems;

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Order</h2>
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
          <Input label="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} readOnly />
        </div>
        
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Purchase Order Number" placeholder="PO Number" id="PurchaseOrderNumber" name="PurchaseOrderNumber" value={form.PurchaseOrderNumber} onChange={handleChange} />
        </div>
        
        {/* Row 4: Description full width (span 8) */}
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

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (orderType === "inventory") {
          // Create the blank row for adding new products
          const availableProducts = productCatalog.filter(
            product => !productItems.find(item => item.ProductGuid === product.ProductGuid)
          );
          if (availableProducts.length > 0) {
            itemsWithBlank.push({
              id: 'blank',
              ...blankRowData,
              isBlank: true,
              availableProducts
            });
          }
        } else if (orderType === "service") {
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