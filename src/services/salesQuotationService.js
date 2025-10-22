// MOCK DATA for Sales Quotations
import { InventoryService } from './inventoryService.js';
import { ServiceService } from './serviceService.js';

const SALES_QUOTATIONS = [
  {
    Guid: 'S-ID100',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'CUST001',
    QuotationNumber: 'S-QTN-2025-0001',
    Date: '2025-10-02',
    Description: 'Salon packages for retail',
    SalesType: 'inventory',
    ValidUntil: '2025-10-20',
    PreparedBy: 'Admin',
    ApprovedBy: '',
    Status: 'draft',
    SupplierContactPerson: 'Client Rep',
    SupplierContactNumber: '+63 912 345 6789',
  },
];

const SALES_QUOTATION_DETAILS = [
  {
    Guid: 'SQD-1',
    QuotationGuid: 'S-ID100',
    ItemGuid: 'INV1',
    Quantity: 2,
    UnitPrice: 500.0,
    Discount: 0,
    TotalPrice: 1000.0,
    Description: 'Shampoo - from product table',
  },
];

const _salesSubscribers = new Set();

class SalesQuotationService {
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _salesSubscribers.add(cb);
    try {
      cb(SALES_QUOTATIONS.map((q) => ({ ...q })));
    } catch (e) {
      // ignore
    }
    return () => {
      _salesSubscribers.delete(cb);
    };
  }

  static _notifySubscribers() {
    const snapshot = SALES_QUOTATIONS.map((q) => ({ ...q }));
    _salesSubscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow
      }
    });
  }

  async createSalesQuotation(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `S-ID${now}`;
    const newQuotationNumber = data.QuotationNumber || `S-QTN-${now}`;
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

    const newQ = {
      Guid: newGuid,
      CompanyGuid: data.CompanyGuid || '',
      SupplierGuid: data.SupplierGuid || '',
      QuotationNumber: newQuotationNumber,
      Date: data.Date || new Date().toISOString().slice(0, 10),
      Description: data.Description || '',
      SalesType: data.SalesType || 'inventory',
      ValidUntil: validUntil || '',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      Status: data.Status || 'draft',
      SupplierContactPerson: data.SupplierContactPerson || '',
      SupplierContactNumber: data.SupplierContactNumber || '',
    };

    SALES_QUOTATIONS.push(newQ);

    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx) => {
        const detailGuid = `SQD-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          QuotationGuid: newGuid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity || (data.SalesType === 'service' ? 1 : 1) || 1,
          UnitPrice: it.UnitPrice || it.Price || 0,
          Discount: it.Discount || 0,
          TotalPrice: it.TotalPrice || (Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0)),
          Description: it.Description || '',
        };
        SALES_QUOTATION_DETAILS.push(detail);
      });
    }

    SalesQuotationService._notifySubscribers();
    return { ...newQ };
  }

  async updateSalesQuotation(data = {}) {
    if (!data) return null;
    const key = data.Guid || data.QuotationNumber;
    if (!key) return null;
    const idx = SALES_QUOTATIONS.findIndex((q) => q.Guid === data.Guid || q.QuotationNumber === data.QuotationNumber);
    if (idx === -1) return null;

    const existing = SALES_QUOTATIONS[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      QuotationNumber: data.QuotationNumber !== undefined ? data.QuotationNumber : existing.QuotationNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      SalesType: data.SalesType !== undefined ? data.SalesType : existing.SalesType,
      ValidUntil: data.ValidUntil !== undefined ? data.ValidUntil : existing.ValidUntil,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierContactPerson: data.SupplierContactPerson !== undefined ? data.SupplierContactPerson : existing.SupplierContactPerson,
      SupplierContactNumber: data.SupplierContactNumber !== undefined ? data.SupplierContactNumber : existing.SupplierContactNumber,
    };

    SALES_QUOTATIONS[idx] = updated;

    for (let i = SALES_QUOTATION_DETAILS.length - 1; i >= 0; i--) {
      if (SALES_QUOTATION_DETAILS[i].QuotationGuid === updated.Guid) {
        SALES_QUOTATION_DETAILS.splice(i, 1);
      }
    }
    if (Array.isArray(data.items) && data.items.length > 0) {
      const now = Date.now();
      data.items.forEach((it, idx2) => {
        const detailGuid = `SQD-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          QuotationGuid: updated.Guid,
          ItemGuid: it.ItemGuid || it.ProductGuid || it.ServiceGuid || '',
          Quantity: it.Quantity || (data.SalesType === 'service' ? 1 : 1) || 1,
          UnitPrice: it.UnitPrice || it.Price || 0,
          Discount: it.Discount || 0,
          TotalPrice: it.TotalPrice || (Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0)),
          Description: it.Description || '',
        };
        SALES_QUOTATION_DETAILS.push(detail);
      });
    }

    SalesQuotationService._notifySubscribers();
    return { ...updated };
  }

  async setSalesQuotationStatus({ Guid, Status, ApprovedBy } = {}) {
    if (!Guid) return null;
    const idx = SALES_QUOTATIONS.findIndex((q) => q.Guid === Guid);
    if (idx === -1) return null;
    const existing = SALES_QUOTATIONS[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (ApprovedBy !== undefined) updated.ApprovedBy = ApprovedBy;
    SALES_QUOTATIONS[idx] = updated;
    SalesQuotationService._notifySubscribers();
    return { ...updated };
  }

  async getAllSalesQuotations() {
    return SALES_QUOTATIONS.map((item) => ({ ...item }));
  }

  async getSalesQuotationById(id) {
    if (!id) return null;
    const found = SALES_QUOTATIONS.find((it) => it.Guid === id || it.QuotationNumber === id);
    return found ? { ...found } : null;
  }

  async getAllSalesQuotationDetails() {
    return SALES_QUOTATION_DETAILS.map((d) => this._normalizeDetail(d));
  }

  async getDetailsByQuotationGuid(quotationGuid) {
    if (!quotationGuid) return [];
    const items = SALES_QUOTATION_DETAILS.filter((d) => d.QuotationGuid === quotationGuid);
    return items.map((d) => this._normalizeDetail(d));
  }

  async getSalesQuotationDetailById(id) {
    if (!id) return null;
    const found = SALES_QUOTATION_DETAILS.find((d) => d.Guid === id);
    return found ? this._normalizeDetail(found) : null;
  }

  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;
    const quotation = detail.QuotationGuid ? await this.getSalesQuotationById(detail.QuotationGuid) : null;
    const salesType = quotation && quotation.SalesType ? quotation.SalesType.toLowerCase() : null;

    if (salesType === 'inventory' || salesType === 'inventory') {
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

  async getDetailsWithItemsByQuotationGuid(quotationGuid) {
    const details = await this.getDetailsByQuotationGuid(quotationGuid);
    const results = await Promise.all(
      details.map(async (d) => {
        const normalized = this._normalizeDetail(d);
        const item = await this._resolveItemRecord(normalized);
        return { ...normalized, Item: item };
      })
    );
    return results;
  }

  async getSalesQuotationDetailWithItemById(id) {
    const d = await this.getSalesQuotationDetailById(id);
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

export default SalesQuotationService;
