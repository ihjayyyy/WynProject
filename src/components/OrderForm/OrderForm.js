'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import QuotationService from '../../services/quotationService';
import SalesQuotationService from '../../services/salesQuotationService';
import OrderService from '../../services/orderService';
import SupplierService from '../../services/supplierService';
import { InventoryService } from '../../services/inventoryService';
import { ServiceService } from '../../services/serviceService';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { FiClipboard } from 'react-icons/fi';
import styles from "./OrderForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from "react-icons/fi";
import Select from "../ui/Select/Select";

// Data for suppliers, products and services will be loaded from services

const initialProductItems = [];


const initialServiceItems = [];

// (service list loaded from ServiceService)

// State for the blank row for service
const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Amount: 0,
};



// Default adapter so existing usage remains unchanged
const defaultServiceFactory = () => {
  const svc = new OrderService();
  return {
    getById: (id) => svc.getOrderById(id),
    getDetailsWithItemsByOrderGuid: (id) => svc.getDetailsWithItemsByOrderGuid(id),
    create: (payload) => svc.createOrder(payload),
    update: (payload) => svc.updateOrder(payload),
    subscribe: (cb) => OrderService.subscribe(cb),
  };
};

export default function OrderForm({ serviceFactory = defaultServiceFactory, landingRoute = '/purchase/orderlanding', title = 'Order Form', saveType = null }) {
  const searchParams = useSearchParams();
  const fromQuotation = searchParams ? searchParams.get('fromQuotation') : null;
  const orderId = searchParams ? searchParams.get('id') : null;
  const router = useRouter();
  // If navigated from a quotation, try to prefill the order form
  useEffect(() => {
    let mounted = true;
    if (!fromQuotation) return;
    const load = async () => {
      try {
        const quotationSvc = new QuotationService();
        let q = await quotationSvc.getQuotationById(fromQuotation);
        let usedSales = false;
        let salesSvc = null;

        // If not found in regular quotations, try sales quotations
        if (!q) {
          salesSvc = new SalesQuotationService();
          q = await salesSvc.getSalesQuotationById(fromQuotation);
          if (q) usedSales = true;
        }

        if (!mounted || !q) return;

        // Map fields from quotation to order form state
        // Try to resolve supplier details to populate address/contact
        let supplierAddress = '';
        let supplierContactName = q.SupplierContactPerson || '';
        let supplierContactNum = q.SupplierContactNumber || '';
        try {
          const supplierSvc = new SupplierService();
          const srec = await supplierSvc.getSupplierById(q.SupplierGuid || q.SupplierCode || q.SupplierCompanyCode || null);
          if (srec) {
            supplierAddress = srec.Address || supplierAddress;
            supplierContactName = supplierContactName || srec.ContactPerson || srec.ContactName || '';
            supplierContactNum = supplierContactNum || srec.ContactNumber || srec.Phone || '';
          }
        } catch (e) {
          // ignore
        }

        setForm((prev) => ({
          ...prev,
          SupplierGuid: q.SupplierGuid || prev.SupplierGuid,
          QuotationNumber: q.QuotationNumber || prev.QuotationNumber,
          Address: supplierAddress || prev.Address,
          ContactNum: supplierContactNum || prev.ContactNum,
          ContactName: supplierContactName || prev.ContactName,
          Date: q.Date || prev.Date,
          Description: q.Description || prev.Description,
          // accept either PurchaseType or SalesType from the record so the form can be reused
          PurchaseType: (q.PurchaseType || q.SalesType) ? (q.PurchaseType || q.SalesType).toLowerCase() : prev.PurchaseType,
        }));

        // Load details and map to order items using the appropriate service
        const details = usedSales && salesSvc ? await salesSvc.getDetailsWithItemsByQuotationGuid(q.Guid) : await quotationSvc.getDetailsWithItemsByQuotationGuid(q.Guid);
        if (!mounted || !details) return;
        const purchaseType = (q.PurchaseType || q.SalesType || '').toLowerCase();
        if (purchaseType === 'inventory') {
          const mapped = details.map((d, idx) => ({
            id: Date.now() + idx,
            ProductGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            UnitPrice: d.UnitPrice || 0,
            Quantity: d.Quantity || 1,
            TotalPrice: d.TotalPrice || 0,
            Discount: d.Discount || 0,
          }));
          setProductItems(mapped);
          setOrderType('inventory');
        } else {
          const mapped = details.map((d, idx) => ({
            id: Date.now() + idx,
            ServiceGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            Amount: d.UnitPrice || d.TotalPrice || 0,
          }));
          setServiceItems(mapped);
          setOrderType('service');
        }
      } catch (e) {
        // ignore and proceed with blank form
        console.error('Failed to prefill order from quotation', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fromQuotation]);

  // If navigated from an existing order (e.g. /purchase/orderform?id=ORD-001), prefill the form
  useEffect(() => {
    let mounted = true;
    if (!orderId) return;
    const loadOrder = async () => {
      try {
        const svc = serviceFactory();
        const ord = await svc.getById(orderId);
        if (!mounted || !ord) return;

        // Resolve supplier to populate address/contact
        let supplierAddress = '';
        let supplierContactName = ord.SupplierContactPerson || '';
        let supplierContactNum = ord.SupplierContactNumber || '';
        try {
          const supplierSvc = new SupplierService();
          const srec = await supplierSvc.getSupplierById(ord.SupplierGuid || ord.SupplierCode || null);
          if (srec) {
            supplierAddress = srec.Address || supplierAddress;
            supplierContactName = supplierContactName || srec.ContactPerson || srec.ContactName || '';
            supplierContactNum = supplierContactNum || srec.ContactNumber || srec.Phone || '';
          }
        } catch (e) {
          // ignore
        }

        setForm((prev) => ({
          ...prev,
          Guid: ord.Guid || prev.Guid,
          SupplierGuid: ord.SupplierGuid || prev.SupplierGuid,
          QuotationNumber: ord.QuotationNumber || prev.QuotationNumber,
          PurchaseOrderNumber: ord.PurchaseOrderNumber || prev.PurchaseOrderNumber,
          Address: supplierAddress || prev.Address,
          ContactNum: supplierContactNum || prev.ContactNum,
          ContactName: supplierContactName || prev.ContactName,
          Date: ord.Date || prev.Date,
          Description: ord.Description || prev.Description,
          PurchaseType: (ord.PurchaseType || '').toLowerCase() || prev.PurchaseType,
          PreparedBy: ord.PreparedBy || prev.PreparedBy,
          ApprovedBy: ord.ApprovedBy || prev.ApprovedBy,
          Status: ord.Status || prev.Status,
        }));

  const details = await svc.getDetailsWithItemsByOrderGuid(ord.Guid);
        if (!mounted || !details) return;

        if ((ord.PurchaseType || '').toLowerCase() === 'inventory') {
          const mapped = details.map((d, idx) => ({
            id: Date.now() + idx,
            ProductGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            UnitPrice: d.UnitPrice || 0,
            Quantity: d.Quantity || 1,
            TotalPrice: d.TotalPrice || 0,
            Discount: d.Discount || 0,
          }));
          setProductItems(mapped);
          setOrderType('inventory');
        } else {
          const mapped = details.map((d, idx) => ({
            id: Date.now() + idx,
            ServiceGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            Amount: d.UnitPrice || d.TotalPrice || 0,
          }));
          setServiceItems(mapped);
          setOrderType('service');
        }
      } catch (e) {
        console.error('Failed to prefill order from order id', e);
      }
    };
    loadOrder();
    return () => { mounted = false; };
  }, [orderId, serviceFactory]);

  // Loaded lists from services
  const [suppliers, setSuppliers] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Load supplier/product/service catalogs on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const supplierSvc = new SupplierService();
        const invSvc = new InventoryService();
        const svcSvc = new ServiceService();

        const [sList, invList, svcList] = await Promise.all([
          supplierSvc.getAllSuppliers(),
          invSvc.getAllInventories(),
          svcSvc.getAllServices(),
        ]);

        if (!mounted) return;
        setSuppliers(sList || []);
        setAvailableProducts((invList || []).map(i => ({
          ProductGuid: i.Guid,
          Description: i.Name || i.Description || i.ProductCode || '',
          UnitPrice: i.UnitPrice || 0
        })));
        setAvailableServices((svcList || []).map(s => ({
          ServiceGuid: s.Guid,
          Description: s.Name || s.Description || s.ServiceCode || '',
          Amount: s.Price || s.Amount || 0
        })));
      } catch (e) {
        console.error('Failed to load supplier/product/service catalogs', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const [orderType, setOrderType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showConvertDeliveryConfirm, setShowConvertDeliveryConfirm] = useState(false);
  const [form, setForm] = useState({
    Guid: '',
    SupplierGuid: "",
    QuotationNumber: "Q-2025-0001", // Static/fixed
    PurchaseOrderNumber: "",
    Address: "",
    ContactName: "",
    ContactNum: "",
    Date: "",
    ValidUntil: "",
    Description: "",
    PurchaseType: "inventory", // "inventory" or "service"
    PreparedBy: "",
    ApprovedBy: "",
    Status: 'draft',
    OrderAmount: 0,
    // ValidUntil: "",
  });

  // If creating a new order (not viewing an existing one), initialize Date and ValidUntil
  useEffect(() => {
    let mounted = true;
    if (!mounted) return;
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const d = new Date(today);
      d.setMonth(d.getMonth() + 1);
      const validStr = d.toISOString().slice(0, 10);
      // Only set defaults when not viewing an existing order
      if (!orderId) {
        setForm((prev) => ({ ...prev, Date: prev.Date || todayStr, ValidUntil: prev.ValidUntil || validStr }));
      }
    } catch (e) {
      // ignore
    }
    return () => { mounted = false; };
  }, [orderId]);

  // Determine view/edit mode: editable when creating or when existing order is in DRAFT
  const isView = !!orderId || !!form.Guid;
  const isEditable = !isView || (String(form.Status || '').trim().toUpperCase() === 'DRAFT');

  // Control whether the blank-row select controls are visible (hidden behind a button initially)
  const [showBlankProductSelector, setShowBlankProductSelector] = useState(false);
  const [showBlankServiceSelector, setShowBlankServiceSelector] = useState(false);


  // Handle input changes (except Supplier)
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle supplier dropdown change
  const handleSupplierChange = (e) => {
    const selectedGuid = e.target.value;
    const selectedSupplier = suppliers.find(s => s.CompanyGuid === selectedGuid);
    setForm(form => ({
      ...form,
      SupplierGuid: selectedGuid,
      ContactNum: selectedSupplier ? selectedSupplier.ContactNumber : '',
      ContactName: selectedSupplier ? selectedSupplier.ContactPerson || selectedSupplier.ContactPerson : '',
      Address: selectedSupplier ? selectedSupplier.Address : ''
    }));
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
    const selectedService = availableServices.find(s => s.ServiceGuid === serviceGuid);
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
    // Reset the blank selectors when switching types
    setShowBlankProductSelector(false);
    setShowBlankServiceSelector(false);
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

  // Inline editing state for existing rows (copy behavior from QuotationForm)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedRow, setEditedRow] = useState(null);

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditedRow({ ...item });
  };

  const handleEditChange = (name, value) => {
    setEditedRow((prev) => {
      if (!prev) return prev;
      let next = { ...prev, [name]: value };

      // If product selection changed, pull unit price and description from catalog and recalc total
      if (name === 'ProductGuid') {
        const selected = (availableProducts || []).find(p => p.ProductGuid === value);
        if (selected) {
          next.UnitPrice = selected.UnitPrice || 0;
          next.Description = selected.Description || next.Description;
          const qty = Number(next.Quantity || 1);
          const disc = Number(next.Discount || 0);
          next.TotalPrice = calculateTotalPrice(next.UnitPrice, qty, disc);
        }
      }

      // If service selection changed, pull amount and description from service catalog
      if (name === 'ServiceGuid') {
        const selected = (availableServices || []).find(s => s.ServiceGuid === value);
        if (selected) {
          next.Amount = selected.Amount || 0;
          next.Description = selected.Description || next.Description;
        }
      }

      // If quantity or discount changed for inventory, recalc total
      if (name === 'Quantity' || name === 'Discount') {
        const qty = Math.max(1, Number(name === 'Quantity' ? value : next.Quantity) || 1);
        const disc = Math.max(0, Math.min(100, Number(name === 'Discount' ? value : next.Discount) || 0));
        next.Quantity = qty;
        next.Discount = disc;
        const unit = Number(next.UnitPrice || 0);
        next.TotalPrice = calculateTotalPrice(unit, qty, disc);
      }

      // If unit price edited, recalc total
      if (name === 'UnitPrice') {
        const unit = Number(value) || 0;
        const qty = Math.max(1, Number(next.Quantity || 1) || 1);
        const disc = Math.max(0, Math.min(100, Number(next.Discount || 0) || 0));
        next.UnitPrice = unit;
        next.TotalPrice = calculateTotalPrice(unit, qty, disc);
      }

      // If amount edited for service, ensure numeric
      if (name === 'Amount') {
        next.Amount = Number(value) || 0;
      }

      return next;
    });
  };

  const handleSaveEdit = () => {
    if (!editedRow) return;
    setProductItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    setServiceItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    setEditingItemId(null);
    setEditedRow(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedRow(null);
  };

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
    const selectedProduct = availableProducts.find(p => p.ProductGuid === productGuid);
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

  // Table columns (use inventory/service column definitions with inline edit support)
  const inventoryColumns = [
    {
      header: 'Product',
      key: 'ProductGuid',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankProductSelector) {
            return (
              <Button variant="transparent" size="sm" onClick={() => setShowBlankProductSelector(true)} icon={<FiPlus />}>Add Product...</Button>
            );
          }
          return (
            <Select
              value={row.ProductGuid}
              onChange={(e) => handleProductSelect(e.target.value)}
              options={[
                { value: "", label: "Select Product..." },
                ...row.availableProducts.map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))
              ]}
            />
          );
        }
        if (editingItemId === row.id) {
          return (
            <Select
              value={editedRow ? editedRow.ProductGuid : row.ProductGuid}
              onChange={(e) => handleEditChange('ProductGuid', e.target.value)}
              options={[{ value: '', label: 'Select Product...' }, ...(availableProducts || []).map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))]}
              searchable
            />
          );
        }
        return row.ProductGuid;
      }
    },
    {
      header: 'Description',
      key: 'Description',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankProductSelector && !row.ProductGuid) return '';
          return <Input value={row.Description} onChange={(e) => handleBlankRowDescriptionChange(e.target.value)} placeholder="Description" />;
        }
        if (editingItemId === row.id) return <Input value={editedRow ? editedRow.Description : row.Description} onChange={(e) => handleEditChange('Description', e.target.value)} />;
        return row.Description;
      }
    },
    {
      header: 'Unit Price',
      key: 'UnitPrice',
      render: (row) => row.isBlank && !row.ProductGuid ? '' : (editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.UnitPrice : row.UnitPrice} onChange={(e) => handleEditChange('UnitPrice', e.target.value)} min="0" step="0.01" /> : <span className={styles.rightAlignNum}>{formatNumber(row.UnitPrice)}</span>)
    },
    {
      header: 'Quantity',
      key: 'Quantity',
      render: (row) => {
        if (row.isBlank) {
          if (!row.ProductGuid) return '';
          return <Input type="number" value={row.Quantity} onChange={(e) => handleBlankRowQuantityChange(e.target.value)} min="1" step="1" />;
        }
        return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.Quantity : row.Quantity} onChange={(e) => handleEditChange('Quantity', e.target.value)} min="1" step="1" /> : <span className={styles.rightAlignNum}>{row.Quantity}</span>;
      }
    },
    {
      header: 'Discount (%)',
      key: 'Discount',
      render: (row) => {
        if (row.isBlank) {
          if (!row.ProductGuid) return '';
          return <Input type="number" value={row.Discount} onChange={(e) => handleBlankRowDiscountChange(e.target.value)} min="0" max="100" step="0.01" />;
        }
        return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.Discount : row.Discount} onChange={(e) => handleEditChange('Discount', e.target.value)} min="0" max="100" step="0.01" /> : <span className={styles.rightAlignNum}>{formatNumber(row.Discount)}%</span>;
      }
    },
    {
      header: 'Total Price',
      key: 'TotalPrice',
      render: (row) => (row.isBlank && !row.ProductGuid ? '' : <span className={styles.rightAlignNum}>{formatNumber(editingItemId === row.id && editedRow ? editedRow.TotalPrice : row.TotalPrice)}</span>)
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => {
        if (!isEditable) return null;
        if (row.isBlank) {
          if (!row.ProductGuid) return '';
          return <Button variant="transparent" size="sm" onClick={handleAddBlankRowItem} icon={<FiPlus />} aria-label="Add" />;
        }
        if (editingItemId === row.id) return (<div style={{ display: 'flex', gap: 8 }}><Button variant="transparent" size="sm" onClick={handleSaveEdit} icon={<FiCheck />} aria-label="Save" /><Button variant="danger" size="sm" onClick={handleCancelEdit} icon={<FiX />} aria-label="Cancel" /></div>);
        return (<div style={{ display: 'flex', gap: 8 }}><Button variant="transparent" size="sm" onClick={() => handleStartEdit(row)} icon={<FiEdit />} aria-label="Edit" /><Button variant="danger" size="sm" onClick={() => handleRemoveItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" /></div>);
      }
    }
  ];

  const serviceColumns = [
    {
      header: 'Service',
      key: 'ServiceGuid',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankServiceSelector) {
            return (<Button variant="transparent" size="sm" onClick={() => setShowBlankServiceSelector(true)} icon={<FiPlus />}>Add Service...</Button>);
          }
          return (<Select value={row.ServiceGuid} onChange={(e) => handleServiceSelect(e.target.value)} options={[{ value: '', label: 'Select Service...' }, ...(availableServices || []).map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))]} />);
        }
        if (editingItemId === row.id) return <Select value={editedRow ? editedRow.ServiceGuid : row.ServiceGuid} onChange={(e) => handleEditChange('ServiceGuid', e.target.value)} options={[{ value: '', label: 'Select Service...' }, ...(availableServices || []).map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))]} searchable />;
        return row.ServiceGuid;
      }
    },
    {
      header: 'Description',
      key: 'Description',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
          return (<Input name="Description" value={row.Description} onChange={handleBlankServiceChange} placeholder="Service Description" readOnly={!!row.ServiceGuid} />);
        }
        if (editingItemId === row.id) return <Input value={editedRow ? editedRow.Description : row.Description} onChange={(e) => handleEditChange('Description', e.target.value)} />;
        return row.Description;
      }
    },
    {
      header: 'Amount',
      key: 'Amount',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
          return (<Input name="Amount" type="number" value={row.Amount} onChange={handleBlankServiceChange} min="0" step="0.01" placeholder="0.00" readOnly={!!row.ServiceGuid} />);
        }
        return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.Amount : row.Amount} onChange={(e) => handleEditChange('Amount', e.target.value)} min="0" step="0.01" /> : <span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => {
        if (!isEditable) return null;
        if (row.isBlank) {
          if (!row.ServiceGuid && !row.Description) return '';
          return (<Button variant="transparent" size="sm" onClick={handleAddBlankServiceRow} icon={<FiPlus />} aria-label="Add" disabled={!row.Description || row.Amount <= 0} />);
        }
        if (editingItemId === row.id) return (<div style={{ display: 'flex', gap: 8 }}><Button variant="transparent" size="sm" onClick={handleSaveEdit} icon={<FiCheck />} aria-label="Save" /><Button variant="transparent" size="sm" onClick={handleCancelEdit} icon={<FiX />} aria-label="Cancel" /></div>);
  return (<div style={{ display: 'flex', gap: 8 }}><Button variant="transparent" size="sm" onClick={() => handleStartEdit(row)} icon={<FiEdit />} aria-label="Edit" /><Button variant="danger" size="sm" onClick={() => handleRemoveServiceItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" /></div>);
      }
    }
  ];

  const columns = orderType === 'inventory' ? inventoryColumns : serviceColumns;

  // Calculate OrderAmount
  const orderAmount = orderType === "inventory"
    ? productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
    : serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);

  // Table footer for total (for both inventory and service)
  let tableFooter = null;
  if (orderType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {formatNumber(orderAmount)}
        </td>
        <td />
      </tr>
    );
  } else if (orderType === "service") {
    // Only show total when there are real service items (not just the blank row)
    if ((serviceItems || []).length > 0) {
      tableFooter = (
        <tr>
          <td colSpan={columns.length - 2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
            {formatNumber(orderAmount)}
          </td>
          <td />
        </tr>
      );
    }
  }

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        const svc = new OrderService();
        const payload = {
          ...form,
          items: orderType === "inventory" ? productItems : serviceItems,
          OrderAmount: orderAmount,
          PurchaseType: orderType,
        };

        let res;
        if (form && form.Guid) {
          // update
          res = await svc.updateOrder(payload);
        } else {
          // create
          res = await svc.createOrder(payload);
        }

        if (res) {
          // After save, redirect to order landing
          try {
            router.push('/purchase/orderlanding');
          } catch (navErr) {
            window.location.href = '/purchase/orderlanding';
          }
        }
      } catch (err) {
        console.error('Failed to save order', err);
        setSaveError(String(err || 'Unknown error'));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const items = orderType === "inventory" ? productItems : serviceItems;
  
  // Hide the entire Actions column when the form is not editable
  const visibleColumns = columns.filter((c) => {
    if (!isEditable && String(c.key).toLowerCase() === 'actions') return false;
    return true;
  });

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <Breadcrumbs showBack items={[{ label: 'Order Form' }]} backIcon={<FiClipboard size={18}/>} />
      <div className={styles.headerSection}>
        {isView ? (
          <div className={styles.viewHeader}>
            <h2 className={styles.title}>Order: {form.Guid}</h2>
            <div className={styles.viewStatus}>
              <StatusBadge status={form.Status} />
            </div>
          </div>
        ) : (
          <h2 className={styles.title}>Order Form</h2>
        )}
        <div className={styles.typeSelector}>
          <label htmlFor="PurchaseType" className={styles.typeLabel}>Type:</label>
          <Select
            id="PurchaseType"
            name="PurchaseType"
            value={form.PurchaseType}
            onChange={handleTypeChange}
            disabled={!isEditable}
            options={[
              { value: "inventory", label: "Inventory" },
              { value: "service", label: "Service" }
            ]}
          />
        </div>
      </div>

      {/* 8-column grid layout for top fields */}
      <div className={styles.topFields8Col}>
        {/* Row 1: Supplier (span 3), Contact Number (span 2), Date (span 3, right-aligned) */}
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <label htmlFor="SupplierGuid" className={styles.inputLabel}>Supplier</label>
          <Select
            id="SupplierGuid"
            name="SupplierGuid"
            value={form.SupplierGuid}
            onChange={handleSupplierChange}
            disabled={!isEditable}
            options={[
              { value: '', label: 'Select Supplier...' },
              ...suppliers.map(s => ({
                value: s.CompanyGuid,
                label: `${s.CompanyCode} - ${s.Name}`
              }))
            ]}
          />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span6}`}>
          <Input label="Address" placeholder="Address" id="Address" name="Address" value={form.Address} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Valid Until" id="ValidUntil" name="ValidUntil" value={form.ValidUntil} onChange={handleChange} type="date" readOnly={!isEditable} />
        </div>
        
        {/* Row 2: Address (span 5), Quotation Number (span 3, right-aligned) */}


        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Contact Name" placeholder="Contact Name" id="ContactName" name="ContactName" value={form.ContactName} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <Input label="Contact Number" placeholder="Contact Number" id="ContactNum" name="ContactNum" value={form.ContactNum} onChange={handleChange} readOnly={!isEditable} />
        </div>    

        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} readOnly />
        </div>
        
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Purchase Order Number" placeholder="PO Number" id="PurchaseOrderNumber" name="PurchaseOrderNumber" value={form.PurchaseOrderNumber} onChange={handleChange} readOnly={!isEditable} />
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
            readOnly={!isEditable}
          />
        </div>
      </div>

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
  if (isEditable && orderType === "inventory") {
          // Create the blank row for adding new products
          const availableProductsForBlank = (availableProducts || []).filter(
            product => !productItems.find(item => item.ProductGuid === product.ProductGuid)
          );
          if (availableProductsForBlank.length > 0) {
            itemsWithBlank.push({
              id: 'blank',
              ...blankRowData,
              isBlank: true,
              availableProducts: availableProductsForBlank
            });
          }
        } else if (isEditable && orderType === "service") {
          itemsWithBlank.push({
            id: 'blank',
            ...blankServiceRow,
            isBlank: true
          });
        }
        return (
          <DataTable
            columns={visibleColumns}
            data={itemsWithBlank}
            showActions={false}
            footer={tableFooter}
          />
        );
      })()}

      <div className={styles.bottomFields}>
        <div className={styles.leftBottomFields}>
          {isView && (
            <>
              <Input label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} readOnly={!isEditable} />
              <Input label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} readOnly={!isEditable} />
            </>
          )}
        </div>
        <div className={styles.rightBottomButtons}>
          {/* Convert to Delivery button (visible when order exists) */}
          {form.Guid && (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowConvertDeliveryConfirm(true)}
                title="Convert this order into a delivery"
              >
                Convert to delivery
              </Button>
              <ConfirmModal
                open={!!showConvertDeliveryConfirm}
                title="Convert order to delivery"
                message={`Are you sure you want to convert order ${form.PurchaseOrderNumber || form.Guid} into a delivery?`}
                confirmText="Convert"
                cancelText="Cancel"
                onConfirm={() => {
                  try {
                    router.push(`/purchase/deliveryform?fromOrder=${encodeURIComponent(form.Guid)}`);
                  } catch (e) {
                    window.location.href = `/purchase/deliveryform?fromOrder=${encodeURIComponent(form.Guid)}`;
                  }
                }}
                onCancel={() => setShowConvertDeliveryConfirm(false)}
              />
            </>
          )}
          {isEditable && (
            <>
              <Button type="submit" variant="save" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
              {saveError && <div className={styles.saveError} role="alert" style={{ color: 'var(--danger)', marginTop: 8 }}>{saveError}</div>}
            </>
          )}
        </div>
      </div>

    </form>
  );
}