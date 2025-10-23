'use client';

import React, { useState, useEffect } from "react";
import styles from "./QuotationForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiFileText, FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from "react-icons/fi";
import Select from "../ui/Select/Select";

import { InventoryService } from "../../services/inventoryService";
import { ServiceService } from "../../services/serviceService";
import SupplierService from "../../services/supplierService";
import QuotationService from '../../services/quotationService';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';

// Supplier service instance
const supplierService = new SupplierService();

const inventoryService = new InventoryService();
const serviceService = new ServiceService();

const initialProductItems = [];

const initialServiceItems = [];

// State for the blank row for service
const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Price: 0,
};
// Default adapter so existing usage remains unchanged
const defaultServiceFactory = () => {
  const svc = new QuotationService();
  return {
    getById: (id) => svc.getQuotationById(id),
    getDetailsWithItemsByQuotationGuid: (id) => svc.getDetailsWithItemsByQuotationGuid(id),
    create: (payload) => svc.createQuotation(payload),
    update: (payload) => svc.updateQuotation(payload),
    subscribe: (cb) => QuotationService.subscribe(cb)
  };
};

export default function QuotationForm({ serviceFactory = defaultServiceFactory, landingRoute = '/purchase/quotationlanding', title = 'Quotation Form', saveType = null, convertRoute = '/purchase/orderform' }) {
  const searchParams = useSearchParams();
  const viewId = searchParams ? searchParams.get('id') : null;
  const isView = !!viewId;
  const router = useRouter();
  // Grouped state hooks
  const [quotationType, setQuotationType] = useState("inventory");
  const [productItems, setProductItems] = useState(initialProductItems);
  const [serviceItems, setServiceItems] = useState(initialServiceItems);
  const [productCatalog, setProductCatalog] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    SupplierGuid: "",
    QuotationNumber: "",
    Address: "",
    ContactNum: "",
    ContactName: "",
    Date: "",
    ValidUntil: "",
    Description: "",
    PurchaseType: "inventory", // "inventory" or "service"
    PreparedBy: "",
    ApprovedBy: "",
    Guid: '',
    Status: ''
  });

  // Editable when not viewing, or when viewing and the quotation is in Draft status
  const isEditable = !isView || (String(form.Status || '').trim().toUpperCase() === 'DRAFT');

  const [blankServiceRow, setBlankServiceRow] = useState(initialBlankServiceRow);

  // Control whether the blank-row select controls are visible (hidden behind a button initially)
  const [showBlankProductSelector, setShowBlankProductSelector] = useState(false);
  const [showBlankServiceSelector, setShowBlankServiceSelector] = useState(false);

  const [blankRowData, setBlankRowData] = useState({
    ProductGuid: '',
    Description: '',
    UnitPrice: 0,
    Quantity: 1,
    TotalPrice: 0,
    Discount: 0
  });

  // Inline editing state for existing rows
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedRow, setEditedRow] = useState(null);

  // Load catalogs on mount
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const inv = await inventoryService.getAllInventories();
        const mappedProducts = inv.map(item => ({
          ProductGuid: item.Guid || item.ProductCode,
          Description: item.Name || item.Description || item.ProductCode,
          UnitPrice: item.UnitPrice || 0
        }));
        const sv = await serviceService.getAllServices();
        const mappedServices = sv.map(s => ({
          ServiceGuid: s.Guid || s.ServiceCode,
          Description: s.Name || s.Description || s.ServiceCode,
          Price: s.Price || s.Amount || 0
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
    // If creating a new quotation (not view), initialize Date and ValidUntil to sensible defaults
    if (mounted && !isView) {
      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const d = new Date(today);
        d.setMonth(d.getMonth() + 1);
        const validStr = d.toISOString().slice(0, 10);
        setForm((prev) => ({ ...prev, Date: prev.Date || todayStr, ValidUntil: prev.ValidUntil || validStr }));
      } catch (e) {
        // ignore
      }
    }
    return () => { mounted = false; };
  }, [isView]);

  // When mounted, if an ?id= query param exists, load quotation and its details
  useEffect(() => {
    let mounted = true;
    const id = searchParams ? searchParams.get('id') : null;
    if (!id) return;

    const loadQuotation = async () => {
      const service = serviceFactory();
      try {
        const q = await service.getById(id);
        if (!mounted || !q) return;

        // Map quotation fields into form
        setForm((prev) => ({
          ...prev,
          SupplierGuid: q.SupplierGuid || prev.SupplierGuid,
          QuotationNumber: q.QuotationNumber || prev.QuotationNumber,
          Address: prev.Address,
          ContactNum: q.SupplierContactNumber || prev.ContactNum,
          ContactName: q.SupplierContactPerson || prev.ContactName,
          Date: q.Date || prev.Date,
          ValidUntil: q.ValidUntil || prev.ValidUntil,
          Description: q.Description || prev.Description,
          // accept either PurchaseType or SalesType from the record so the form can be reused
          PurchaseType: (q.PurchaseType || q.SalesType) ? (q.PurchaseType || q.SalesType).toLowerCase() : prev.PurchaseType,
          PreparedBy: q.PreparedBy || prev.PreparedBy,
          ApprovedBy: q.ApprovedBy || prev.ApprovedBy,
          Guid: q.Guid || prev.Guid,
          Status: q.Status || prev.Status,
        }));

        // Try to resolve supplier details (address/contact) from cached suppliers or service
        try {
          const supplierGuid = q.SupplierGuid;
          let resolvedSupplier = suppliers.find(s => s.CompanyGuid === supplierGuid);
          if (!resolvedSupplier) {
            // attempt to fetch single supplier if not in cache
            resolvedSupplier = supplierGuid ? await supplierService.getSupplierById(supplierGuid) : null;
          }
          if (mounted && resolvedSupplier) {
            setForm((prev) => ({
              ...prev,
              Address: resolvedSupplier.Address || prev.Address,
              ContactNum: resolvedSupplier.ContactNumber || resolvedSupplier.Phone || prev.ContactNum,
              ContactName: resolvedSupplier.ContactPerson || resolvedSupplier.ContactPerson || prev.ContactName,
            }));
          } else {
            // fallback to supplier fields embedded in the quotation record
            setForm((prev) => ({
              ...prev,
              Address: prev.Address,
              ContactNum: q.SupplierContactNumber || prev.ContactNum,
              ContactName: q.SupplierContactPerson || prev.ContactName,
            }));
          }
        } catch (e) {
          // ignore supplier resolution errors and keep existing values
        }

        // Load details with resolved Item records
  const details = await service.getDetailsWithItemsByQuotationGuid(id);
        if (!mounted) return;

  // Map details into productItems or serviceItems depending on PurchaseType (or SalesType for sales records)
  const purchaseType = (q.PurchaseType || q.SalesType || '').toLowerCase();
        if (purchaseType === 'inventory') {
          const mapped = details.map((d) => ({
            id: d.Guid,
            ProductGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            UnitPrice: d.UnitPrice || 0,
            Quantity: d.Quantity || 1,
            TotalPrice: d.TotalPrice || 0,
            Discount: d.Discount || 0,
          }));
          setProductItems(mapped);
          setQuotationType('inventory');
          } else if (purchaseType === 'service') {
          const mapped = details.map((d) => ({
            id: d.Guid,
            ServiceGuid: d.Item ? d.Item.Guid : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            Price: d.UnitPrice || d.TotalPrice || 0,
          }));
          setServiceItems(mapped);
          setQuotationType('service');
        }
      } catch (err) {
        console.error('Failed to load quotation', err);
      }
    };

    loadQuotation();
    // subscribe to service updates so the opened quotation can reflect status changes
    const unsubscribe = serviceFactory().subscribe((all) => {
      if (!mounted) return;
      const found = (all || []).find((q) => q.Guid === id || q.QuotationNumber === id);
      if (found) {
        setForm((prev) => ({ ...prev, Status: found.Status || prev.Status, ApprovedBy: found.ApprovedBy || prev.ApprovedBy }));
      }
    });
    return () => { mounted = false; try { unsubscribe && unsubscribe(); } catch (e) {} };
  }, [searchParams, suppliers, serviceFactory]);

  // Handlers and helpers
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special handling for Date: auto-set ValidUntil to one month later
    if (name === 'Date') {
      const prevDate = form.Date;
      const prevValid = form.ValidUntil;
      let newValid = prevValid;
      try {
        const shouldAuto = !prevValid || prevValid === prevDate;
        if (shouldAuto && value) {
          const base = new Date(value);
          const d = new Date(base);
          d.setMonth(d.getMonth() + 1);
          newValid = d.toISOString().slice(0, 10);
        }
      } catch (err) {
        // ignore
      }
      setForm({ ...form, Date: value, ValidUntil: newValid });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSupplierChange = (e) => {
    const selectedGuid = e.target.value;
    const selectedSupplier = suppliers.find(s => s.CompanyGuid === selectedGuid);
    setForm(form => ({
      ...form,
      SupplierGuid: selectedGuid,
      ContactNum: selectedSupplier ? selectedSupplier.ContactNumber : '',
      ContactName: selectedSupplier ? selectedSupplier.ContactPerson : '',
      Address: selectedSupplier ? selectedSupplier.Address : ''
    }));
  };

  const handleTypeChange = (e) => {
    setQuotationType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
    // Reset the blank selectors when switching types
    setShowBlankProductSelector(false);
    setShowBlankServiceSelector(false);
  };

  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    setBlankServiceRow((prev) => ({
      ...prev,
      [name]: name === 'Price' ? Number(value) : value
    }));
  };

  const handleServiceSelect = (serviceGuidOrEvent) => {
    const serviceGuid = serviceGuidOrEvent && serviceGuidOrEvent.target ? serviceGuidOrEvent.target.value : serviceGuidOrEvent;
    if (!serviceGuid) {
      setBlankServiceRow(initialBlankServiceRow);
      return;
    }
    const selectedService = serviceCatalog.find(s => s.ServiceGuid === serviceGuid);
    if (selectedService) {
      setBlankServiceRow({
        ServiceGuid: selectedService.ServiceGuid,
        Description: selectedService.Description,
        Price: selectedService.Price
      });
    }
  };

  const handleAddBlankServiceRow = () => {
    if (blankServiceRow.Description && blankServiceRow.Price > 0) {
      setServiceItems([...serviceItems, { id: Date.now(), ...blankServiceRow }]);
      setBlankServiceRow(initialBlankServiceRow);
      // hide the selector again for the next blank row
      setShowBlankServiceSelector(false);
    }
  };

  const handleRemoveServiceItem = (itemId) => {
    setServiceItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateTotalPrice = (unitPrice, quantity, discount = 0) => {
    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const handleProductSelect = (productGuidOrEvent) => {
    const productGuid = productGuidOrEvent && productGuidOrEvent.target ? productGuidOrEvent.target.value : productGuidOrEvent;
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

  const handleBlankRowDescriptionChange = (value) => {
    setBlankRowData((prev) => ({ ...prev, Description: value }));
  };

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
        const selected = productCatalog.find(p => p.ProductGuid === value);
        if (selected) {
          next.UnitPrice = selected.UnitPrice || 0;
          // If description was empty or previously matched product, replace it
          next.Description = selected.Description || next.Description;
          const qty = Number(next.Quantity || 1);
          const disc = Number(next.Discount || 0);
          next.TotalPrice = calculateTotalPrice(next.UnitPrice, qty, disc);
        }
      }

      // If service selection changed, pull price and description from service catalog
      if (name === 'ServiceGuid') {
        const selected = serviceCatalog.find(s => s.ServiceGuid === value);
        if (selected) {
          next.Price = selected.Price || 0;
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

      // If price edited for service, ensure numeric
      if (name === 'Price') {
        next.Price = Number(value) || 0;
      }

      return next;
    });
  };

  const handleSaveEdit = () => {
    if (!editedRow) return;
    // Save the entire edited row into the appropriate list(s)
    setProductItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    setServiceItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    setEditingItemId(null);
    setEditedRow(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedRow(null);
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
        ProductGuid: '',
        Description: '',
        UnitPrice: 0,
        Quantity: 1,
        TotalPrice: 0,
        Discount: 0
      });
      // hide the selector again for the next blank row
      setShowBlankProductSelector(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    setProductItems(items => items.filter(item => item.id !== itemId));
  };

  const items = quotationType === "inventory" ? productItems : serviceItems;

  const formatNumber = (value) => Number(value).toFixed(2);

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

  const inventoryColumns = [
    {
      header: 'Product',
      key: 'ProductGuid',
      render: (row) => {
        if (row.isBlank) {
          // show a button first; clicking reveals the product selector
          if (!showBlankProductSelector) {
            return (
              <Button
                variant="transparent"
                size="sm"
                onClick={() => setShowBlankProductSelector(true)}
                icon={<FiPlus />}
                title={isEditable ? 'Add product' : undefined}
                disabled={!isEditable}
              >
                {isEditable ? 'Add Product...' : ''}
              </Button>
            );
          }
          return (
            <Select
              value={row.ProductGuid}
              onChange={(e) => handleProductSelect(e.target.value)}
              disabled={!isEditable}
              options={[{ value: '', label: 'Select Product...' }, ...row.availableProducts.map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))]}
              searchable
              placeholder="Search product..."
            />
          );
        }
        if (editingItemId === row.id) {
          return (
            <Select
              value={editedRow ? editedRow.ProductGuid : row.ProductGuid}
              onChange={(e) => handleEditChange('ProductGuid', e.target.value)}
              options={[{ value: '', label: 'Select Product...' }, ...productCatalog.map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))]}
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
          // don't show the description input until the product selector is revealed or a product is already selected
          if (!showBlankProductSelector && !row.ProductGuid) return '';
          return <Input value={row.Description} onChange={(e) => handleBlankRowDescriptionChange(e.target.value)} placeholder="Description" readOnly={!isEditable} />;
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
          return <Input type="number" value={row.Quantity} onChange={(e) => handleBlankRowQuantityChange(e.target.value)} readOnly={!isEditable} min="1" step="1" />;
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
          return <Input type="number" value={row.Discount} onChange={(e) => handleBlankRowDiscountChange(e.target.value)} readOnly={!isEditable} min="0" max="100" step="0.01" />;
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
            return (
              <Button
                variant="transparent"
                size="sm"
                onClick={() => setShowBlankServiceSelector(true)}
                icon={<FiPlus />}
                title={isEditable ? 'Add service' : undefined}
                disabled={!isEditable}
              >
                {isEditable ? 'Add Service...' : ''}
              </Button>
            );
          }
          return (
            <Select
              value={row.ServiceGuid}
              onChange={(e) => handleServiceSelect(e.target.value)}
              disabled={!isEditable}
              searchable
              placeholder="Search service..."
              options={[{ value: '', label: 'Select Service...' }, ...serviceCatalog.map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))]}
            />
          );
        }
        if (editingItemId === row.id) return <Select value={editedRow ? editedRow.ServiceGuid : row.ServiceGuid} onChange={(e) => handleEditChange('ServiceGuid', e.target.value)} options={[{ value: '', label: 'Select Service...' }, ...serviceCatalog.map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))]} searchable />;
        return row.ServiceGuid;
      }
    },
    {
      header: 'Description',
      key: 'Description',
      render: (row) => {
        if (row.isBlank) {
          if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
          return <Input name="Description" value={row.Description} onChange={handleBlankServiceChange} placeholder="Service Description" readOnly={!isEditable} />;
        }
        if (editingItemId === row.id) return <Input value={editedRow ? editedRow.Description : row.Description} onChange={(e) => handleEditChange('Description', e.target.value)} />;
        return row.Description;
      }
    },
    {
      header: 'Price',
      key: 'Price',
      render: (row) => {
        // For the blank row, don't show the Price input until the service selector or description is visible
        if (row.isBlank) {
          if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
          return <Input name="Price" type="number" value={row.Price} onChange={handleBlankServiceChange} min="0" step="0.01" placeholder="0.00" readOnly={!!row.ServiceGuid || !isEditable} />;
        }
        return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.Price : row.Price} onChange={(e) => handleEditChange('Price', e.target.value)} min="0" step="0.01" /> : <span className={styles.rightAlignNum}>{formatNumber(row.Price)}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => {
        if (!isEditable) return null;
        if (row.isBlank) {
          if (!row.ServiceGuid && !row.Description) return '';
          return <Button variant="transparent" size="sm" onClick={handleAddBlankServiceRow} icon={<FiPlus />} aria-label="Add" disabled={!row.Description || row.Price <= 0} />;
        }
        if (editingItemId === row.id) return (<div style={{ display: 'flex', gap: 8 }}><Button variant="transparent" size="sm" onClick={handleSaveEdit} icon={<FiCheck />} aria-label="Save" /><Button variant="transparent" size="sm" onClick={handleCancelEdit} icon={<FiX />} aria-label="Cancel" /></div>);
        return (<div style={{ display: 'flex', gap: 8 }}>
          <Button variant="transparent" size="sm" onClick={() => handleStartEdit(row)} icon={<FiEdit />} aria-label="Edit" />
          <Button variant="transparent" size="sm" onClick={() => handleRemoveServiceItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" />
        </div>);
      }
    }
  ];

  const columns = quotationType === 'inventory' ? inventoryColumns : serviceColumns;

    // Hide the entire Actions column when the form is not editable
    const visibleColumns = columns.filter((c) => {
      if (!isEditable && String(c.key).toLowerCase() === 'actions') return false;
      return true;
    });

  let tableFooter = null;
  if (quotationType === "inventory") {
    tableFooter = (
      <tr>
        <td colSpan={Math.max(0, visibleColumns.length - 1)} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
        <td style={{ fontWeight: 'bold' , textAlign: 'center' }}>
          {formatNumber(items.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0))}
        </td>
      </tr>
    );
  } else if (quotationType === "service") {
    // Only show total row when there are real service items (ignore the blank add-row)
    if ((items || []).length > 0) {
      tableFooter = (
        <tr>
          <td colSpan={Math.max(0, visibleColumns.length - 1)} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
            {formatNumber(items.reduce((sum, i) => sum + (Number(i.Price) || 0), 0))}
          </td>
        </tr>
      );
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: quotationType === "inventory" ? productItems : serviceItems,
    };
    // optionally map UI PurchaseType into a differently-named backend field (eg. SalesType)
    if (saveType) payload[saveType] = form.PurchaseType;
    const svc = serviceFactory();
    if (isView && form.Guid) {
      svc.update(payload).then((updated) => {
        try {
          router.push(landingRoute);
        } catch (e) {
          console.log('Updated quotation', updated);
        }
      }).catch((err) => {
        console.error('Failed to update quotation', err);
      });
    } else {
      svc.create(payload).then((created) => {
        try {
          router.push(landingRoute);
        } catch (e) {
          console.log('Created quotation', created);
        }
      }).catch((err) => {
        console.error('Failed to create quotation', err);
      });
    }
  };

  // Confirmation modal state for converting quotation to order
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  const handleConvertClick = () => {
    setShowConvertConfirm(true);
  };

  const handleConfirmConvert = () => {
    setShowConvertConfirm(false);
    try {
      router.push(`${convertRoute}?fromQuotation=${encodeURIComponent(form.Guid)}`);
    } catch (e) {
      window.location.href = `${convertRoute}?fromQuotation=${encodeURIComponent(form.Guid)}`;
    }
  };

  const handleCancelConvert = () => {
    setShowConvertConfirm(false);
  };

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <Breadcrumbs showBack items={[{ label: 'Quotation Form' }]} backIcon={<FiFileText size={18}/>} />

      <div className={styles.headerSection}>
        {isView ? (
          <div className={styles.viewHeader}>
            <h2 className={styles.title}>Quotation: {form.Guid}</h2>
            <div className={styles.viewStatus}>
              <StatusBadge status={form.Status} />
            </div>
          </div>
        ) : (
          <h2 className={styles.title}>Quotation Form</h2>
        )}
        <div className={styles.typeSelector}>
          <label htmlFor="PurchaseType" className={styles.typeLabel}>Type:</label>
          <Select
            id="PurchaseType"
            name="PurchaseType"
            value={form.PurchaseType}
            onChange={handleTypeChange}
            disabled={!isEditable}
            title={!isEditable ? 'Quotation locked — only Draft can be edited' : undefined}
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
        <div className={`${styles.gridItem8} ${styles.span3}`}>
          <label htmlFor="SupplierGuid" className={styles.inputLabel}>Supplier</label>
          <Select
            id="SupplierGuid"
            name="SupplierGuid"
            value={form.SupplierGuid}
            onChange={handleSupplierChange}
            disabled={!isEditable}
            searchable
            placeholder="Search supplier..."
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
          <Input label="Quotation Number" placeholder="Quotation Number" id="QuotationNumber" name="QuotationNumber" value={form.QuotationNumber} onChange={handleChange} readOnly={!isEditable} />
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
            readOnly={!isEditable}
          />
        </div>
      </div>

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (isEditable) {
          if (quotationType === "inventory") {
            const blankRow = createBlankProductRow();
            if (blankRow) {
              itemsWithBlank.push(blankRow);
            }
          } else if (quotationType === "service") {
            itemsWithBlank.push({
              id: 'blank',
              ...blankServiceRow,
              isBlank: true
            });
          }
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
              <Input label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} readOnly />
              <Input label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} readOnly />
            </>
          )}
        </div>
        {/* Convert to Order button - visible when a quotation exists (view mode) or when the form has been created */}
        <div className={styles.rightBottomButtons}>
          {form.Guid && (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={handleConvertClick}
                title="Convert this quotation into an order"
              >
                Convert to order
              </Button>
              <ConfirmModal
                open={showConvertConfirm}
                title="Convert quotation to order"
                message={`Are you sure you want to convert quotation ${form.QuotationNumber || form.Guid} into an order?`}
                confirmText="Convert"
                cancelText="Cancel"
                onConfirm={handleConfirmConvert}
                onCancel={handleCancelConvert}
              />
            </>
          )}
          {isEditable && (
            <Button type="submit" variant="save">{isView ? 'Save changes' : 'Create'}</Button>
          )}
        </div>
      </div>
    </form>
  );
}