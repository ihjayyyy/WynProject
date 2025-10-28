'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './DeliveryForm.module.scss';
import Input from '../ui/Input/Input';
import DataTable from '../ui/DataTable/DataTable';
import Button from '../ui/Button/Button';
import { FiFileText, FiPlus, FiTrash2, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import Select from '../ui/Select/Select';

import { InventoryService } from '../../services/inventoryService';
import { ServiceService } from '../../services/serviceService';
import SupplierService from '../../services/supplierService';
import DeliveryService from '../../services/deliveryService';
// Default adapter so existing usage remains unchanged
const defaultServiceFactory = () => {
  const svc = new DeliveryService();
  return {
    getById: (id) => svc.getDeliveryById(id),
    getDetailsWithItemsByDeliveryGuid: (id) => svc.getDetailsWithItemsByDeliveryGuid(id),
    create: (payload) => svc.createDelivery(payload),
    update: (payload) => svc.updateDelivery(payload),
    subscribe: (cb) => DeliveryService.subscribe(cb),
  };
};
import OrderService from '../../services/orderService';
import SalesOrderService from '../../services/salesOrderService';

import Breadcrumbs from '../ui/Breadcrumbs/Breadcrumbs';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

// Supplier service instance
const supplierService = new SupplierService();

// Catalogs will be loaded from services (mocked in-memory services)
// They are mapped to the shape expected by the UI (ProductGuid/ServiceGuid etc.)

// Create service instances (lightweight, in-memory mocks)
const inventoryService = new InventoryService();
const serviceService = new ServiceService();

// State for the blank row for service
const initialBlankServiceRow = {
  ServiceGuid: '',
  Description: '',
  Amount: 0,
  OrderedQuantity: 0,
  DeliveredQuantity: 0,
};
export default function DeliveryForm({ serviceFactory = defaultServiceFactory, landingRoute = '/purchase/deliverylanding' }) {
  // Grouped state hooks
  const [deliveryType, setDeliveryType] = useState('inventory');
  const [productItems, setProductItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
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
    Guid: '',
    Status: ''
  });

  const [blankServiceRow, setBlankServiceRow] = useState(
    initialBlankServiceRow
  );

  // Control whether the blank-row select controls are visible (hidden behind a button initially)
  const [showBlankProductSelector, setShowBlankProductSelector] = useState(false);
  const [showBlankServiceSelector, setShowBlankServiceSelector] = useState(false);

  const [blankRowData, setBlankRowData] = useState({
    ProductGuid: '',
    Description: '',
    UnitPrice: 0,
    Quantity: 1,
    TotalPrice: 0,
    Discount: 0,
    OrderedQuantity: 0,
    DeliveredQuantity: 0,
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

  // Read query param `id` and load the delivery when viewing an existing record.
  const searchParams = useSearchParams();
  const viewId = searchParams ? searchParams.get('id') : null;
  const isView = !!viewId;
  useEffect(() => {
    let mounted = true;
    const id = searchParams ? searchParams.get('id') : null;
    const fromOrder = searchParams ? searchParams.get('fromOrder') : null;

  const loadDelivery = async (deliveryId) => {
      try {
        const svc = serviceFactory();
        const d = await svc.getById(deliveryId);
        if (!d) return;

        // populate top-level form fields
        if (mounted) {
          setForm((prev) => ({
            ...prev,
            SupplierGuid: d.SupplierGuid || '',
            PurchaseDeliveryNumber: d.PurchaseDeliveryNumber || '',
            Date: d.Date || '',
            Description: d.Description || '',
            PurchaseType: d.PurchaseType ? d.PurchaseType.toLowerCase() : 'inventory',
            PreparedBy: d.PreparedBy || '',
            ApprovedBy: d.AcceptedBy || '',
            Guid: d.Guid || d.DeliveryGuid || prev.Guid || '',
            Status: d.Status || d.DeliveryStatus || prev.Status || ''
          }));

          setDeliveryType(d.PurchaseType && d.PurchaseType.toLowerCase() === 'service' ? 'service' : 'inventory');
        
          // populate supplier contact fields (Address, ContactName, ContactNum) from supplier service
          try {
            const sup = await supplierService.getSupplierById(d.SupplierGuid);
            if (mounted && sup) {
              setForm((prev) => ({
                ...prev,
                Address: sup.Address || prev.Address || '',
                ContactNum: sup.ContactNumber || prev.ContactNum || '',
                ContactName: sup.ContactPerson || prev.ContactName || '',
              }));
            }
          } catch (e) {
            // ignore supplier lookup errors
          }
        }

        // load details and map to product/service items used by the UI
  const svc2 = serviceFactory();
  const details = await svc2.getDetailsWithItemsByDeliveryGuid(deliveryId);
        if (!mounted) return;

        if (d.PurchaseType && d.PurchaseType.toLowerCase() === 'service') {
          const svcItems = (details || []).map((dt, idx) => ({
            id: idx + 1,
            ServiceGuid: dt.ItemGuid || dt.Guid || '',
            Description: dt.Description || (dt.Item && (dt.Item.Name || dt.Item.Description)) || '',
            Amount: dt.Item ? (dt.Item.Amount || 0) : (dt.Amount || 0),
            OrderedQuantity: dt.OrderedQuantity || 0,
            DeliveredQuantity: dt.DeliveredQuantity || 0,
          }));
          setServiceItems(svcItems);
        } else {
          const prodItems = (details || []).map((dt, idx) => ({
            id: idx + 1,
            ProductGuid: dt.ItemGuid || dt.Guid || '',
            Description: dt.Description || (dt.Item && (dt.Item.Name || dt.Item.Description)) || '',
            UnitPrice: dt.Item ? (dt.Item.UnitPrice || 0) : 0,
            Quantity: dt.DeliveredQuantity || dt.OrderedQuantity || 0,
            TotalPrice: (dt.Item ? (dt.Item.UnitPrice || 0) : 0) * (dt.DeliveredQuantity || dt.OrderedQuantity || 0),
            Discount: 0,
            OrderedQuantity: dt.OrderedQuantity || 0,
            DeliveredQuantity: dt.DeliveredQuantity || 0,
          }));
          setProductItems(prodItems);
        }
      } catch (err) {
        console.error('Failed to load delivery', err);
      }
    };

  if (fromOrder) {
      (async () => {
          // Prefill delivery from an existing order (try purchase order first, then sales order)
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
            if (mounted && ord) {
            // populate top-level fields from order
            setForm((prev) => ({
              ...prev,
              SupplierGuid: ord.SupplierGuid || '',
              PurchaseDeliveryNumber: prev.PurchaseDeliveryNumber || '',
              Date: ord.Date || prev.Date || '',
              Description: ord.Description || prev.Description || '',
              PurchaseType: ord.PurchaseType ? ord.PurchaseType.toLowerCase() : 'inventory',
              PreparedBy: ord.PreparedBy || prev.PreparedBy || '',
              AcceptedBy: prev.AcceptedBy || '',
              Guid: prev.Guid || '',
              Status: prev.Status || ''
            }));

            setDeliveryType(ord.PurchaseType && ord.PurchaseType.toLowerCase() === 'service' ? 'service' : 'inventory');

            // populate supplier contact fields (Address, ContactName, ContactNum) from supplier service
            try {
              const sup = await supplierService.getSupplierById(ord.SupplierGuid);
              if (mounted && sup) {
                setForm((prev) => ({
                  ...prev,
                  Address: sup.Address || prev.Address || '',
                  ContactNum: sup.ContactNumber || prev.ContactNum || '',
                  ContactName: sup.ContactPerson || prev.ContactName || '',
                  OrderGuid: ord.Guid || prev.OrderGuid || ''
                }));
              } else {
                setForm((prev) => ({ ...prev, OrderGuid: ord.Guid || prev.OrderGuid || '' }));
              }
            } catch (e) {
              setForm((prev) => ({ ...prev, OrderGuid: ord.Guid || prev.OrderGuid || '' }));
            }

            // load order details and map to delivery items
            try {
              const details = usedSales && salesSvc ? await salesSvc.getDetailsWithItemsByOrderGuid(ord.Guid) : await orderSvc.getDetailsWithItemsByOrderGuid(ord.Guid);
              if (!mounted) return;
              const purchaseTypeValue = (ord.PurchaseType || ord.SalesType || '').toLowerCase();
              if (purchaseTypeValue === 'service') {
                const svcItems = (details || []).map((dt, idx) => ({
                  id: idx + 1,
                  ServiceGuid: dt.ItemGuid || dt.Guid || '',
                  Description: dt.Description || (dt.Item && (dt.Item.Name || dt.Item.Description)) || '',
                  Amount: dt.Item ? (dt.Item.Amount || 0) : (dt.UnitPrice || dt.TotalPrice || 0),
                  OrderedQuantity: dt.Quantity || 0,
                  DeliveredQuantity: 0,
                }));
                setServiceItems(svcItems);
              } else {
                const prodItems = (details || []).map((dt, idx) => ({
                  id: idx + 1,
                  ProductGuid: dt.ItemGuid || dt.Guid || '',
                  Description: dt.Description || (dt.Item && (dt.Item.Name || dt.Item.Description)) || '',
                  UnitPrice: dt.Item ? (dt.Item.UnitPrice || 0) : (dt.UnitPrice || 0),
                  Quantity: dt.Quantity || 0,
                  TotalPrice: (dt.Item ? (dt.Item.UnitPrice || 0) : (dt.UnitPrice || 0)) * (dt.Quantity || 0),
                  Discount: dt.Discount || 0,
                  OrderedQuantity: dt.Quantity || 0,
                  DeliveredQuantity: 0,
                }));
                setProductItems(prodItems);
              }
            } catch (e) {
              console.error('Failed to load order details for delivery prefilling', e);
            }
          }
        } catch (err) {
          console.error('Failed to prefill delivery from order', err);
        }
      })();
      // stop here - we filled from order
    } else if (id) {
      loadDelivery(id);
    } else {
      // no id => new blank form
      if (mounted) {
        setForm({
          SupplierGuid: '',
          PurchaseDeliveryNumber: '',
          Address: '',
          ContactNum: '',
          ContactName: '',
          Date: '',
          Description: '',
          PurchaseType: 'inventory',
          PreparedBy: '',
          ApprovedBy: '',
        });
        setProductItems([]);
        setServiceItems([]);
        setDeliveryType('inventory');
      }
    }

    return () => {
      mounted = false;
    };
  }, [searchParams, serviceFactory]);

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
    // Reset the blank selectors when switching types
    setShowBlankProductSelector(false);
    setShowBlankServiceSelector(false);
  };

  const handleBlankServiceChange = (e) => {
    const { name, value } = e.target;
    const numNames = ['Amount', 'OrderedQuantity', 'DeliveredQuantity'];
    setBlankServiceRow((prev) => ({
      ...prev,
      [name]: numNames.includes(name) ? Number(value) : value,
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
        OrderedQuantity: blankServiceRow.OrderedQuantity || 0,
        DeliveredQuantity: blankServiceRow.DeliveredQuantity || 0,
      });
    }
  };

  const handleAddBlankServiceRow = () => {
    // allow adding service rows without requiring Amount (we no longer show Amount in the table)
    if (blankServiceRow.Description) {
      setServiceItems([...serviceItems, { id: Date.now(), ...blankServiceRow }]);
      setBlankServiceRow(initialBlankServiceRow);
      // hide the selector again for the next blank row
      setShowBlankServiceSelector(false);
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
        OrderedQuantity: 0,
        DeliveredQuantity: 0,
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
        OrderedQuantity: blankRowData.OrderedQuantity || 0,
        DeliveredQuantity: blankRowData.DeliveredQuantity || 0,
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

  const handleBlankRowOrderedChange = (newOrdered) => {
    const ordered = Math.max(0, Number(newOrdered) || 0);
    setBlankRowData((prev) => ({ ...prev, OrderedQuantity: ordered }));
  };

  const handleBlankRowDeliveredChange = (newDelivered) => {
    const delivered = Math.max(0, Number(newDelivered) || 0);
    setBlankRowData((prev) => ({ ...prev, DeliveredQuantity: delivered }));
  };

  const handleBlankRowDescriptionChange = (newDesc) => {
    setBlankRowData((prev) => ({ ...prev, Description: newDesc }));
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
      // hide the selector again for the next blank row
      setShowBlankProductSelector(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    setProductItems((items) => items.filter((item) => item.id !== itemId));
  };

  // Inline editing state for existing rows
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedRow, setEditedRow] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const router = useRouter();

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditedRow({ ...item });
  };

  const handleEditChange = (name, value) => {
    // convert numeric fields
    const numericNames = ['OrderedQuantity', 'DeliveredQuantity'];
    setEditedRow((prev) => {
      if (!prev) return prev;
      return { ...prev, [name]: numericNames.includes(name) ? (Number(value) || 0) : value };
    });
  };

  const handleSaveEdit = () => {
    if (!editedRow) return;
    if (deliveryType === 'inventory') {
      setProductItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    } else {
      setServiceItems((prev) => prev.map((it) => (it.id === editedRow.id ? { ...it, ...editedRow } : it)));
    }
    setEditingItemId(null);
    setEditedRow(null);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedRow(null);
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
            header: 'Item GUID',
            key: 'ProductGuid',
            render: (row) => {
              if (row.isBlank) {
                if (!showBlankProductSelector) {
                  return (
                    <Button
                      variant="transparent"
                      size="sm"
                      onClick={() => setShowBlankProductSelector(true)}
                      icon={<FiPlus />}
                    >
                      Add Product...
                    </Button>
                  );
                }
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
              if (editingItemId === row.id) {
                return (
                  <Select
                    value={editedRow ? editedRow.ProductGuid : row.ProductGuid}
                    onChange={(e) => handleEditChange('ProductGuid', e.target.value)}
                    options={[{ value: '', label: 'Select Product...' }, ...(productCatalog || []).map(p => ({ value: p.ProductGuid, label: `${p.ProductGuid} - ${p.Description}` }))]}
                    searchable
                  />
                );
              }
              return row.ProductGuid;
            },
          },
          {
            header: 'Description',
            key: 'Description',
            render: (row) =>
              row.isBlank ? (
                // allow editing description for blank rows
                <Input
                  value={row.Description}
                  onChange={(e) => handleBlankRowDescriptionChange(e.target.value)}
                  placeholder="Description"
                />
              ) : (
                editingItemId === row.id ? (
                  <Input value={editedRow ? editedRow.Description : row.Description} onChange={(e) => handleEditChange('Description', e.target.value)} />
                ) : (
                  row.Description
                )
              ),
          },
          {
            header: 'Ordered Quantity',
            key: 'OrderedQuantity',
            render: (row) =>
              row.isBlank ? (
                !row.ProductGuid ? (
                  ''
                ) : (
                  <Input
                    type="number"
                    value={row.OrderedQuantity}
                    onChange={(e) => handleBlankRowOrderedChange(e.target.value)}
                    min="0"
                    step="1"
                  />
                )
              ) : (
                editingItemId === row.id ? (
                  <Input type="number" value={editedRow ? editedRow.OrderedQuantity : row.OrderedQuantity} onChange={(e) => handleEditChange('OrderedQuantity', e.target.value)} min="0" step="1" />
                ) : (
                  <span className={styles.rightAlignNum}>{row.OrderedQuantity || 0}</span>
                )
              ),
          },
          {
            header: 'Delivered Quantity',
            key: 'DeliveredQuantity',
            render: (row) =>
              row.isBlank ? (
                !row.ProductGuid ? (
                  ''
                ) : (
                  <Input
                    type="number"
                    value={row.DeliveredQuantity}
                    onChange={(e) => handleBlankRowDeliveredChange(e.target.value)}
                    min="0"
                    step="1"
                  />
                )
              ) : (
                editingItemId === row.id ? (
                  <Input type="number" value={editedRow ? editedRow.DeliveredQuantity : row.DeliveredQuantity} onChange={(e) => handleEditChange('DeliveredQuantity', e.target.value)} min="0" step="1" />
                ) : (
                  <span className={styles.rightAlignNum}>{row.DeliveredQuantity || 0}</span>
                )
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
              if (editingItemId === row.id) {
                return (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="transparent" size="sm" onClick={handleSaveEdit} icon={<FiCheck />} aria-label="Save" />
                    <Button variant="danger" size="sm" onClick={handleCancelEdit} icon={<FiX />} aria-label="Cancel" />
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="transparent" size="sm" onClick={() => handleStartEdit(row)} icon={<FiEdit />} aria-label="Edit" />
                  <Button variant="danger" size="sm" onClick={() => handleRemoveItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" />
                </div>
              );
            },
          },
        ]
      : [
          {
            header: 'Item GUID',
            key: 'ServiceGuid',
            render: (row) =>
              row.isBlank ? (
                !showBlankServiceSelector ? (
                  <Button
                    variant="transparent"
                    size="sm"
                    onClick={() => setShowBlankServiceSelector(true)}
                    icon={<FiPlus />}
                  >
                    Add Service...
                  </Button>
                ) : (
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
                )
              ) : (
                editingItemId === row.id ? (
                  <Select
                    value={editedRow ? editedRow.ServiceGuid : row.ServiceGuid}
                    onChange={(e) => handleEditChange('ServiceGuid', e.target.value)}
                    options={[{ value: '', label: 'Select Service...' }, ...(serviceCatalog || []).map(s => ({ value: s.ServiceGuid, label: `${s.ServiceGuid} - ${s.Description}` }))]}
                    searchable
                  />
                ) : (
                  row.ServiceGuid
                )
              ),
          },
          {
            header: 'Description',
            key: 'Description',
            render: (row) => {
              if (row.isBlank) {
                // hide description input until the selector is shown or a service/description exists
                if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
                return (
                  <Input
                    name="Description"
                    value={row.Description}
                    onChange={handleBlankServiceChange}
                    placeholder="Service Description"
                    readOnly={!!row.ServiceGuid}
                  />
                );
              }
              return editingItemId === row.id ? <Input value={editedRow ? editedRow.Description : row.Description} onChange={(e) => handleEditChange('Description', e.target.value)} /> : row.Description;
            },
          },
          {
            header: 'Ordered Quantity',
            key: 'OrderedQuantity',
            render: (row) => {
              if (row.isBlank) {
                if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
                return (
                  <Input
                    name="OrderedQuantity"
                    type="number"
                    value={row.OrderedQuantity}
                    onChange={handleBlankServiceChange}
                    min="0"
                    step="1"
                  />
                );
              }
              return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.OrderedQuantity : row.OrderedQuantity} onChange={(e) => handleEditChange('OrderedQuantity', e.target.value)} min="0" step="1" /> : <span className={styles.rightAlignNum}>{row.OrderedQuantity || 0}</span>;
            },
          },
          {
            header: 'Delivered Quantity',
            key: 'DeliveredQuantity',
            render: (row) => {
              if (row.isBlank) {
                if (!showBlankServiceSelector && !row.ServiceGuid && !row.Description) return '';
                return (
                  <Input
                    name="DeliveredQuantity"
                    type="number"
                    value={row.DeliveredQuantity}
                    onChange={handleBlankServiceChange}
                    min="0"
                    step="1"
                  />
                );
              }
              return editingItemId === row.id ? <Input type="number" value={editedRow ? editedRow.DeliveredQuantity : row.DeliveredQuantity} onChange={(e) => handleEditChange('DeliveredQuantity', e.target.value)} min="0" step="1" /> : <span className={styles.rightAlignNum}>{row.DeliveredQuantity || 0}</span>;
            },
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
              if (editingItemId === row.id) {
                return (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="transparent" size="sm" onClick={handleSaveEdit} icon={<FiCheck />} aria-label="Save" />
                    <Button variant="transparent" size="sm" onClick={handleCancelEdit} icon={<FiX />} aria-label="Cancel" />
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="transparent" size="sm" onClick={() => handleStartEdit(row)} icon={<FiEdit />} aria-label="Edit" />
                  <Button variant="danger" size="sm" onClick={() => handleRemoveServiceItem(row.id)} icon={<FiTrash2 />} aria-label="Remove" />
                </div>
              );
            },
          },
        ];

  let tableFooter = null;
  if (deliveryType === 'inventory') {
    // show totals for ordered and delivered quantities instead of price
    const totalOrdered = items.reduce((sum, i) => sum + (Number(i.OrderedQuantity) || 0), 0);
    const totalDelivered = items.reduce((sum, i) => sum + (Number(i.DeliveredQuantity) || 0), 0);
    tableFooter = (
      <tr>
        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>
          Total
        </td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalOrdered}</td>
        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalDelivered}</td>
        <td />
      </tr>
    );
  } else if (deliveryType === 'service') {
    // Only show total when there are real service items (not just the blank add-row)
    if ((serviceItems || []).length > 0) {
      const totalOrdered = items.reduce((sum, i) => sum + (Number(i.OrderedQuantity) || 0), 0);
      const totalDelivered = items.reduce((sum, i) => sum + (Number(i.DeliveredQuantity) || 0), 0);
      tableFooter = (
        <tr>
          <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>
            Total
          </td>
          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalOrdered}</td>
          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalDelivered}</td>
          <td />
        </tr>
      );
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        const svc = serviceFactory();

        const items = deliveryType === 'inventory' ? productItems : serviceItems;
        const details = (items || []).map((it) => ({
          ItemGuid: it.ProductGuid || it.ServiceGuid || it.ItemGuid || it.Guid || '',
          OrderedQuantity: it.OrderedQuantity !== undefined ? it.OrderedQuantity : (it.Quantity !== undefined ? it.Quantity : 0),
          DeliveredQuantity: it.DeliveredQuantity !== undefined ? it.DeliveredQuantity : (it.DeliveredQuantity !== undefined ? it.DeliveredQuantity : 0),
          Remarks: it.Remarks || '',
          Description: it.Description || '',
        }));

        const payload = {
          ...form,
          details,
          PurchaseType: form.PurchaseType || deliveryType,
        };

        let res;
        if (form && form.Guid) {
          res = await svc.update(payload);
        } else {
          res = await svc.create(payload);
        }

        if (res) {
          try {
            router.push(landingRoute);
          } catch (navErr) {
            window.location.href = landingRoute;
          }
        }
      } catch (err) {
        console.error('Failed to save delivery', err);
        setSaveError(String(err || 'Unknown error'));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <form className={styles.deliveryForm} onSubmit={handleSubmit}>
      <Breadcrumbs
        showBack
        items={[{ label: 'Delivery Form' }]}
        backIcon={<FiFileText size={18} />}
      />

      <div className={styles.headerSection}>
        {isView ? (
          <div className={styles.viewHeader}>
            <h2 className={styles.title}>Delivery: {form.Guid}</h2>
            <div className={styles.viewStatus}>
              <StatusBadge status={form.Status} />
            </div>
          </div>
        ) : (
          <h2 className={styles.title}>Delivery Form</h2>
        )}
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
          {isView && (
            <>
              <Input
                label="Prepared By"
                placeholder="Prepared By"
                id="PreparedBy"
                name="PreparedBy"
                value={form.PreparedBy}
                onChange={handleChange}
                readOnly
              />
              <Input
                label="Approved By"
                placeholder="Approved By"
                id="ApprovedBy"
                name="ApprovedBy"
                value={form.ApprovedBy}
                onChange={handleChange}
                readOnly
              />
            </>
          )}
        </div>
        <Button type="submit" variant="save">
          Save
        </Button>
      </div>
    </form>
  );
}
