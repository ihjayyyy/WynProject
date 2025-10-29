"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import styles from "./InvoiceForm.module.scss";
import Input from "../ui/Input/Input";
import DataTable from "../ui/DataTable/DataTable";
import Button from "../ui/Button/Button";
import { FiFile, FiPlus, FiTrash2 } from "react-icons/fi";
import Select from "../ui/Select/Select";
import Breadcrumbs from "../ui/Breadcrumbs/Breadcrumbs";
import StatusBadge from "../ui/StatusBadge/StatusBadge";

// Use service modules (these are lightweight mock services under src/services)
import { InventoryService } from "../../services/inventoryService";
import { ServiceService } from "../../services/serviceService";
import SupplierService from "../../services/supplierService";
import PurchaseInvoiceService from "../../services/purchaseInvoiceService";
import OrderService from '../../services/orderService';
import SalesOrderService from '../../services/salesOrderService';

const supplierService = new SupplierService();
const inventoryService = new InventoryService();
const serviceService = new ServiceService();
// purchaseInvoiceService is created via defaultServiceFactory below for flexibility

// Default service factory mapping to the existing PurchaseInvoiceService implementation
const defaultServiceFactory = () => {
  const svc = new PurchaseInvoiceService();
  return {
    getById: (id) => svc.getInvoiceById(id),
    getDetailsWithItemsByInvoiceGuid: (id) => svc.getDetailsWithItemsByInvoiceGuid(id),
    create: (payload) => svc.createInvoice(payload),
    update: (payload) => svc.updateInvoice(payload),
    subscribe: (cb) => PurchaseInvoiceService.subscribe(cb),
  };
};

const initialProductItems = [];
const initialServiceItems = [];
const initialBlankServiceRow = { ServiceGuid: '', Description: '', Amount: 0 };

export default function InvoiceForm({ serviceFactory = null, landingRoute = '/purchase/invoicelanding', title = 'Invoice Form', saveType = 'PurchaseType', numberKey = 'PurchaseInvoiceNumber', orderKey = 'PurchaseOrderNumber' }) {
  const searchParams = useSearchParams();
  const viewId = searchParams ? searchParams.get('id') : null;
  const isView = !!viewId;
  const router = useRouter();
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
  Status: "draft",
    SupplierPO: "",
    DueDate: "",
    InvoiceAmount: 0,
  });

  // Determine if the form is editable: only editable when status is 'draft'
  const isEditable = (form.Status || '').toLowerCase() === 'draft';

  // runtime catalogs and suppliers loaded from services
  const [productCatalog, setProductCatalog] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Load catalogs/suppliers on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const inv = await inventoryService.getAllInventories();
        const mappedProducts = (inv || []).map(item => ({
          ProductGuid: item.Guid || item.ProductCode,
          Description: item.Name || item.Description || item.ProductCode,
          UnitPrice: item.UnitPrice || 0
        }));

        const sv = await serviceService.getAllServices();
        const mappedServices = (sv || []).map(s => ({
          ServiceGuid: s.Guid || s.ServiceCode,
          Description: s.Name || s.Description || s.ServiceCode,
          Amount: s.Price || s.Amount || 0
        }));

        const s = await supplierService.getAllSuppliers();

        if (!mounted) return;
        setProductCatalog(mappedProducts);
        setServiceCatalog(mappedServices);
        setSuppliers(s || []);
      } catch (err) {
        console.error('Failed to load catalogs/suppliers', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const svcFactory = React.useMemo(() => (serviceFactory || defaultServiceFactory), [serviceFactory]);

  // If navigated from an order (e.g. /purchase/invoiceform?fromOrder=ORD-001), prefill invoice from that order
  const fromOrder = searchParams ? searchParams.get('fromOrder') : null;
  useEffect(() => {
    if (!fromOrder) return;
    let mounted = true;
    (async () => {
      try {
        const orderSvc = new OrderService();
        let ord = await orderSvc.getOrderById(fromOrder);
        let usedSales = false;
        let salesSvc = null;
        if (!ord) {
          salesSvc = new SalesOrderService();
          ord = await salesSvc.getSalesOrderById(fromOrder);
          if (ord) usedSales = true;
        }
        if (!mounted || !ord) return;

        // populate top-level invoice fields from order
        setForm((prev) => ({
          ...prev,
          SupplierGuid: ord.SupplierGuid || prev.SupplierGuid,
          OrderGuid: ord.Guid || prev.OrderGuid,
          PurchaseOrderNumber: ord.PurchaseOrderNumber || prev.PurchaseOrderNumber,
          Date: ord.Date || prev.Date,
          Description: ord.Description || prev.Description,
          PurchaseType: ord.PurchaseType ? ord.PurchaseType.toLowerCase() : prev.PurchaseType,
          PreparedBy: ord.PreparedBy || prev.PreparedBy,
          ApprovedBy: ord.ApprovedBy || prev.ApprovedBy,
        }));

        // try to resolve supplier address/contact
        try {
          const sup = await supplierService.getSupplierById(ord.SupplierGuid);
          if (mounted && sup) {
            setForm((prev) => ({ ...prev, CompanyGuid: sup.CompanyGuid || prev.CompanyGuid }));
          }
        } catch (e) {
          // ignore
        }

        // load order details and map to invoice items
        try {
          const details = usedSales && salesSvc ? await salesSvc.getDetailsWithItemsByOrderGuid(ord.Guid) : await orderSvc.getDetailsWithItemsByOrderGuid(ord.Guid);
          const purchaseType = (ord.PurchaseType || ord.SalesType || '').toLowerCase();
          if (purchaseType === 'inventory') {
            const mapped = (details || []).map((d, idx) => ({
              id: Date.now() + idx,
              ProductGuid: d.Item ? d.Item.Guid : d.ItemGuid,
              Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
              UnitPrice: d.UnitPrice || 0,
              Quantity: d.Quantity || 1,
              TotalPrice: d.TotalPrice || 0,
              Discount: d.Discount || 0,
            }));
            setProductItems(mapped);
            setInvoiceType('inventory');
          } else {
            const mapped = (details || []).map((d, idx) => ({
              id: Date.now() + idx,
              ServiceGuid: d.Item ? d.Item.Guid : d.ItemGuid,
              Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
              Amount: d.UnitPrice || d.TotalPrice || 0,
            }));
            setServiceItems(mapped);
            setInvoiceType('service');
          }
        } catch (e) {
          console.error('Failed to load order details for invoice prefilling', e);
        }
      } catch (err) {
        console.error('Failed to prefill invoice from order', err);
      }
    })();
    return () => { mounted = false; };
  }, [fromOrder]);

  // If viewing an existing invoice (via ?id=...), load it and its details
  useEffect(() => {
    if (!isView) return;
    let mounted = true;

    const loadInvoice = async () => {
      try {
  const invoice = await svcFactory().getById(viewId);
        if (!mounted || !invoice) return;

        // Map invoice fields into form
        setForm((prev) => ({
          ...prev,
          Guid: invoice.Guid || prev.Guid,
          CompanyGuid: invoice.CompanyGuid || prev.CompanyGuid,
          SupplierGuid: invoice.SupplierGuid || prev.SupplierGuid,
          DeliveryGuid: invoice.DeliveryGuid || prev.DeliveryGuid,
          OrderGuid: invoice.OrderGuid || prev.OrderGuid,
          PurchaseOrderNumber: invoice.PurchaseOrderNumber || invoice.SalesOrderNumber || prev.PurchaseOrderNumber,
          PurchaseInvoiceNumber: invoice.PurchaseInvoiceNumber || invoice.SalesInvoiceNumber || prev.PurchaseInvoiceNumber,
          Date: invoice.Date || prev.Date,
          Description: invoice.Description || prev.Description,
          PurchaseType: invoice.PurchaseType ? invoice.PurchaseType.toLowerCase() : prev.PurchaseType,
          PreparedBy: invoice.PreparedBy || prev.PreparedBy,
          ApprovedBy: invoice.ApprovedBy || prev.ApprovedBy,
          Status: invoice.Status || prev.Status,
          SupplierPO: invoice.SupplierPO || prev.SupplierPO,
          DueDate: invoice.DueDate || prev.DueDate,
          InvoiceAmount: invoice.InvoiceAmount || prev.InvoiceAmount,
        }));

        // Resolve supplier details if not already loaded
        try {
          let resolvedSupplier = suppliers.find(s => s.CompanyGuid === invoice.SupplierGuid);
          if (!resolvedSupplier) {
            resolvedSupplier = invoice.SupplierGuid ? await supplierService.getSupplierById(invoice.SupplierGuid) : null;
          }
          if (mounted && resolvedSupplier) {
            setForm((prev) => ({
              ...prev,
              CompanyGuid: resolvedSupplier.CompanyGuid || prev.CompanyGuid,
            }));
          }
        } catch (e) {
          // ignore supplier resolution errors
        }

        // Load details and map into items
  const details = await svcFactory().getDetailsWithItemsByInvoiceGuid(viewId);
        if (!mounted) return;

  const purchaseType = (invoice.PurchaseType || invoice.SalesType) ? (invoice.PurchaseType || invoice.SalesType).toLowerCase() : '';
        if (purchaseType === 'inventory') {
          const mapped = (details || []).map((d) => ({
            id: d.Guid,
            ProductGuid: d.Item ? (d.Item.Guid || d.Item.ProductCode) : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            UnitPrice: d.UnitPrice || 0,
            Quantity: d.Quantity || 1,
            TotalPrice: d.TotalPrice || 0,
            Discount: d.Discount || 0,
          }));
          setProductItems(mapped);
          setInvoiceType('inventory');
        } else if (purchaseType === 'service') {
          const mapped = (details || []).map((d) => ({
            id: d.Guid,
            ServiceGuid: d.Item ? (d.Item.Guid || d.Item.ServiceCode) : d.ItemGuid,
            Description: d.Description || (d.Item && (d.Item.Name || d.Item.Description)),
            Amount: d.UnitPrice || d.TotalPrice || 0,
          }));
          setServiceItems(mapped);
          setInvoiceType('service');
        }
      } catch (err) {
        console.error('Failed to load invoice', err);
      }
    };

    loadInvoice();

    // subscribe to invoice updates to reflect status changes
    const unsubscribe = svcFactory().subscribe((all) => {
      if (!mounted) return;
      const found = (all || []).find((d) => d.Guid === viewId || d.PurchaseInvoiceNumber === viewId || d.SalesInvoiceNumber === viewId);
      if (found) setForm((prev) => ({ ...prev, Status: found.Status || prev.Status, ApprovedBy: found.ApprovedBy || prev.ApprovedBy }));
    });

    return () => { mounted = false; try { unsubscribe && unsubscribe(); } catch (e) {} };
  }, [isView, viewId, suppliers, svcFactory]);

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
      CompanyGuid: selectedSupplier ? selectedSupplier.CompanyGuid : '',
    }));
  };

  const handleTypeChange = (e) => {
    setInvoiceType(e.target.value);
    setForm({ ...form, PurchaseType: e.target.value });
    // Reset the blank selectors when switching types
    setShowBlankProductSelector(false);
    setShowBlankServiceSelector(false);
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
      // hide the selector again for the next blank row
      setShowBlankServiceSelector(false);
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
      // hide the selector again for the next blank row
      setShowBlankProductSelector(false);
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
        { header: 'Product', key: 'ProductGuid', render: (row) => {
            if (row.isBlank) {
              if (!showBlankProductSelector) {
                return (
                  <Button variant="transparent" size="sm" onClick={() => setShowBlankProductSelector(true)} icon={<FiPlus />} disabled={!isEditable}>Add Product...</Button>
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
            return row.ProductGuid;
          } },
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
              <Button variant="primary" size="sm" onClick={handleAddBlankRowItem} icon={<FiPlus />} aria-label="Add" disabled={!isEditable} />
            ) : ''
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleRemoveItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" disabled={!isEditable} />
          ) },
      ]
    : [
        { header: 'Service', key: 'ServiceGuid', render: (row) => {
            if (row.isBlank) {
              if (!showBlankServiceSelector) {
                return (
                  <Button variant="transparent" size="sm" onClick={() => setShowBlankServiceSelector(true)} icon={<FiPlus />} disabled={!isEditable}>Add Service...</Button>
                );
              }
              return (
                <Select
                  value={row.ServiceGuid}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  options={[
                    { value: '', label: 'Select Service...' },
                    ...serviceCatalog.map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))
                  ]}
                />
              );
            }
            return row.ServiceGuid;
          } },
        { header: 'Description', key: 'Description', render: (row) => {
            if (row.isBlank) {
              // hide description input until the selector is shown or a service/description exists
              if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
              return (
                <Input name="Description" value={row.Description} onChange={handleBlankServiceChange} placeholder="Service Description" readOnly={!!row.ServiceGuid} />
              );
            }
            return row.Description;
          } },
        { header: 'Amount', key: 'Amount', render: (row) => {
            // For the blank row, don't show the Amount input until the selector or description is visible
            if (row.isBlank) {
              if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
              return (
                <Input name="Amount" type="number" value={row.Amount} onChange={handleBlankServiceChange} min="0" step="0.01" placeholder="0.00" readOnly={!!row.ServiceGuid} />
              );
            }
            return <span className={styles.rightAlignNum}>{formatNumber(row.Amount)}</span>;
          } },
        { header: 'Actions', key: 'actions', render: (row) => row.isBlank ? (
            (!row.ServiceGuid && !row.Description) ? '' : (
              <Button variant="primary" size="sm" onClick={handleAddBlankServiceRow} icon={<FiPlus />} aria-label="Add" disabled={!isEditable || !row.Description || row.Amount <= 0} />
            )
          ) : (
            <Button variant="danger" size="sm" onClick={() => handleRemoveServiceItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" disabled={!isEditable} />
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
    // Only show total when there are real service items (not just the blank add-row)
    if ((serviceItems || []).length > 0) {
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
  }

  // Save handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const InvoiceAmount = invoiceType === "inventory"
      ? productItems.reduce((sum, i) => sum + (Number(i.TotalPrice) || 0), 0)
      : serviceItems.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);

    // Map UI items into invoice details accepted by PurchaseInvoiceService
    const details = (invoiceType === 'inventory' ? productItems : serviceItems).map((it) => {
      if (invoiceType === 'inventory') {
        return {
          ItemGuid: it.ProductGuid,
          Quantity: it.Quantity || 1,
          UnitPrice: it.UnitPrice || 0,
          TotalPrice: it.TotalPrice || 0,
          Discount: it.Discount || 0,
          Description: it.Description || ''
        };
      }
      // service
      return {
        ItemGuid: it.ServiceGuid,
        Quantity: it.Quantity || 1,
        UnitPrice: it.Amount || it.Price || 0,
        TotalPrice: it.Amount || it.Price || 0,
        Discount: 0,
        Description: it.Description || ''
      };
    });

    const payload = {
      ...form,
      PurchaseType: invoiceType === 'inventory' ? 'Inventory' : 'Service',
      InvoiceAmount,
      details
    };

    purchaseInvoiceService.createInvoice(payload).then((created) => {
      console.log('Created invoice', created);
      // you may want to reset the form or navigate after creation
    }).catch((err) => {
      console.error('Failed to create invoice', err);
    });
  };

  return (
    <form className={styles.quotationForm} onSubmit={handleSubmit}>
      <Breadcrumbs showBack items={[{ label: 'Invoice Form' }]} backIcon={<FiFile size={18}/>} />
      
      <div className={styles.headerSection}>
        {isView ? (
          <div className={styles.viewHeader}>
            <h2 className={styles.title}>Invoice: {form.Guid}</h2>
            <div className={styles.viewStatus}>
              <StatusBadge status={form.Status} />
            </div>
          </div>
        ) : (
          <h2 className={styles.title}>Invoice Form</h2>
        )}
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
            disabled={!isEditable}
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
              ...suppliers.map(s => ({
                value: s.CompanyGuid,
                label: `${s.CompanyCode} - ${s.Name}`
              }))
            ]}
            disabled={!isEditable}
          />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Company" placeholder="Company" id="CompanyGuid" name="CompanyGuid" value={form.CompanyGuid} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Delivery" placeholder="Delivery" id="DeliveryGuid" name="DeliveryGuid" value={form.DeliveryGuid} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Date" id="Date" name="Date" value={form.Date} onChange={handleChange} type="date" readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Order" placeholder="Order" id="OrderGuid" name="OrderGuid" value={form.OrderGuid} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2}`}>
          <Input label="Supplier PO" placeholder="Supplier PO" id="SupplierPO" name="SupplierPO" value={form.SupplierPO} onChange={handleChange} readOnly={!isEditable} />
        </div>
        {/* Status is not editable and should not be an input per requirement */}
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Due Date" id="DueDate" name="DueDate" value={form.DueDate} onChange={handleChange} type="date" readOnly={!isEditable} />
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
          <Input label="Purchase Order Number" placeholder="PO Number" id="PurchaseOrderNumber" name="PurchaseOrderNumber" value={form.PurchaseOrderNumber} onChange={handleChange} readOnly={!isEditable} />
        </div>
        <div className={`${styles.gridItem8} ${styles.span2} ${styles.rightAlign}`}>
          <Input label="Purchase Invoice Number" placeholder="Invoice Number" id="PurchaseInvoiceNumber" name="PurchaseInvoiceNumber" value={form.PurchaseInvoiceNumber} onChange={handleChange} readOnly={!isEditable} />
        </div>
      </div>

      {/* Add blank row to items if needed */}
      {(() => {
        let itemsWithBlank = [...items];
        if (invoiceType === "inventory") {
          const blankRow = createBlankProductRow();
          if (blankRow && isEditable) {
            itemsWithBlank.push(blankRow);
          }
        } else if (invoiceType === "service") {
          if (isEditable) itemsWithBlank.push({ id: 'blank', ...blankServiceRow, isBlank: true });
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
          {isView && (
            <>
              <Input label="Prepared By" placeholder="Prepared By" id="PreparedBy" name="PreparedBy" value={form.PreparedBy} onChange={handleChange} readOnly />
              <Input label="Approved By" placeholder="Approved By" id="ApprovedBy" name="ApprovedBy" value={form.ApprovedBy} onChange={handleChange} readOnly />
            </>
          )}
        </div>
        <Button type="submit" variant="save" disabled={!isEditable}>Save</Button>
      </div>
    </form>
  );
}
