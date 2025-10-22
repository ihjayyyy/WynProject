// MOCK DATA for Orders (based on quotationService.js)
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

const ORDERS = [
  {
    Guid: 'ORD-001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP001',
    PurchaseOrderNumber: 'PO-2025-0001',
    QuotationGuid: 'QTN-2025-0001',
    QuotationNumber: 'QTN-2025-0001',
    Date: '2025-10-01',
    Description: 'Bulk order for grooming supplies',
    PurchaseType: 'Inventory',
    ValidUntil: '2025-10-15',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: '',
    Status: 'Draft',
    SupplierContactPerson: 'Jose Ramirez',
    SupplierContactNumber: '+63 917 123 4567',
    SupplierPO: 'SUP-PO-001',
    OrderAmount: 15000.0,
  },
  {
    Guid: 'ORD-002',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP002',
    PurchaseOrderNumber: 'PO-2025-0002',
    QuotationGuid: 'QTN-2025-0002',
    QuotationNumber: 'QTN-2025-0002',
    Date: '2025-10-02',
    Description: 'Massage service order',
    PurchaseType: 'Service',
    ValidUntil: '2025-10-20',
    PreparedBy: 'Carlo Mendoza',
    ApprovedBy: 'Maria Santos',
    Status: 'Approved',
    SupplierContactPerson: 'Ana Cruz',
    SupplierContactNumber: '+63 918 654 3210',
    SupplierPO: 'SUP-PO-002',
    OrderAmount: 5000.0,
  },
  {
    Guid: 'ORD-003',
    CompanyGuid: 'c0mp-0002-eeee-ffff-gggghhhh2222',
    SupplierGuid: 'COMP003',
    PurchaseOrderNumber: 'PO-2025-0003',
    QuotationGuid: 'QTN-2025-0003',
    QuotationNumber: 'QTN-2025-0003',
    Date: '2025-10-03',
    Description: 'Extra service order',
    PurchaseType: 'Service',
    ValidUntil: '2025-11-01',
    PreparedBy: 'Maria Santos',
    ApprovedBy: 'Juan Dela Cruz',
    Status: 'Cancelled',
    SupplierContactPerson: 'Mark Villanueva',
    SupplierContactNumber: '+63 920 888 7777',
    SupplierPO: 'SUP-PO-003',
    OrderAmount: 8000.0,
  },
];

const ORDERDETAILS = [
  {
    Guid: 'OD-1001',
    OrderGuid: 'ORD-001',
    ItemGuid: 'INV1',
    Quantity: 10,
    UnitPrice: 120.0,
    Discount: 0,
    TotalPrice: 1200.0,
    Description: 'Shampoo bottles - 250ml',
  },
  {
    Guid: 'OD-1002',
    OrderGuid: 'ORD-001',
    ItemGuid: 'INV2',
    Quantity: 5,
    UnitPrice: 250.0,
    Discount: 25.0,
    TotalPrice: 1200.0,
    Description: 'Hair clippers',
  },
  {
    Guid: 'OD-2001',
    OrderGuid: 'ORD-002',
    ItemGuid: 'SRV1',
    Quantity: 1,
    UnitPrice: 1500.0,
    Discount: 0,
    TotalPrice: 1500.0,
    Description: 'Full body massage (60min)',
  },
];

const _subscribers = new Set();

class OrderService {
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    try {
      cb(ORDERS.map((q) => ({ ...q })));
    } catch (e) {}
    return () => _subscribers.delete(cb);
  }

  static _notifySubscribers() {
    const snapshot = ORDERS.map((q) => ({ ...q }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  async createOrder(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `ORD-${now}`;
    const newPONumber = data.PurchaseOrderNumber || `PO-${now}`;
    let validUntil = data.ValidUntil;
    try {
      if (!validUntil) {
        const baseDate = data.Date ? new Date(data.Date) : new Date();
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + 1);
        validUntil = d.toISOString().slice(0, 10);
      }
    } catch (e) {
      validUntil = '';
    }

    const newOrder = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      PurchaseOrderNumber: newPONumber,
      QuotationGuid: data.QuotationGuid || '',
      QuotationNumber: data.QuotationNumber || '',
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      PurchaseType: data.PurchaseType || 'Inventory',
      ValidUntil: validUntil || '',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      // normalize status to lower-case values: draft / approved / closed / cancelled
      Status: (data.Status || 'draft').toString().toLowerCase(),
      SupplierContactPerson: data.SupplierContactPerson || '',
      SupplierContactNumber: data.SupplierContactNumber || '',
      SupplierPO: data.SupplierPO || data.SupplierPO || '',
      OrderAmount: 0, // will be computed from details below
    };

    ORDERS.push(newOrder);

    // add provided items (normalize shape to requested detail structure)
    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx) => {
        const detailGuid = it.Guid || `OD-${Date.now()}-${idx}`;
        const detail = {
          Guid: detailGuid,
          OrderGuid: newGuid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: Number(it.Quantity) || 1,
          UnitPrice: Number(it.UnitPrice || it.Price) || 0,
          Discount: Number(it.Discount) || 0,
          TotalPrice:
            it.TotalPrice !== undefined
              ? Number(it.TotalPrice)
              : +(Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0) - Number(it.Discount || 0)).toFixed(2),
          Description: it.Description || '',
        };
        ORDERDETAILS.push(detail);
      });
    }

    // compute OrderAmount from details for this order
    const detailsForOrder = ORDERDETAILS.filter((d) => d.OrderGuid === newGuid);
    const computedTotal = detailsForOrder.reduce((acc, d) => acc + Number(d.TotalPrice || 0), 0);
    newOrder.OrderAmount = +computedTotal.toFixed(2);

    ORDERS.push(newOrder);

    OrderService._notifySubscribers();
    return { ...newOrder };
  }

  async updateOrder(data = {}) {
    if (!data) return null;
    const idx = ORDERS.findIndex((q) => q.Guid === data.Guid || q.PurchaseOrderNumber === data.PurchaseOrderNumber);
    if (idx === -1) return null;
    const existing = ORDERS[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      PurchaseOrderNumber: data.PurchaseOrderNumber !== undefined ? data.PurchaseOrderNumber : existing.PurchaseOrderNumber,
      QuotationGuid: data.QuotationGuid !== undefined ? data.QuotationGuid : existing.QuotationGuid,
      QuotationNumber: data.QuotationNumber !== undefined ? data.QuotationNumber : existing.QuotationNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      PurchaseType: data.PurchaseType !== undefined ? data.PurchaseType : existing.PurchaseType,
      ValidUntil: data.ValidUntil !== undefined ? data.ValidUntil : existing.ValidUntil,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
  Status: data.Status !== undefined ? data.Status.toString().toLowerCase() : existing.Status,
      SupplierContactPerson: data.SupplierContactPerson !== undefined ? data.SupplierContactPerson : existing.SupplierContactPerson,
      SupplierContactNumber: data.SupplierContactNumber !== undefined ? data.SupplierContactNumber : existing.SupplierContactNumber,
      OrderAmount: data.OrderAmount !== undefined ? data.OrderAmount : existing.OrderAmount,
    };

    ORDERS[idx] = updated;

    // remove existing details for this order
    for (let i = ORDERDETAILS.length - 1; i >= 0; i--) {
      if (ORDERDETAILS[i].OrderGuid === updated.Guid) {
        ORDERDETAILS.splice(i, 1);
      }
    }

    // add new details if provided
    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx2) => {
        const detailGuid = it.Guid || `OD-${Date.now()}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          OrderGuid: updated.Guid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: Number(it.Quantity) || 1,
          UnitPrice: Number(it.UnitPrice || it.Price) || 0,
          Discount: Number(it.Discount) || 0,
          TotalPrice:
            it.TotalPrice !== undefined
              ? Number(it.TotalPrice)
              : +(Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0) - Number(it.Discount || 0)).toFixed(2),
          Description: it.Description || '',
        };
        ORDERDETAILS.push(detail);
      });
    }

    // recompute OrderAmount
    const updatedDetails = ORDERDETAILS.filter((d) => d.OrderGuid === updated.Guid);
    const updatedTotal = updatedDetails.reduce((acc, d) => acc + Number(d.TotalPrice || 0), 0);
    updated.OrderAmount = +updatedTotal.toFixed(2);

    ORDERS[idx] = updated;

    OrderService._notifySubscribers();
    return { ...updated };
  }

  async setOrderStatus({ Guid, Status, ApprovedBy } = {}) {
    if (!Guid) return null;
    const idx = ORDERS.findIndex((q) => q.Guid === Guid);
    if (idx === -1) return null;
    const existing = ORDERS[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (ApprovedBy !== undefined) updated.ApprovedBy = ApprovedBy;
    ORDERS[idx] = updated;
    OrderService._notifySubscribers();
    return { ...updated };
  }

  async getAllOrders() {
    return ORDERS.map((item) => ({ ...item }));
  }

  async getOrderById(id) {
    if (!id) return null;
    const found = ORDERS.find((it) => it.Guid === id || it.PurchaseOrderNumber === id);
    return found ? { ...found } : null;
  }

  async getAllOrderDetails() {
    return ORDERDETAILS.map((d) => this._normalizeDetail(d));
  }

  async getDetailsByOrderGuid(orderGuid) {
    if (!orderGuid) return [];
    const items = ORDERDETAILS.filter((d) => d.OrderGuid === orderGuid);
    return items.map((d) => this._normalizeDetail(d));
  }

  async getOrderDetailById(id) {
    if (!id) return null;
    const found = ORDERDETAILS.find((d) => d.Guid === id);
    return found ? this._normalizeDetail(found) : null;
  }

  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;
    const order = detail.OrderGuid ? await this.getOrderById(detail.OrderGuid) : null;
    const purchaseType = order && order.PurchaseType ? order.PurchaseType : null;

    if (purchaseType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (purchaseType === 'Service') {
      const svc = new ServiceService();
      return await svc.getServiceById(itemGuid);
    }

    const invSvc = new InventoryService();
    const maybeInv = await invSvc.getInventoryById(itemGuid);
    if (maybeInv) return maybeInv;
    const svc = new ServiceService();
    return await svc.getServiceById(itemGuid);
  }

  async getDetailsWithItemsByOrderGuid(orderGuid) {
    const details = await this.getDetailsByOrderGuid(orderGuid);
    const results = await Promise.all(
      details.map(async (d) => {
        const normalized = this._normalizeDetail(d);
        const item = await this._resolveItemRecord(normalized);
        return { ...normalized, Item: item };
      })
    );
    return results;
  }

  async getOrderDetailWithItemById(id) {
    const d = await this.getOrderDetailById(id);
    if (!d) return null;
    const item = await this._resolveItemRecord(d);
    return { ...d, Item: item };
  }

  _normalizeDetail(detail) {
    const d = { ...detail };
    d.Quantity = Number(d.Quantity) || 0;
    d.UnitPrice = Number(d.UnitPrice) || 0;
    d.Discount = Number(d.Discount) || 0;
    const total = Number(d.TotalPrice);
    if (!Number.isFinite(total) || total === 0) {
      d.TotalPrice = +(d.Quantity * d.UnitPrice - d.Discount).toFixed(2);
    } else {
      d.TotalPrice = +total.toFixed(2);
    }
    return d;
  }
}

export default OrderService;
