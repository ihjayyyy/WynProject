//MOCK DATA
const INVENTORIES = [
  {
    Guid: 'INV1',
    ProductCategoryGuid: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    CompanyGuid: 'ccccccc1-cccc-cccc-cccc-cccccccccccc',
    ProductType: 'Raw Material',
    ProductCode: 'RM-001',
    Name: 'Steel Rod',
    UnitOfMeasureGuid: 'uuuuu001-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description: 'High strength steel rod for construction',
    UnitPrice: 120.0,
  },
  {
    Guid: 'INV2',
    ProductCategoryGuid: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    CompanyGuid: 'ccccccc1-cccc-cccc-cccc-cccccccccccc',
    ProductType: 'Finished Goods',
    ProductCode: 'FG-001',
    Name: 'Aluminum Door',
    UnitOfMeasureGuid: 'uuuuu002-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description: 'Lightweight aluminum door with lockset',
    UnitPrice: 250.0,
  },
  {
    Guid: 'INV3',
    ProductCategoryGuid: 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    CompanyGuid: 'ccccccc2-cccc-cccc-cccc-cccccccccccc',
    ProductType: 'Consumable',
    ProductCode: 'CS-001',
    Name: 'Industrial Glue',
    UnitOfMeasureGuid: 'uuuuu003-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    Description: 'Fast-drying industrial adhesive',
    UnitPrice: 45.0,
  },
];

// Simple in-memory supplier/inventory service
export class InventoryService {
  // Return all inventories (shallow copies) as a promise to simulate async
  async getAllInventories() {
    // Return a copy so callers don't accidentally mutate the internal mock
    return INVENTORIES.map((item) => ({ ...item }));
  }

  // Get a single inventory item by Guid (or by ProductCode as a convenience)
  async getInventoryById(id) {
    if (!id) return null;
    const found = INVENTORIES.find(
      (it) => it.Guid === id || it.ProductCode === id
    );
    return found ? { ...found } : null;
  }
}
