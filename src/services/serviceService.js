//MOCK DATA
const SERVICES = [
  {
    Guid: 'SRV1',
    ServiceCategoryGuid: 'sssssss1-ssss-ssss-ssss-ssssssssssss',
    CompanyGuid: 'ccccccc1-cccc-cccc-cccc-cccccccccccc',
    ServiceType: 'Maintenance',
    ServiceCode: 'SV-001',
    Name: 'Air Conditioning Repair',
    UnitOfMeasureGuid: 'uuuuu001-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description: 'Comprehensive air conditioning system repair and cleaning',
  },
  {
    Guid: 'SRV2',
    ServiceCategoryGuid: 'sssssss2-ssss-ssss-ssss-ssssssssssss',
    CompanyGuid: 'ccccccc1-cccc-cccc-cccc-cccccccccccc',
    ServiceType: 'Installation',
    ServiceCode: 'SV-002',
    Name: 'CCTV Installation',
    UnitOfMeasureGuid: 'uuuuu002-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description:
      'Professional installation of CCTV cameras and monitoring systems',
  },
  {
    Guid: 'SRV3',
    ServiceCategoryGuid: 'sssssss3-ssss-ssss-ssss-ssssssssssss',
    CompanyGuid: 'ccccccc2-cccc-cccc-cccc-cccccccccccc',
    ServiceType: 'Cleaning',
    ServiceCode: 'SV-003',
    Name: 'Office Deep Cleaning',
    UnitOfMeasureGuid: 'uuuuu003-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description: 'Full-scale cleaning service for office spaces and equipment',
  },
];

// Simple in-memory supplier/inventory service
export class ServiceService {
  // Return all services (shallow copies) as a promise to simulate async
  async getAllServices() {
    // Return a copy so callers don't accidentally mutate the internal mock
    return SERVICES.map((item) => ({ ...item }));
  }

  // Get a single service item by Guid (or by ProductCode as a convenience)
  async getServiceById(id) {
    if (!id) return null;
    const found = SERVICES.find(
      (it) => it.Guid === id || it.ServiceCode === id
    );
    return found ? { ...found } : null;
  }
}
