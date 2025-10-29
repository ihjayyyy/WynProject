// Mock sales invoice service matching the Sales Invoice data structure
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

// In-memory sales invoices
const INVOICES = [
  {
    Guid: 'SINV-2001',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'CUST-001',
    DeliveryGuid: 'DEL-2001',
    OrderGuid: 'SORD-001',
    SalesOrderNumber: 'SO-2025-0001',
    SalesInvoiceNumber: 'SI-2025-0001',
    Date: '2025-10-10',
    Description: 'Sales invoice for October orders',
    SalesType: 'Inventory',
    PreparedBy: 'Sales Rep',
    ApprovedBy: '',
    Status: 'draft',
    SupplierSO: 'SUP-SO-001',
    DueDate: '2025-11-10',
    InvoiceAmount: 2150.0,
  },
  {
    Guid: 'SINV-2002',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'CUST-002',
    DeliveryGuid: 'DEL-2002',
    OrderGuid: 'SORD-002',
    SalesOrderNumber: 'SO-2025-0002',
    SalesInvoiceNumber: 'SI-2025-0002',
    Date: '2025-09-01',
    Description: 'Service invoice for training',
    SalesType: 'Service',
    PreparedBy: 'Alice',
    ApprovedBy: 'Manager A',
    Status: 'approved',
    SupplierSO: '',
    DueDate: '2025-10-01',
    InvoiceAmount: 4800.0,
  },
];

// Invoice detail lines
const INVOICEDETAILS = [
  {
    Guid: 'SID-2001',
    InvoiceGuid: 'SINV-2001',
    OrderGuid: 'SORD-001',
    ItemGuid: 'INV-010',
    Quantity: 10,
    UnitPrice: 100.0,
    TotalPrice: 1000.0,
    Discount: 0.0,
    Description: 'Widget A',
  },
  {
    Guid: 'SID-2002',
    InvoiceGuid: 'SINV-2001',
    OrderGuid: 'SORD-001',
    ItemGuid: 'INV-011',
    Quantity: 5,
    UnitPrice: 230.0,
    TotalPrice: 1150.0,
    Discount: 0.0,
    Description: 'Widget B',
  },
  {
    Guid: 'SID-2003',
    InvoiceGuid: 'SINV-2002',
    OrderGuid: 'SORD-002',
    ItemGuid: 'SRV-100',
    Quantity: 1,
    UnitPrice: 4800.0,
    TotalPrice: 4800.0,
    Discount: 0.0,
    Description: 'On-site training (1 day) - pulled from Service table',
  },
];

const _subscribers = new Set();

class SalesInvoiceService {
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
    const newGuid = data.Guid || `SINV-${now}`;
    const newNumber = data.SalesInvoiceNumber || `SI-${now}`;

    const details = Array.isArray(data.details) ? data.details : [];
    const invoiceAmount = data.InvoiceAmount !== undefined ? data.InvoiceAmount : SalesInvoiceService._computeInvoiceAmount(details);

    const newI = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      DeliveryGuid: data.DeliveryGuid || '',
      OrderGuid: data.OrderGuid || '',
      SalesOrderNumber: data.SalesOrderNumber || '',
      SalesInvoiceNumber: newNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      SalesType: data.SalesType || 'Inventory',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      Status: data.Status || 'draft',
      SupplierSO: data.SupplierSO || '',
      DueDate: data.DueDate || null,
      InvoiceAmount: invoiceAmount,
    };

    INVOICES.push(newI);

    if (details.length > 0) {
      details.forEach((it, idx) => {
        const detailGuid = `SID-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          InvoiceGuid: newGuid,
          OrderGuid: it.OrderGuid || newI.OrderGuid || '',
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity !== undefined ? it.Quantity : (newI.SalesType === 'Service' ? 1 : 0),
          UnitPrice: it.UnitPrice !== undefined ? it.UnitPrice : 0,
          TotalPrice: it.TotalPrice !== undefined ? it.TotalPrice : (Number(it.Quantity || 0) * Number(it.UnitPrice || 0) - Number(it.Discount || 0)),
          Discount: it.Discount !== undefined ? it.Discount : 0,
          Description: it.Description || '',
        };
        INVOICEDETAILS.push(detail);
      });
    }

    SalesInvoiceService._notifySubscribers();
    return { ...newI };
  }

  async updateInvoice(data = {}) {
    if (!data) return null;
    const idx = INVOICES.findIndex((d) => d.Guid === data.Guid || d.SalesInvoiceNumber === data.SalesInvoiceNumber);
    if (idx === -1) return null;

    const existing = INVOICES[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      DeliveryGuid: data.DeliveryGuid !== undefined ? data.DeliveryGuid : existing.DeliveryGuid,
      OrderGuid: data.OrderGuid !== undefined ? data.OrderGuid : existing.OrderGuid,
      SalesOrderNumber: data.SalesOrderNumber !== undefined ? data.SalesOrderNumber : existing.SalesOrderNumber,
      SalesInvoiceNumber: data.SalesInvoiceNumber !== undefined ? data.SalesInvoiceNumber : existing.SalesInvoiceNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      SalesType: data.SalesType !== undefined ? data.SalesType : existing.SalesType,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierSO: data.SupplierSO !== undefined ? data.SupplierSO : existing.SupplierSO,
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
        const detailGuid = `SID-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          InvoiceGuid: updated.Guid,
          OrderGuid: it.OrderGuid || updated.OrderGuid || '',
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity !== undefined ? it.Quantity : (updated.SalesType === 'Service' ? 1 : 0),
          UnitPrice: it.UnitPrice !== undefined ? it.UnitPrice : 0,
          TotalPrice: it.TotalPrice !== undefined ? it.TotalPrice : (Number(it.Quantity || 0) * Number(it.UnitPrice || 0) - Number(it.Discount || 0)),
          Discount: it.Discount !== undefined ? it.Discount : 0,
          Description: it.Description || '',
        };
        INVOICEDETAILS.push(detail);
      });
    }

    SalesInvoiceService._notifySubscribers();
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
    SalesInvoiceService._notifySubscribers();
    return { ...updated };
  }

  async getAllInvoices() {
    return INVOICES.map((d) => ({ ...d }));
  }

  async getInvoiceById(id) {
    if (!id) return null;
    const found = INVOICES.find((it) => it.Guid === id || it.SalesInvoiceNumber === id);
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

  // Resolve referenced item (inventory or service) using SalesType from parent invoice
  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;

    const invoice = detail.InvoiceGuid ? await this.getInvoiceById(detail.InvoiceGuid) : null;
    const salesType = invoice && invoice.SalesType ? invoice.SalesType : null;

    if (salesType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (salesType === 'Service') {
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

export default SalesInvoiceService;
