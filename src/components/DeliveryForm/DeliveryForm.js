'use client';

import React, { useState, useEffect } from 'react';
import styles from './DeliveryForm.module.scss';
import Input from '../ui/Input/Input';
import DataTable from '../ui/DataTable/DataTable';
import Button from '../ui/Button/Button';
import { FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import Select from '../ui/Select/Select';

import { InventoryService } from '../../services/inventoryService';
import { ServiceService } from '../../services/serviceService';
import SupplierService from '../../services/supplierService';

import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';

// Supplier service instance
const supplierService = new SupplierService();

// Catalogs will be loaded from services (mocked in-memory services)
// They are mapped to the shape expected by the UI (ProductGuid/ServiceGuid etc.)

// Create service instances (lightweight, in-memory mocks)
const inventoryService = new InventoryService();
const serviceService = new ServiceService();

const initialProductItems = [
  {
    id: 1,
    ProductGuid: 'P001',
    Description: 'Premium Widget A',
    UnitPrice: 150.0,
    Quantity: 2,
    TotalPrice: 300.0,
    Discount: 0,
  },
  {
    id: 2,
    ProductGuid: 'P002',
    Description: 'Standard Widget B',
    UnitPrice: 85.5,
    Quantity: 1,
    TotalPrice: 85.5,
    Discount: 0,
  },
];

const initialServiceItems = [
  {
    id: 1,
    ServiceGuid: 'S001',
    Description: 'Consultation Service',
    Amount: 250.0,
  },
];

// State for the blank row for service
const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Amount: 0,
};
export default function DeliveryForm() {
  // Grouped state hooks
  const [deliveryType, setDeliveryType] = useState('inventory');
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [productCatalog, setProductCatalog] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    SupplierGuid: '',
    PurchaseDeliveryNumber: '',
    Address: '',
    ContactNum: '',
    ContactName: '',
    Date: '',
    Description: '',
    PurchaseType: 'inventory', // "inventory" or "service"
    PreparedBy: '',
    ApprovedBy: '',
  });

  const [blankServiceRow, setBlankServiceRow] = useState(
    initialBlankServiceRow
  );

  const [blankRowData, setBlankRowData] = useState({
    ProductGuid: '',
    Description: '',
    UnitPrice: 0,
    Quantity: 1,
    TotalPrice: 0,
    Discount: 0,
  });

  // Load catalogs on mount
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const inv = await inventoryService.getAllInventories();
        const mappedProducts = inv.map((item) => ({
          ProductGuid: item.Guid || item.ProductCode,
          Description: item.Name || item.Description || item.ProductCode,
          UnitPrice: item.UnitPrice || 0,
        }));
        const sv = await serviceService.getAllServices();
        const mappedServices = sv.map((s) => ({
          ServiceGuid: s.Guid || s.ServiceCode,
          Description: s.Name || s.Description || s.ServiceCode,
          Amount: s.Amount || 0,
        }));
        if (mounted) {
          setProductCatalog(mappedProducts);
          setServiceCatalog(mappedServices);
          try {
            const s = await supplierService.getAllSuppliers();
            if (mounted) setSuppliers(s);
          } catch (e) {
            console.error('Failed to load suppliers', e);
          }
        }
      } catch (err) {
        console.error('Failed to load catalogs', err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Handlers and helpers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSupplierChange = (e) => {
    const selectedGuid = e.target.value;
    const selectedSupplier = suppliers.find(
      (s) => s.CompanyGuid === selectedGuid
    );
    setForm((form) => ({
      ...form,
      SupplierGuid: selectedGuid,
      ContactNum: selectedSupplier ? selectedSupplier.ContactNumber : '',
      ContactName: selectedSupplier ? selectedSupplier.ContactPerson : '',
      Address: selectedSupplier ? selectedSupplier.Address : '',
    }));
  };

  const handleTypeChange = (e) => {
    setDeliveryType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
  };

  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    setBlankServiceRow((prev) => ({
      ...prev,
      [name]: name === 'Amount' ? Number(value) : value,
    }));
  };

  const handleServiceSelect = (serviceGuid) => {
    if (!serviceGuid) {
      setBlankServiceRow(initialBlankServiceRow);
      return;
    }
    const selectedService = serviceCatalog.find(
      (s) => s.ServiceGuid === serviceGuid
    );
    if (selectedService) {
      setBlankServiceRow({
        ServiceGuid: selectedService.ServiceGuid,
        Description: selectedService.Description,
        Amount: selectedService.Amount,
      });
    }
  };

  const handleAddBlankServiceRow = () => {
    if (blankServiceRow.Description && blankServiceRow.Amount > 0) {
      setServiceItems([
        ...serviceItems,
        { id: Date.now(), ...blankServiceRow },
      ]);
      setBlankServiceRow(initialBlankServiceRow);
    }
  };

  const handleRemoveServiceItem = (itemId) => {
    setServiceItems((items) => items.filter((item) => item.id !== itemId));
  };

  const calculateTotalPrice = (unitPrice, quantity, discount = 0) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleProductSelect = (productGuid) => {
    if (!productGuid) {
      setBlankRowData({
        ProductGuid: '',
        Description: '',
        UnitPrice: 0,
        Quantity: 1,
        TotalPrice: 0,
        Discount: 0,
      });
      return;
    }
    const selectedProduct = productCatalog.find(
      (p) => p.ProductGuid === productGuid
    );
    if (selectedProduct) {
      const totalPrice = calculateTotalPrice(
        selectedProduct.UnitPrice,
        blankRowData.Quantity,
        blankRowData.Discount
      );
      setBlankRowData({
        ProductGuid: selectedProduct.ProductGuid,
        Description: selectedProduct.Description,
        UnitPrice: selectedProduct.UnitPrice,
        Quantity: blankRowData.Quantity,
        TotalPrice: totalPrice,
        Discount: blankRowData.Discount,
      });
    }
  };

  const handleBlankRowQuantityChange = (newQuantity) => {
    const quantity = Math.max(1, Number(newQuantity) || 1);
    const totalPrice = calculateTotalPrice(
      blankRowData.UnitPrice,
      quantity,
      blankRowData.Discount
    );
    setBlankRowData({
      ...blankRowData,
      Quantity: quantity,
      TotalPrice: totalPrice,
    });
  };

  const handleBlankRowDiscountChange = (newDiscount) => {
    const discount = Math.max(0, Math.min(100, Number(newDiscount) || 0));
    const totalPrice = calculateTotalPrice(
      blankRowData.UnitPrice,
      blankRowData.Quantity,
      discount
    );
    setBlankRowData({
      ...blankRowData,
      Discount: discount,
      TotalPrice: totalPrice,
    });
  };

  const handleAddBlankRowItem = () => {
    if (blankRowData.ProductGuid) {
      const newItem = {
        id: Date.now(),
        ...blankRowData,
      };
      setProductItems([...productItems, newItem]);
      setBlankRowData({
        ProductGuid: '',
        Description: '',
        UnitPrice: 0,
        Quantity: 1,
        TotalPrice: 0,
        Discount: 0,
      });
    }
  };

  const handleRemoveItem = (itemId) => {
    setProductItems((items) => items.filter((item) => item.id !== itemId));
  };

  const items = deliveryType === 'inventory' ? productItems : serviceItems;

  const formatNumber = (value) => Number(value).toFixed(2);

  const createBlankProductRow = () => {
    const availableProducts = productCatalog.filter(
      (product) =>
        !productItems.find((item) => item.ProductGuid === product.ProductGuid)
    );
    if (availableProducts.length === 0) return null;
    return {
      id: 'blank',
      ...blankRowData,
      isBlank: true,
      availableProducts,
    };
  };

  const columns =
    deliveryType === 'inventory'
      ? [
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
                      { value: '', label: 'Select Product...' },
                      ...row.availableProducts.map((p) => ({
                        value: p.ProductGuid,
                        label: `${p.ProductGuid} - ${p.Description}`,
                      })),
                    ]}
                    searchable
                    placeholder="Search product..."
                  />
                );
              }
              return row.ProductGuid;
            },
          },
          {
            header: 'Description',
            key: 'Description',
            render: (row) => (row.isBlank ? row.Description : row.Description),
          },
          {
            header: 'Unit Price',
            key: 'UnitPrice',
            render: (row) =>
              row.isBlank && !row.ProductGuid ? (
                ''
              ) : (
                <span className={styles.rightAlignNum}>
                  {formatNumber(row.UnitPrice)}
                </span>
              ),
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
                    onChange={(e) =>
                      handleBlankRowQuantityChange(e.target.value)
                    }
                    min="1"
                    step="1"
                  />
                );
              }
              return (
                <span className={styles.rightAlignNum}>{row.Quantity}</span>
              );
            },
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
                    onChange={(e) =>
                      handleBlankRowDiscountChange(e.target.value)
                    }
                    min="0"
                    max="100"
                    step="0.01"
                  />
                );
              }
              return (
                <span className={styles.rightAlignNum}>
                  {formatNumber(row.Discount)}%
                </span>
              );
            },
          },
          {
            header: 'Total Price',
            key: 'TotalPrice',
            render: (row) =>
              row.isBlank && !row.ProductGuid ? (
                ''
              ) : (
                <span className={styles.rightAlignNum}>
                  {formatNumber(row.TotalPrice)}
                </span>
              ),
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
            },
          },
        ]
      : [
          {
            header: 'Service',
            key: 'ServiceGuid',
            render: (row) =>
              row.isBlank ? (
                <Select
                  value={row.ServiceGuid}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  searchable
                  placeholder="Search service..."
                  options={[
                    { value: '', label: 'Select Service...' },
                    ...serviceCatalog.map((s) => ({
                      value: s.ServiceGuid,
                      label: `${s.ServiceGuid} - ${s.Description}`,
                    })),
                  ]}
                />
              ) : (
                row.ServiceGuid
              ),
          },
          {
            header: 'Description',
            key: 'Description',
            render: (row) =>
              row.isBlank ? (
                <Input
                  name="Description"
                  value={row.Description}
                  onChange={handleBlankServiceChange}
                  placeholder="Service Description"
                  readOnly={!!row.ServiceGuid}
                />
              ) : (
                row.Description
              ),
          },
          {
            header: 'Amount',
            key: 'Amount',
            render: (row) =>
              row.isBlank ? (
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
                <span className={styles.rightAlignNum}>
                  {formatNumber(row.Amount)}
                </span>
              ),
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
            },
          },
        ];

  let tableFooter = null;
  if (deliveryType === 'inventory') {
    tableFooter = (
      <tr>
        <td
          colSpan={columns.length - 2}
          style={{ textAlign: 'right', fontWeight: 'bold' }}>
          Total
        </td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formatNumber(
            items.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
          )}
        </td>
        <td />
      </tr>
    );
  } else if (deliveryType === 'service') {
    tableFooter = (
      <tr>
        <td
          colSpan={columns.length - 2}
          style={{ textAlign: 'right', fontWeight: 'bold' }}>
          Total
        </td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formatNumber(
            items.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0)
          )}
        </td>
        <td />
      </tr>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      ...form,
      items: deliveryType === 'inventory' ? productItems : serviceItems,
    });
  };

  return (
    <form className={styles.deliveryForm} onSubmit={handleSubmit}>
      <Breadcrumbs
        showBack
        items={[{ label: 'Delivery Form' }]}
        backIcon={<FiFileText size={18} />}
      />

      <div className={styles.headerSection}>
        <h2 className={styles.title}>Delivery Form</h2>
        <div className={styles.typeSelector}>
          <label htmlFor="PurchaseType" className={styles.typeLabel}>
            Type:
          </label>
          <Select
            id="PurchaseType"
            name="PurchaseType"
            value={form.PurchaseType}
            onChange={handleTypeChange}
            options={[
              { value: 'inventory', label: 'Inventory' },
              { value: 'service', label: 'Service' },
            ]}
            className={styles.typeSelect}
          />
        </div>
      </div>

      {/* 8-column grid layout for top fields */}
      <div className={styles.topFields8Col}>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <label htmlFor="SupplierGuid" className={styles.inputLabel}>
            Supplier
          </label>
          <Select
            id="SupplierGuid"
            name="SupplierGuid"
            value={form.SupplierGuid}
            onChange={handleSupplierChange}
            searchable
            placeholder="Search supplier..."
            options={[
              { value: '', label: 'Select Supplier...' },
              ...suppliers.map((s) => ({
                value: s.CompanyGuid,
                label: `${s.CompanyCode} - ${s.Name}`,
              })),
            ]}
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
            readOnly
          />
        </div>

        <div
          className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input
            label="Date"
            id="Date"
            name="Date"
            value={form.Date}
            onChange={handleChange}
            type="date"
          />
        </div>

        {/* Row 2: Address (span 5), Quotation Number (span 3, right-aligned) */}
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Contact Name"
            placeholder="Contact Name"
            id="ContactName"
            name="ContactName"
            value={form.ContactName}
            onChange={handleChange}
            readOnly
          />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input
            label="Contact Number"
            placeholder="Contact Number"
            id="ContactNum"
            name="ContactNum"
            value={form.ContactNum}
            onChange={handleChange}
            readOnly
          />
        </div>
        <div
          className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input
            label="Purchase Delivery Number"
            placeholder="Purchase Delivery Number"
            id="PurchaseDeliveryNumber"
            name="PurchaseDeliveryNumber"
            value={form.PurchaseDeliveryNumber}
            onChange={handleChange}
          />
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

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (deliveryType === 'inventory') {
          const blankRow = createBlankProductRow();
          if (blankRow) {
            itemsWithBlank.push(blankRow);
          }
        } else if (deliveryType === 'service') {
          itemsWithBlank.push({
            id: 'blank',
            ...blankServiceRow,
            isBlank: true,
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
          <Input
            label="Prepared By"
            placeholder="Prepared By"
            id="PreparedBy"
            name="PreparedBy"
            value={form.PreparedBy}
            onChange={handleChange}
          />
          <Input
            label="Approved By"
            placeholder="Approved By"
            id="ApprovedBy"
            name="ApprovedBy"
            value={form.ApprovedBy}
            onChange={handleChange}
          />
        </div>
        <Button type="submit" variant="save">
          Save
        </Button>
      </div>
    </form>
  );
}
