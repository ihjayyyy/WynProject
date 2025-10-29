// Mock purchase invoice service matching the Purchase Invoice data structure
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

// In-memory invoices (expanded for multiple statuses)
const INVOICES = [
  {
    Guid: 'INV-1001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP001',
    DeliveryGuid: 'DEL-1001',
    OrderGuid: 'ORD-001',
    PurchaseOrderNumber: 'PO-2025-0001',
    PurchaseInvoiceNumber: 'PI-2025-0001',
    Date: '2025-10-05',
    Description: 'Invoice for grooming supplies',
    PurchaseType: 'Inventory',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: '',
    Status: 'draft',
    SupplierPO: 'SUP-PO-001',
    DueDate: '2025-11-05',
    InvoiceAmount: 1250.0,
  },
  {
    Guid: 'INV-1002',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP002',
    DeliveryGuid: 'DEL-1002',
    OrderGuid: 'ORD-002',
    PurchaseOrderNumber: 'PO-2025-0002',
    PurchaseInvoiceNumber: 'PI-2025-0002',
    Date: '2025-09-22',
    Description: 'Consulting services for September',
    PurchaseType: 'Service',
    PreparedBy: 'Ana Santos',
    ApprovedBy: 'Manager A',
    Status: 'approved',
    SupplierPO: '',
    DueDate: '2025-10-22',
    InvoiceAmount: 4800.0,
  },
  {
    Guid: 'INV-1003',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP003',
    DeliveryGuid: 'DEL-1003',
    OrderGuid: 'ORD-003',
    PurchaseOrderNumber: 'PO-2025-0003',
    PurchaseInvoiceNumber: 'PI-2025-0003',
    Date: '2025-08-15',
    Description: 'Office chairs supply',
    PurchaseType: 'Inventory',
    PreparedBy: 'Mark Lim',
    ApprovedBy: 'Manager B',
    Status: 'closed',
    SupplierPO: 'SUP-PO-003',
    DueDate: '2025-09-15',
    InvoiceAmount: 15200.0,
  },
  {
    Guid: 'INV-1004',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP004',
    DeliveryGuid: 'DEL-1004',
    OrderGuid: 'ORD-004',
    PurchaseOrderNumber: 'PO-2025-0004',
    PurchaseInvoiceNumber: 'PI-2025-0004',
    Date: '2025-07-10',
    Description: 'Cancelled supplier invoice (test)',
    PurchaseType: 'Inventory',
    PreparedBy: 'Liza Cruz',
    ApprovedBy: '',
    Status: 'cancelled',
    SupplierPO: '',
    DueDate: '2025-08-10',
    InvoiceAmount: 0.0,
  },
];

// Invoice detail lines
const INVOICEDETAILS = [
  {
    Guid: 'ID-1001',
    InvoiceGuid: 'INV-1001',
    OrderGuid: 'ORD-001',
    ItemGuid: 'INV-001',
    Quantity: 5,
    UnitPrice: 50.0,
    TotalPrice: 250.0,
    Discount: 0.0,
    Description: 'Shampoo bottles - 250ml',
  },
  {
    Guid: 'ID-1002',
    InvoiceGuid: 'INV-1002',
    OrderGuid: 'ORD-002',
    ItemGuid: 'SRV-001',
    Quantity: 1,
    UnitPrice: 4800.0,
    TotalPrice: 4800.0,
    Discount: 0.0,
    Description: 'September consulting retainer',
  },
  {
    Guid: 'ID-1003',
    InvoiceGuid: 'INV-1003',
    OrderGuid: 'ORD-003',
    ItemGuid: 'INV-045',
    Quantity: 10,
    UnitPrice: 1520.0,
    TotalPrice: 15200.0,
    Discount: 0.0,
    Description: 'Ergonomic office chair',
  },
  {
    Guid: 'ID-1004',
    InvoiceGuid: 'INV-1004',
    OrderGuid: 'ORD-004',
    ItemGuid: 'INV-099',
    Quantity: 2,
    UnitPrice: 500.0,
    TotalPrice: 1000.0,
    Discount: 1000.0,
    Description: 'Cancelled test lines (amount zero after discount)',
  },
];

const _subscribers = new Set();

class PurchaseInvoiceService {
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    try {
      cb(INVOICES.map((d) => ({ ...d })));
    } catch (e) {
      // ignore
    }
    return () => _subscribers.delete(cb);
  }

  static _notifySubscribers() {
    const snapshot = INVOICES.map((d) => ({ ...d }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  // Utility to compute invoice total from details
  static _computeInvoiceAmount(details = []) {
    if (!Array.isArray(details)) return 0;
    return details.reduce((acc, it) => {
      const qty = Number(it.Quantity || 0);
      const unit = Number(it.UnitPrice || 0);
      const discount = Number(it.Discount || 0);
      const lineTotal = qty * unit - discount;
      return acc + lineTotal;
    }, 0);
  }

  async createInvoice(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `INV-${now}`;
    const newNumber = data.PurchaseInvoiceNumber || `PI-${now}`;

    const details = Array.isArray(data.details) ? data.details : [];
    const invoiceAmount = data.InvoiceAmount !== undefined ? data.InvoiceAmount : PurchaseInvoiceService._computeInvoiceAmount(details);

    const newI = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      DeliveryGuid: data.DeliveryGuid || '',
      OrderGuid: data.OrderGuid || '',
      PurchaseOrderNumber: data.PurchaseOrderNumber || '',
      PurchaseInvoiceNumber: newNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      PurchaseType: data.PurchaseType || 'Inventory',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      Status: data.Status || 'draft',
      SupplierPO: data.SupplierPO || '',
      DueDate: data.DueDate || null,
      InvoiceAmount: invoiceAmount,
    };

    INVOICES.push(newI);

    if (details.length > 0) {
      details.forEach((it, idx) => {
        const detailGuid = `ID-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          InvoiceGuid: newGuid,
          OrderGuid: it.OrderGuid || newI.OrderGuid || '',
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity !== undefined ? it.Quantity : (newI.PurchaseType === 'Service' ? 1 : 0),
          UnitPrice: it.UnitPrice !== undefined ? it.UnitPrice : 0,
          TotalPrice: it.TotalPrice !== undefined ? it.TotalPrice : (Number(it.Quantity || 0) * Number(it.UnitPrice || 0) - Number(it.Discount || 0)),
          Discount: it.Discount !== undefined ? it.Discount : 0,
          Description: it.Description || '',
        };
        INVOICEDETAILS.push(detail);
      });
    }

    PurchaseInvoiceService._notifySubscribers();
    return { ...newI };
  }

  async updateInvoice(data = {}) {
    if (!data) return null;
    const idx = INVOICES.findIndex((d) => d.Guid === data.Guid || d.PurchaseInvoiceNumber === data.PurchaseInvoiceNumber);
    if (idx === -1) return null;

    const existing = INVOICES[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      DeliveryGuid: data.DeliveryGuid !== undefined ? data.DeliveryGuid : existing.DeliveryGuid,
      OrderGuid: data.OrderGuid !== undefined ? data.OrderGuid : existing.OrderGuid,
      PurchaseOrderNumber: data.PurchaseOrderNumber !== undefined ? data.PurchaseOrderNumber : existing.PurchaseOrderNumber,
      PurchaseInvoiceNumber: data.PurchaseInvoiceNumber !== undefined ? data.PurchaseInvoiceNumber : existing.PurchaseInvoiceNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      PurchaseType: data.PurchaseType !== undefined ? data.PurchaseType : existing.PurchaseType,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierPO: data.SupplierPO !== undefined ? data.SupplierPO : existing.SupplierPO,
      DueDate: data.DueDate !== undefined ? data.DueDate : existing.DueDate,
      InvoiceAmount: data.InvoiceAmount !== undefined ? data.InvoiceAmount : existing.InvoiceAmount,
    };

    INVOICES[idx] = updated;

    // Replace details for this invoice
    for (let i = INVOICEDETAILS.length - 1; i >= 0; i--) {
      if (INVOICEDETAILS[i].InvoiceGuid === updated.Guid) {
        INVOICEDETAILS.splice(i, 1);
      }
    }

    if (Array.isArray(data.details) && data.details.length > 0) {
      const now = Date.now();
      data.details.forEach((it, idx2) => {
        const detailGuid = `ID-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          InvoiceGuid: updated.Guid,
          OrderGuid: it.OrderGuid || updated.OrderGuid || '',
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity !== undefined ? it.Quantity : (updated.PurchaseType === 'Service' ? 1 : 0),
          UnitPrice: it.UnitPrice !== undefined ? it.UnitPrice : 0,
          TotalPrice: it.TotalPrice !== undefined ? it.TotalPrice : (Number(it.Quantity || 0) * Number(it.UnitPrice || 0) - Number(it.Discount || 0)),
          Discount: it.Discount !== undefined ? it.Discount : 0,
          Description: it.Description || '',
        };
        INVOICEDETAILS.push(detail);
      });
    }

    PurchaseInvoiceService._notifySubscribers();
    return { ...updated };
  }

  async setInvoiceStatus({ Guid, Status, ApprovedBy } = {}) {
    if (!Guid) return null;
    const idx = INVOICES.findIndex((d) => d.Guid === Guid);
    if (idx === -1) return null;
    const existing = INVOICES[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (ApprovedBy !== undefined) updated.ApprovedBy = ApprovedBy;
    INVOICES[idx] = updated;
    PurchaseInvoiceService._notifySubscribers();
    return { ...updated };
  }

  async getAllInvoices() {
    return INVOICES.map((d) => ({ ...d }));
  }

  async getInvoiceById(id) {
    if (!id) return null;
    const found = INVOICES.find((it) => it.Guid === id || it.PurchaseInvoiceNumber === id);
    return found ? { ...found } : null;
  }

  // Invoice detail helpers
  async getAllInvoiceDetails() {
    return INVOICEDETAILS.map((d) => ({ ...d }));
  }

  async getDetailsByInvoiceGuid(invoiceGuid) {
    if (!invoiceGuid) return [];
    const items = INVOICEDETAILS.filter((d) => d.InvoiceGuid === invoiceGuid);
    return items.map((d) => ({ ...d }));
  }

  async getInvoiceDetailById(id) {
    if (!id) return null;
    const found = INVOICEDETAILS.find((d) => d.Guid === id);
    return found ? { ...found } : null;
  }

  // Resolve referenced item (inventory or service) using PurchaseType from parent invoice
  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;

    const invoice = detail.InvoiceGuid ? await this.getInvoiceById(detail.InvoiceGuid) : null;
    const purchaseType = invoice && invoice.PurchaseType ? invoice.PurchaseType : null;

    if (purchaseType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (purchaseType === 'Service') {
      const svc = new ServiceService();
      return await svc.getServiceById(itemGuid);
    }

    // Fallback try inventory then service
    const invSvc = new InventoryService();
    const maybeInv = await invSvc.getInventoryById(itemGuid);
    if (maybeInv) return maybeInv;
    const svc = new ServiceService();
    return await svc.getServiceById(itemGuid);
  }

  async getDetailsWithItemsByInvoiceGuid(invoiceGuid) {
    const details = await this.getDetailsByInvoiceGuid(invoiceGuid);
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

export default PurchaseInvoiceService;
