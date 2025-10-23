// MOCK DATA for Sales Orders
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

const SALES_ORDERS = [
  {
    Guid: 'SO-001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP001',
    QuotationGuid: 'SQ-2025-0001',
    QuotationNumber: 'SQ-2025-0001',
    SalesOrderNumber: 'SO-2025-0001',
    Date: '2025-10-05',
    Description: 'Sales order for grooming inventory',
    SalesType: 'inventory',
    ValidUntil: '2025-11-05',
    PreparedBy: 'Alice',
    ApprovedBy: '',
    Status: 'draft',
    SupplierSO: 'SUP-SO-001',
    OrderAmount: 3000.0,
  },
];

const SALES_ORDER_DETAILS = [
  {
    Guid: 'SOD-1001',
    OrderGuid: 'SO-001',
    ItemGuid: 'INV1',
    Quantity: 2,
    UnitPrice: 500.0,
    Discount: 0,
    TotalPrice: 1000.0,
    Description: 'Shampoo bottles - 250ml',
  },
];

const _subscribers = new Set();

class SalesOrderService {
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    try {
      cb(SALES_ORDERS.map((q) => ({ ...q })));
    } catch (e) {}
    return () => _subscribers.delete(cb);
  }

  static _notifySubscribers() {
    const snapshot = SALES_ORDERS.map((q) => ({ ...q }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  async createSalesOrder(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `SO-${now}`;
    const newNumber = data.SalesOrderNumber || `SO-${now}`;
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
      QuotationGuid: data.QuotationGuid || '',
      QuotationNumber: data.QuotationNumber || '',
      SalesOrderNumber: newNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      SalesType: data.SalesType || 'inventory',
      ValidUntil: validUntil || '',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      Status: (data.Status || 'draft').toString().toLowerCase(),
      SupplierSO: data.SupplierSO || '',
      OrderAmount: 0,
    };

    SALES_ORDERS.push(newOrder);

    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx) => {
        const detailGuid = it.Guid || `SOD-${Date.now()}-${idx}`;
        const detail = {
          Guid: detailGuid,
          OrderGuid: newGuid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: Number(it.Quantity) || (data.SalesType === 'service' ? 1 : 0) || 1,
          UnitPrice: Number(it.UnitPrice || it.Price) || 0,
          Discount: Number(it.Discount) || 0,
          TotalPrice:
            it.TotalPrice !== undefined
              ? Number(it.TotalPrice)
              : +(Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0) - Number(it.Discount || 0)).toFixed(2),
          Description: it.Description || '',
        };
        SALES_ORDER_DETAILS.push(detail);
      });
    }

    const detailsForOrder = SALES_ORDER_DETAILS.filter((d) => d.OrderGuid === newGuid);
    const computedTotal = detailsForOrder.reduce((acc, d) => acc + Number(d.TotalPrice || 0), 0);
    newOrder.OrderAmount = +computedTotal.toFixed(2);

    SalesOrderService._notifySubscribers();
    return { ...newOrder };
  }

  async updateSalesOrder(data = {}) {
    if (!data) return null;
    const idx = SALES_ORDERS.findIndex((q) => q.Guid === data.Guid || q.SalesOrderNumber === data.SalesOrderNumber);
    if (idx === -1) return null;
    const existing = SALES_ORDERS[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      QuotationGuid: data.QuotationGuid !== undefined ? data.QuotationGuid : existing.QuotationGuid,
      QuotationNumber: data.QuotationNumber !== undefined ? data.QuotationNumber : existing.QuotationNumber,
      SalesOrderNumber: data.SalesOrderNumber !== undefined ? data.SalesOrderNumber : existing.SalesOrderNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      SalesType: data.SalesType !== undefined ? data.SalesType : existing.SalesType,
      ValidUntil: data.ValidUntil !== undefined ? data.ValidUntil : existing.ValidUntil,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
      Status: data.Status !== undefined ? data.Status.toString().toLowerCase() : existing.Status,
      SupplierSO: data.SupplierSO !== undefined ? data.SupplierSO : existing.SupplierSO,
      OrderAmount: data.OrderAmount !== undefined ? data.OrderAmount : existing.OrderAmount,
    };

    SALES_ORDERS[idx] = updated;

    for (let i = SALES_ORDER_DETAILS.length - 1; i >= 0; i--) {
      if (SALES_ORDER_DETAILS[i].OrderGuid === updated.Guid) {
        SALES_ORDER_DETAILS.splice(i, 1);
      }
    }

    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx2) => {
        const detailGuid = it.Guid || `SOD-${Date.now()}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          OrderGuid: updated.Guid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: Number(it.Quantity) || (updated.SalesType === 'service' ? 1 : 0) || 1,
          UnitPrice: Number(it.UnitPrice || it.Price) || 0,
          Discount: Number(it.Discount) || 0,
          TotalPrice:
            it.TotalPrice !== undefined
              ? Number(it.TotalPrice)
              : +(Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0) - Number(it.Discount || 0)).toFixed(2),
          Description: it.Description || '',
        };
        SALES_ORDER_DETAILS.push(detail);
      });
    }

    const updatedDetails = SALES_ORDER_DETAILS.filter((d) => d.OrderGuid === updated.Guid);
    const updatedTotal = updatedDetails.reduce((acc, d) => acc + Number(d.TotalPrice || 0), 0);
    updated.OrderAmount = +updatedTotal.toFixed(2);

    SALES_ORDERS[idx] = updated;

    SalesOrderService._notifySubscribers();
    return { ...updated };
  }

  async setSalesOrderStatus({ Guid, Status, ApprovedBy } = {}) {
    if (!Guid) return null;
    const idx = SALES_ORDERS.findIndex((q) => q.Guid === Guid);
    if (idx === -1) return null;
    const existing = SALES_ORDERS[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (ApprovedBy !== undefined) updated.ApprovedBy = ApprovedBy;
    SALES_ORDERS[idx] = updated;
    SalesOrderService._notifySubscribers();
    return { ...updated };
  }

  async getAllSalesOrders() {
    return SALES_ORDERS.map((item) => ({ ...item }));
  }

  async getSalesOrderById(id) {
    if (!id) return null;
    const found = SALES_ORDERS.find((it) => it.Guid === id || it.SalesOrderNumber === id);
    return found ? { ...found } : null;
  }

  async getAllSalesOrderDetails() {
    return SALES_ORDER_DETAILS.map((d) => this._normalizeDetail(d));
  }

  async getDetailsByOrderGuid(orderGuid) {
    if (!orderGuid) return [];
    const items = SALES_ORDER_DETAILS.filter((d) => d.OrderGuid === orderGuid);
    return items.map((d) => this._normalizeDetail(d));
  }

  async getSalesOrderDetailById(id) {
    if (!id) return null;
    const found = SALES_ORDER_DETAILS.find((d) => d.Guid === id);
    return found ? this._normalizeDetail(found) : null;
  }

  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;
    const order = detail.OrderGuid ? await this.getSalesOrderById(detail.OrderGuid) : null;
    const salesType = order && order.SalesType ? order.SalesType : null;

    if (salesType === 'inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (salesType === 'service') {
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

  async getSalesOrderDetailWithItemById(id) {
    const d = await this.getSalesOrderDetailById(id);
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

export default SalesOrderService;
