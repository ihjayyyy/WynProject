// Mock delivery service matching the Purchase Delivery data structure
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

// In-memory deliveries
const DELIVERIES = [
  {
    Guid: 'DEL-1001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    // use existing supplier CompanyGuid from supplierService mock so DeliveryForm can resolve supplier
    SupplierGuid: 'COMP001',
    OrderGuid: 'ORD-001',
    PurchaseDeliveryNumber: 'DEL-2025-0001',
    Date: '2025-10-01',
    Description: 'Bulk delivery for grooming supplies',
    PurchaseType: 'Inventory',
    PreparedBy: 'Juan Dela Cruz',
    AcceptedBy: 'Maria Santos',
    Status: 'Prepared',
    SupplierPO: 'SUP-PO-001',
  },
  {
    Guid: 'DEL-1002',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP002',
    OrderGuid: 'ORD-002',
    PurchaseDeliveryNumber: 'DEL-2025-0002',
    Date: '2025-10-02',
    Description: 'Massage service delivery',
    PurchaseType: 'Service',
    PreparedBy: 'Carlo Mendoza',
    AcceptedBy: 'Andrea Lopez',
    Status: 'Partial',
    SupplierPO: 'SUP-PO-002',
  },
  {
    Guid: 'DEL-1003',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP003',
    OrderGuid: 'ORD-003',
    PurchaseDeliveryNumber: 'DEL-2025-0003',
    Date: '2025-10-03',
    Description: 'Completed delivery of pet accessories',
    PurchaseType: 'Inventory',
    PreparedBy: 'Luz Ramos',
    AcceptedBy: 'Supplier B',
    Status: 'Delivered',
    SupplierPO: 'SUP-PO-003',
  },
];

// Delivery detail lines
const DELIVERYDETAILS = [
  {
    Guid: 'DD-1001',
    DeliveryGuid: 'DEL-1001',
    ItemGuid: 'INV-001',
    OrderedQuantity: 10,
    DeliveredQuantity: 10,
    Remarks: '',
    Description: 'Shampoo bottles - 250ml',
  },
  {
    Guid: 'DD-1002',
    DeliveryGuid: 'DEL-1002',
    ItemGuid: 'SRV-001',
    OrderedQuantity: 1,
    DeliveredQuantity: 1,
    Remarks: '',
    Description: 'Full body massage (60min)',
  },
  {
    Guid: 'DD-1003',
    DeliveryGuid: 'DEL-1003',
    ItemGuid: 'INV-020',
    OrderedQuantity: 5,
    DeliveredQuantity: 5,
    Remarks: '',
    Description: 'Dog collar - medium',
  },
];

// Simple subscriber list similar to QuotationService
const _subscribers = new Set();

class DeliveryService {
  // Allow components to subscribe to changes in the deliveries list.
  // Returns an unsubscribe function.
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    try {
      cb(DELIVERIES.map((d) => ({ ...d })));
    } catch (e) {
      // ignore subscriber errors
    }
    return () => {
      _subscribers.delete(cb);
    };
  }

  static _notifySubscribers() {
    const snapshot = DELIVERIES.map((d) => ({ ...d }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  // Create a delivery (mock). Accepts data and optional details array.
  async createDelivery(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `DEL-${now}`;
    const newNumber = data.PurchaseDeliveryNumber || `DEL-${now}`;

    const newD = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      OrderGuid: data.OrderGuid || '',
      PurchaseDeliveryNumber: newNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      PurchaseType: data.PurchaseType || 'Inventory',
      PreparedBy: data.PreparedBy || 'Admin',
      AcceptedBy: data.AcceptedBy || '',
      Status: data.Status || 'Prepared',
      SupplierPO: data.SupplierPO || '',
    };

    DELIVERIES.push(newD);

    // details
    if (Array.isArray(data.details) && data.details.length > 0) {
      data.details.forEach((it, idx) => {
        const detailGuid = `DD-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          DeliveryGuid: newGuid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          OrderedQuantity: it.OrderedQuantity || it.Quantity || 0,
          DeliveredQuantity: it.DeliveredQuantity || 0,
          Remarks: it.Remarks || '',
          Description: it.Description || '',
        };
        DELIVERYDETAILS.push(detail);
      });
    }

    DeliveryService._notifySubscribers();
    return { ...newD };
  }

  // Update a delivery by Guid
  async updateDelivery(data = {}) {
    if (!data) return null;
    const key = data.Guid || data.PurchaseDeliveryNumber;
    if (!key) return null;
    const idx = DELIVERIES.findIndex((d) => d.Guid === data.Guid || d.PurchaseDeliveryNumber === data.PurchaseDeliveryNumber);
    if (idx === -1) return null;

    const existing = DELIVERIES[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      OrderGuid: data.OrderGuid !== undefined ? data.OrderGuid : existing.OrderGuid,
      PurchaseDeliveryNumber: data.PurchaseDeliveryNumber !== undefined ? data.PurchaseDeliveryNumber : existing.PurchaseDeliveryNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      PurchaseType: data.PurchaseType !== undefined ? data.PurchaseType : existing.PurchaseType,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      AcceptedBy: data.AcceptedBy !== undefined ? data.AcceptedBy : existing.AcceptedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierPO: data.SupplierPO !== undefined ? data.SupplierPO : existing.SupplierPO,
    };

    DELIVERIES[idx] = updated;

    // Replace details for this delivery
    for (let i = DELIVERYDETAILS.length - 1; i >= 0; i--) {
      if (DELIVERYDETAILS[i].DeliveryGuid === updated.Guid) {
        DELIVERYDETAILS.splice(i, 1);
      }
    }
    if (Array.isArray(data.details) && data.details.length > 0) {
      const now = Date.now();
      data.details.forEach((it, idx2) => {
        const detailGuid = `DD-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          DeliveryGuid: updated.Guid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          OrderedQuantity: it.OrderedQuantity || it.Quantity || 0,
          DeliveredQuantity: it.DeliveredQuantity || 0,
          Remarks: it.Remarks || '',
          Description: it.Description || '',
        };
        DELIVERYDETAILS.push(detail);
      });
    }

    DeliveryService._notifySubscribers();
    return { ...updated };
  }

  // Set only the status (and optionally AcceptedBy) for a delivery
  async setDeliveryStatus({ Guid, Status, AcceptedBy } = {}) {
    if (!Guid) return null;
    const idx = DELIVERIES.findIndex((d) => d.Guid === Guid);
    if (idx === -1) return null;
    const existing = DELIVERIES[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (AcceptedBy !== undefined) updated.AcceptedBy = AcceptedBy;
    DELIVERIES[idx] = updated;
    DeliveryService._notifySubscribers();
    return { ...updated };
  }

  // Return all deliveries
  async getAllDeliveries() {
    return DELIVERIES.map((d) => ({ ...d }));
  }

  // Get single delivery by Guid or PurchaseDeliveryNumber
  async getDeliveryById(id) {
    if (!id) return null;
    const found = DELIVERIES.find((it) => it.Guid === id || it.PurchaseDeliveryNumber === id);
    return found ? { ...found } : null;
  }

  // Delivery detail helpers
  async getAllDeliveryDetails() {
    return DELIVERYDETAILS.map((d) => ({ ...d }));
  }

  async getDetailsByDeliveryGuid(deliveryGuid) {
    if (!deliveryGuid) return [];
    const items = DELIVERYDETAILS.filter((d) => d.DeliveryGuid === deliveryGuid);
    return items.map((d) => ({ ...d }));
  }

  async getDeliveryDetailById(id) {
    if (!id) return null;
    const found = DELIVERYDETAILS.find((d) => d.Guid === id);
    return found ? { ...found } : null;
  }

  // Resolve referenced item (inventory or service)
  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;

    // Use the parent delivery's PurchaseType to determine source
    const delivery = detail.DeliveryGuid ? await this.getDeliveryById(detail.DeliveryGuid) : null;
    const purchaseType = delivery && delivery.PurchaseType ? delivery.PurchaseType : null;

    if (purchaseType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (purchaseType === 'Service') {
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

export default DeliveryService;
