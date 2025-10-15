// MOCK DATA
const SUPPLIERS = [
  {
    CompanyGuid: 'COMP001',
    CompanyCode: 'ACME',
    Name: 'Acme Corporation',
    Logo: '',
    Address: '123 Ayala Ave, Makati City',
    Phone: '+63 2 8123 4567',
    Fax: '+63 2 8123 4568',
    Email: 'john.smith@acme.com',
    Website: 'www.acme.com',
    TaxNumber: 'TX123456',
    ContactPerson: 'John Smith',
    ContactNumber: '+63 917 111 2222',
    PaymentTerms: 30,
    Status: 'ACTIVE',
    SupplierType: 'Local',
  },
  {
    CompanyGuid: 'COMP002',
    CompanyCode: 'GLOB',
    Name: 'Global Supplies Ltd',
    Logo: '',
    Address: '456 Ortigas Ave, Pasig City',
    Phone: '+63 2 8987 6543',
    Fax: '+63 2 8987 6544',
    Email: 'sarah.j@globalsupplies.com',
    Website: 'www.globalsupplies.com',
    TaxNumber: 'TX654321',
    ContactPerson: 'Sarah Johnson',
    ContactNumber: '+63 918 333 4444',
    PaymentTerms: 45,
    Status: 'ACTIVE',
    SupplierType: 'International',
  },
  {
    CompanyGuid: 'COMP003',
    CompanyCode: 'TECH',
    Name: 'Tech Solutions Inc',
    Logo: '',
    Address: '789 IT Park, Cebu City',
    Phone: '+63 32 456 7890',
    Fax: '+63 32 456 7891',
    Email: 'mbrown@techsolutions.com',
    Website: 'www.techsolutions.com',
    TaxNumber: 'TX789123',
    ContactPerson: 'Michael Brown',
    ContactNumber: '+63 919 555 6666',
    PaymentTerms: 60,
    Status: 'PENDING',
    SupplierType: 'Local',
  },
];

class SupplierService {
  // Return all suppliers (shallow copies) as a promise to simulate async
  async getAllSuppliers() {
    return SUPPLIERS.map((item) => ({ ...item }));
  }

  // Get a single supplier by CompanyGuid or CompanyCode
  async getSupplierById(id) {
    if (!id) return null;
    const found = SUPPLIERS.find(
      (it) => it.CompanyGuid === id || it.CompanyCode === id
    );
    return found ? { ...found } : null;
  }

  async createCompany(companyData) {
    if (!companyData || typeof companyData !== 'object') {
      throw new Error('Invalid company data');
    }

    // Simple unique ID generator
    const newGuid =
      companyData.CompanyGuid ||
      `COMP${(SUPPLIERS.length + 1).toString().padStart(3, '0')}`;

    const newCompany = {
      CompanyGuid: newGuid,
      CompanyCode: companyData.CompanyCode || '',
      Name: companyData.Name || '',
      Logo: companyData.Logo || '',
      Address: companyData.Address || '',
      Phone: companyData.Phone || '',
      Fax: companyData.Fax || '',
      Email: companyData.Email || '',
      Website: companyData.Website || '',
      TaxNumber: companyData.TaxNumber || '',
      ContactPerson: companyData.ContactPerson || '',
      ContactNumber: companyData.ContactNumber || '',
      PaymentTerms: companyData.PaymentTerms || 30,
      Status: companyData.Status || 'ACTIVE',
      SupplierType: companyData.SupplierType || 'Local',
    };

    SUPPLIERS.push(newCompany);

    return { ...newCompany };
  }

  async updateCompany(data) {
    if (!data || !data.CompanyGuid) throw new Error('updateCompany requires CompanyGuid');
    const idx = SUPPLIERS.findIndex((it) => it.CompanyGuid === data.CompanyGuid);
    if (idx === -1) return null;
    const updated = { ...SUPPLIERS[idx], ...data };
    SUPPLIERS[idx] = updated;
    return { ...updated };
  }
}

export default SupplierService;
