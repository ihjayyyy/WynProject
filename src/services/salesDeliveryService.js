// Mock sales delivery service matching the Sales Delivery data structure
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

// In-memory sales deliveries — provide one sample for each status: Prepared, Partial, Delivered
const SALESDELIVERIES = [
  {
    Guid: 'SD-1001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP001',
    OrderGuid: 'SORD-001',
    SalesDeliveryNumber: 'SD-2025-0001',
    Date: '2025-10-01',
    Description: 'Sales delivery for grooming supplies',
    SalesType: 'Inventory',
    PreparedBy: 'Juan Dela Cruz',
    AcceptedBy: 'Maria Santos',
    Status: 'Prepared',
    SupplierSO: 'SUP-SO-001',
  },
  {
    Guid: 'SD-1002',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP002',
    OrderGuid: 'SORD-002',
    SalesDeliveryNumber: 'SD-2025-0002',
    Date: '2025-10-05',
    Description: 'Partial delivery for pet food',
    SalesType: 'Inventory',
    PreparedBy: 'Ana Lopez',
    AcceptedBy: '',
    Status: 'Partial',
    SupplierSO: 'SUP-SO-002',
  },
  {
    Guid: 'SD-1003',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP003',
    OrderGuid: 'SORD-003',
    SalesDeliveryNumber: 'SD-2025-0003',
    Date: '2025-10-10',
    Description: 'Completed delivery for grooming services',
    SalesType: 'Service',
    PreparedBy: 'Ramon Cruz',
    AcceptedBy: 'Client A',
    Status: 'Delivered',
    SupplierSO: 'SUP-SO-003',
  },
];

// Sales delivery detail lines
const SALESDELIVERYDETAILS = [
  {
    Guid: 'SDD-1001',
    DeliveryGuid: 'SD-1001',
    ItemGuid: 'INV-001',
    OrderedQuantity: 10,
    DeliveredQuantity: 10,
    Remarks: '',
    Description: 'Shampoo bottles - 250ml',
  },
  {
    Guid: 'SDD-1002',
    DeliveryGuid: 'SD-1002',
    ItemGuid: 'INV-010',
    OrderedQuantity: 20,
    DeliveredQuantity: 5,
    Remarks: 'Partial fulfillment',
    Description: 'Premium dog food - 5kg',
  },
  {
    Guid: 'SDD-1003',
    DeliveryGuid: 'SD-1003',
    ItemGuid: 'SRV-001',
    OrderedQuantity: 1,
    DeliveredQuantity: 1,
    Remarks: '',
    Description: 'Full grooming service',
  },
];

const _subscribers = new Set();

class SalesDeliveryService {
  // Subscribe to sales deliveries changes. Returns unsubscribe function.
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    try {
      cb(SALESDELIVERIES.map((d) => ({ ...d })));
    } catch (e) {
      // ignore subscriber errors
    }
    return () => {
      _subscribers.delete(cb);
    };
  }

  static _notifySubscribers() {
    const snapshot = SALESDELIVERIES.map((d) => ({ ...d }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  // Create a sales delivery (mock). Accepts data and optional details array.
  async createSalesDelivery(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `SD-${now}`;
    const newNumber = data.SalesDeliveryNumber || `SD-${now}`;

    const newD = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      OrderGuid: data.OrderGuid || '',
      SalesDeliveryNumber: newNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      SalesType: data.SalesType || 'Inventory',
      PreparedBy: data.PreparedBy || 'Admin',
      AcceptedBy: data.AcceptedBy || '',
      Status: data.Status || 'Prepared',
      SupplierSO: data.SupplierSO || '',
    };

    SALESDELIVERIES.push(newD);

    // details
    if (Array.isArray(data.details) && data.details.length > 0) {
      data.details.forEach((it, idx) => {
        const detailGuid = `SDD-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          DeliveryGuid: newGuid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          OrderedQuantity: it.OrderedQuantity || it.Quantity || 0,
          DeliveredQuantity: it.DeliveredQuantity || 0,
          Remarks: it.Remarks || '',
          Description: it.Description || '',
        };
        SALESDELIVERYDETAILS.push(detail);
      });
    }

    SalesDeliveryService._notifySubscribers();
    return { ...newD };
  }

  // Update a sales delivery by Guid
  async updateSalesDelivery(data = {}) {
    if (!data) return null;
    const key = data.Guid || data.SalesDeliveryNumber;
    if (!key) return null;
    const idx = SALESDELIVERIES.findIndex((d) => d.Guid === data.Guid || d.SalesDeliveryNumber === data.SalesDeliveryNumber);
    if (idx === -1) return null;

    const existing = SALESDELIVERIES[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      OrderGuid: data.OrderGuid !== undefined ? data.OrderGuid : existing.OrderGuid,
      SalesDeliveryNumber: data.SalesDeliveryNumber !== undefined ? data.SalesDeliveryNumber : existing.SalesDeliveryNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      SalesType: data.SalesType !== undefined ? data.SalesType : existing.SalesType,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      AcceptedBy: data.AcceptedBy !== undefined ? data.AcceptedBy : existing.AcceptedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierSO: data.SupplierSO !== undefined ? data.SupplierSO : existing.SupplierSO,
    };

    SALESDELIVERIES[idx] = updated;

    // Replace details for this delivery
    for (let i = SALESDELIVERYDETAILS.length - 1; i >= 0; i--) {
      if (SALESDELIVERYDETAILS[i].DeliveryGuid === updated.Guid) {
        SALESDELIVERYDETAILS.splice(i, 1);
      }
    }
    if (Array.isArray(data.details) && data.details.length > 0) {
      const now = Date.now();
      data.details.forEach((it, idx2) => {
        const detailGuid = `SDD-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          DeliveryGuid: updated.Guid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          OrderedQuantity: it.OrderedQuantity || it.Quantity || 0,
          DeliveredQuantity: it.DeliveredQuantity || 0,
          Remarks: it.Remarks || '',
          Description: it.Description || '',
        };
        SALESDELIVERYDETAILS.push(detail);
      });
    }

    SalesDeliveryService._notifySubscribers();
    return { ...updated };
  }

  // Set only the status (and optionally AcceptedBy) for a sales delivery
  async setSalesDeliveryStatus({ Guid, Status, AcceptedBy } = {}) {
    if (!Guid) return null;
    const idx = SALESDELIVERIES.findIndex((d) => d.Guid === Guid);
    if (idx === -1) return null;
    const existing = SALESDELIVERIES[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (AcceptedBy !== undefined) updated.AcceptedBy = AcceptedBy;
    SALESDELIVERIES[idx] = updated;
    SalesDeliveryService._notifySubscribers();
    return { ...updated };
  }

  // Return all sales deliveries
  async getAllSalesDeliveries() {
    return SALESDELIVERIES.map((d) => ({ ...d }));
  }

  // Get single sales delivery by Guid or SalesDeliveryNumber
  async getSalesDeliveryById(id) {
    if (!id) return null;
    const found = SALESDELIVERIES.find((it) => it.Guid === id || it.SalesDeliveryNumber === id);
    return found ? { ...found } : null;
  }

  // Sales delivery detail helpers
  async getAllSalesDeliveryDetails() {
    return SALESDELIVERYDETAILS.map((d) => ({ ...d }));
  }

  async getDetailsByDeliveryGuid(deliveryGuid) {
    if (!deliveryGuid) return [];
    const items = SALESDELIVERYDETAILS.filter((d) => d.DeliveryGuid === deliveryGuid);
    return items.map((d) => ({ ...d }));
  }

  async getSalesDeliveryDetailById(id) {
    if (!id) return null;
    const found = SALESDELIVERYDETAILS.find((d) => d.Guid === id);
    return found ? { ...found } : null;
  }

  // Resolve referenced item (inventory or service)
  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;

    // Use the parent delivery's SalesType to determine source
    const delivery = detail.DeliveryGuid ? await this.getSalesDeliveryById(detail.DeliveryGuid) : null;
    const salesType = delivery && delivery.SalesType ? delivery.SalesType : null;

    if (salesType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (salesType === 'Service') {
      const svc = new ServiceService();
      return await svc.getServiceById(itemGuid);
    }

    // fallback
    const invSvc = new InventoryService();
    const maybeInv = await invSvc.getInventoryById(itemGuid);
    if (maybeInv) return maybeInv;
    const svc = new ServiceService();
    return await svc.getServiceById(itemGuid);
  }

  async getDetailsWithItemsByDeliveryGuid(deliveryGuid) {
    const details = await this.getDetailsByDeliveryGuid(deliveryGuid);
    const results = await Promise.all(
      details.map(async (d) => {
        const normalized = { ...d };
        const item = await this._resolveItemRecord(normalized);
        return { ...normalized, Item: item };
      })
    );
    return results;
  }
}

export default SalesDeliveryService;
