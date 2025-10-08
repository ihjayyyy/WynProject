// MOCK DATA
import { InventoryService } from './inventoryService';
import { ServiceService } from './serviceService';
const QUOTATIONS = [
  {
    Guid: 'ID123',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP001',
    QuotationNumber: 'QTN-2025-0001',
    Date: '2025-10-01',
    Description: 'Haircut and grooming supplies',
    PurchaseType: 'Inventory',
    ValidUntil: '2025-10-15',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: '',
    Status: 'Draft',
    SupplierContactPerson: 'Jose Ramirez',
    SupplierContactNumber: '+63 917 123 4567',
  },
  {
    Guid: 'ID456',
    CompanyGuid: 'c0mp-0001-aaaa-bbbb-ccccdddd1111',
    SupplierGuid: 'COMP002',
    QuotationNumber: 'QTN-2025-0002',
    Date: '2025-10-01',
    Description: 'Massage',
    PurchaseType: 'Service',
    ValidUntil: '2025-10-10',
    PreparedBy: 'Juan Dela Cruz',
    ApprovedBy: 'Maria Santos',
   Status: 'Approved',
    SupplierContactPerson: 'Ana Cruz',
    SupplierContactNumber: '+63 918 654 3210',
  },
  {
    Guid: 'ID789',
    CompanyGuid: 'c0mp-0002-eeee-ffff-gggghhhh2222',
    SupplierGuid: 'COMP003',
    QuotationNumber: 'QTN-2025-0003',
    Date: '2025-10-01',
    Description: 'Extra Service',
    PurchaseType: 'Service',
    ValidUntil: '2025-11-01',
    PreparedBy: 'Carlo Mendoza',
    ApprovedBy: 'Andrea Lopez',
    Status: 'Cancelled',
    SupplierContactPerson: 'Mark Villanueva',
    SupplierContactNumber: '+63 920 888 7777',
  },
  {
    Guid: 'ID999',
    CompanyGuid: 'c0mp-0003-iiii-jjjj-kkkkllll3333',
    SupplierGuid: 'COMP004',
    QuotationNumber: 'QTN-2025-0004',
    Date: '2025-10-05',
    Description: 'Office supplies and accessories',
    PurchaseType: 'Inventory',
    ValidUntil: '2025-10-25',
    PreparedBy: 'Liza Ramos',
    ApprovedBy: 'Carlos Dela Cruz',
    Status: 'Ordered',
    SupplierContactPerson: 'Ruben Alvarez',
    SupplierContactNumber: '+63 922 111 2222',
  },
];

const QUOTATIONDETAILS = [
  {
    Guid: 'QD-1001',
    QuotationGuid: 'ID123',
    ItemGuid: 'INV1',
    Quantity: 10,
    UnitPrice: 120.0,
    Discount: 0,
    TotalPrice: 1200.0,
    Description: 'Shampoo bottles - 250ml',
  },
  {
    Guid: 'QD-1002',
    QuotationGuid: 'ID123',
    ItemGuid: 'INV2',
    Quantity: 5,
    UnitPrice: 250.0,
    Discount: 25.0,
    TotalPrice: 1200.0,
    Description: 'Hair clippers',
  },
  {
    Guid: 'QD-2001',
    QuotationGuid: 'ID456',
    ItemGuid: 'SRV1',
    Quantity: 1,
    UnitPrice: 1500.0,
    Discount: 0,
    TotalPrice: 1500.0,
    Description: 'Full body massage (60min)',
  },
  {
    Guid: 'QD-3001',
    QuotationGuid: 'ID789',
    ItemGuid: 'SRV2',
    Quantity: 2,
    UnitPrice: 800.0,
    Discount: 50.0,
    TotalPrice: 1550.0,
    Description: 'Special treatment package',
  },
  {
    Guid: 'QD-4001',
    QuotationGuid: 'ID999',
    ItemGuid: 'INV3',
    Quantity: 20,
    UnitPrice: 45.0,
    Discount: 0,
    TotalPrice: 900.0,
    Description: 'Pens and notepads set',
  },
]
// Simple in-memory subscriber list for notifying listeners when quotations change
const _subscribers = new Set();

class QuotationService {
  // Allow components to subscribe to changes in the quotations list.
  // Returns an unsubscribe function.
  static subscribe(cb) {
    if (typeof cb !== 'function') return () => {};
    _subscribers.add(cb);
    // Immediately notify the new subscriber with current snapshot
    try {
      cb(QUOTATIONS.map((q) => ({ ...q })));
    } catch (e) {
      // ignore
    }
    return () => {
      _subscribers.delete(cb);
    };
  }

  // Internal notifier
  static _notifySubscribers() {
    const snapshot = QUOTATIONS.map((q) => ({ ...q }));
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        // swallow subscriber errors
      }
    });
  }

  // Create a new quotation (mock). Accepts a data object and optional items array.
  async createQuotation(data = {}) {
    const now = Date.now();
    const newGuid = data.Guid || `ID${now}`;
    const newQuotationNumber = data.QuotationNumber || `QTN-${now}`;
    // Compute default ValidUntil: 1 month after data.Date or today
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
      PurchaseType: data.PurchaseType || 'Inventory',
      ValidUntil: validUntil || '',
      PreparedBy: data.PreparedBy || 'Admin',
      ApprovedBy: data.ApprovedBy || '',
      Status: data.Status || 'Draft',
      SupplierContactPerson: data.SupplierContactPerson || '',
      SupplierContactNumber: data.SupplierContactNumber || '',
    };

    QUOTATIONS.push(newQ);

    // If items provided, create detail records (mock)
    if (Array.isArray(data.items) && data.items.length > 0) {
      data.items.forEach((it, idx) => {
        const detailGuid = `QD-${now}-${idx}`;
        const detail = {
          Guid: detailGuid,
          QuotationGuid: newGuid,
          ItemGuid: it.ProductGuid || it.ServiceGuid || it.ItemGuid || '',
          Quantity: it.Quantity || 1,
          UnitPrice: it.UnitPrice || it.Price || 0,
          Discount: it.Discount || 0,
          TotalPrice: it.TotalPrice || (Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0)),
          Description: it.Description || '',
        };
        QUOTATIONDETAILS.push(detail);
      });
    }

    // notify subscribers about the new list
    QuotationService._notifySubscribers();

    return { ...newQ };
  }

  // Update an existing quotation by Guid or QuotationNumber
  async updateQuotation(data = {}) {
    if (!data) return null;
    const key = data.Guid || data.QuotationNumber;
    if (!key) return null;
    const idx = QUOTATIONS.findIndex((q) => q.Guid === data.Guid || q.QuotationNumber === data.QuotationNumber);
    if (idx === -1) {
      // Not found - return null to indicate failure
      return null;
    }

    // Merge fields into existing record
    const existing = QUOTATIONS[idx];
    const updated = {
      ...existing,
      CompanyGuid: data.CompanyGuid !== undefined ? data.CompanyGuid : existing.CompanyGuid,
      SupplierGuid: data.SupplierGuid !== undefined ? data.SupplierGuid : existing.SupplierGuid,
      QuotationNumber: data.QuotationNumber !== undefined ? data.QuotationNumber : existing.QuotationNumber,
      Date: data.Date !== undefined ? data.Date : existing.Date,
      Description: data.Description !== undefined ? data.Description : existing.Description,
      PurchaseType: data.PurchaseType !== undefined ? data.PurchaseType : existing.PurchaseType,
      ValidUntil: data.ValidUntil !== undefined ? data.ValidUntil : existing.ValidUntil,
      PreparedBy: data.PreparedBy !== undefined ? data.PreparedBy : existing.PreparedBy,
      ApprovedBy: data.ApprovedBy !== undefined ? data.ApprovedBy : existing.ApprovedBy,
      Status: data.Status !== undefined ? data.Status : existing.Status,
      SupplierContactPerson: data.SupplierContactPerson !== undefined ? data.SupplierContactPerson : existing.SupplierContactPerson,
      SupplierContactNumber: data.SupplierContactNumber !== undefined ? data.SupplierContactNumber : existing.SupplierContactNumber,
    };

    // Replace in array
    QUOTATIONS[idx] = updated;

    // Replace details: remove existing details for this quotation and add new ones if provided
    for (let i = QUOTATIONDETAILS.length - 1; i >= 0; i--) {
      if (QUOTATIONDETAILS[i].QuotationGuid === updated.Guid) {
        QUOTATIONDETAILS.splice(i, 1);
      }
    }
    if (Array.isArray(data.items) && data.items.length > 0) {
      const now = Date.now();
      data.items.forEach((it, idx2) => {
        const detailGuid = `QD-${now}-${idx2}`;
        const detail = {
          Guid: detailGuid,
          QuotationGuid: updated.Guid,
          ItemGuid: it.ProductGuid || it.ServiceGuid || it.ItemGuid || '',
          Quantity: it.Quantity || 1,
          UnitPrice: it.UnitPrice || it.Price || 0,
          Discount: it.Discount || 0,
          TotalPrice: it.TotalPrice || (Number(it.Quantity || 1) * Number(it.UnitPrice || it.Price || 0)),
          Description: it.Description || '',
        };
        QUOTATIONDETAILS.push(detail);
      });
    }

    // Notify subscribers
    QuotationService._notifySubscribers();

    return { ...updated };
  }

  // Set only the status (and optionally ApprovedBy) for a quotation
  async setQuotationStatus({ Guid, Status, ApprovedBy } = {}) {
    if (!Guid) return null;
    const idx = QUOTATIONS.findIndex((q) => q.Guid === Guid);
    if (idx === -1) return null;
    const existing = QUOTATIONS[idx];
    const updated = { ...existing };
    if (Status !== undefined) updated.Status = Status;
    if (ApprovedBy !== undefined) updated.ApprovedBy = ApprovedBy;
    QUOTATIONS[idx] = updated;
    // Notify subscribers about the change
    QuotationService._notifySubscribers();
    return { ...updated };
  }

  // (end of added create/subscribe helpers)

  
  // Return all quotations (shallow copies) as a promise to simulate async
  async getAllQuotations() {
    return QUOTATIONS.map((item) => ({ ...item }));
  }

  // Get a single quotation by Guid or QuotationNumber
  async getQuotationById(id) {
    if (!id) return null;
    const found = QUOTATIONS.find(
      (it) => it.Guid === id || it.QuotationNumber === id
    );
    return found ? { ...found } : null;
  }

  // Return all quotation line items (details)
  async getAllQuotationDetails() {
    return QUOTATIONDETAILS.map((d) => this._normalizeDetail(d));
  }

  // Get all details for a given quotation Guid
  async getDetailsByQuotationGuid(quotationGuid) {
    if (!quotationGuid) return [];
    const items = QUOTATIONDETAILS.filter((d) => d.QuotationGuid === quotationGuid);
    return items.map((d) => this._normalizeDetail(d));
  }

  // Get a single quotation detail by its Guid
  async getQuotationDetailById(id) {
    if (!id) return null;
    const found = QUOTATIONDETAILS.find((d) => d.Guid === id);
    return found ? this._normalizeDetail(found) : null;
  }

  // Resolve the referenced item (inventory product or service) for a detail
  async _resolveItemRecord(detail) {
    const itemGuid = detail.ItemGuid || null;
    if (!itemGuid) return null;

    // Use the parent quotation's PurchaseType to determine whether the ItemGuid refers to Inventory or Service
    const quotation = detail.QuotationGuid ? await this.getQuotationById(detail.QuotationGuid) : null;
    const purchaseType = quotation && quotation.PurchaseType ? quotation.PurchaseType : null;

    if (purchaseType === 'Inventory') {
      const invSvc = new InventoryService();
      return await invSvc.getInventoryById(itemGuid);
    }
    if (purchaseType === 'Service') {
      const svc = new ServiceService();
      return await svc.getServiceById(itemGuid);
    }

    // Fallback when PurchaseType is missing or unknown: try inventory first then service
    const invSvc = new InventoryService();
    const maybeInv = await invSvc.getInventoryById(itemGuid);
    if (maybeInv) return maybeInv;
    const svc = new ServiceService();
    return await svc.getServiceById(itemGuid);
  }

  // Return details for a quotation with the resolved item record attached
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

  // Return a single detail with its resolved item
  async getQuotationDetailWithItemById(id) {
    const d = await this.getQuotationDetailById(id);
    if (!d) return null;
    const item = await this._resolveItemRecord(d);
    return { ...d, Item: item };
  }

  // Internal: ensure fields exist and compute TotalPrice when missing/invalid
  _normalizeDetail(detail) {
    const d = { ...detail };
    // Ensure numeric fields are numbers
    d.Quantity = Number(d.Quantity) || 0;
    d.UnitPrice = Number(d.UnitPrice) || 0;
    d.Discount = Number(d.Discount) || 0;
    // If TotalPrice is missing or not a finite number, compute it
    const total = Number(d.TotalPrice);
    if (!Number.isFinite(total) || total === 0) {
      d.TotalPrice = +(d.Quantity * d.UnitPrice - d.Discount).toFixed(2);
    } else {
      d.TotalPrice = +total.toFixed(2);
    }
    return d;
  }
}
export default QuotationService;
