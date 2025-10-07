// MOCK DATA
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
    ApprovedBy: 'Maria Santos',
    Status: 'Pending',
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
    Status: 'Rejected',
    SupplierContactPerson: 'Mark Villanueva',
    SupplierContactNumber: '+63 920 888 7777',
  },
];

class QuotationService {
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
}
export default QuotationService;
