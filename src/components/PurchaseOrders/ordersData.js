export const orders = [
  {
    id: '1',
    code: 'ORD-001',
    name: 'Office Chairs Order',
    createdBy: 'Alice',
    createdDate: '2026-03-16',
    updatedBy: 'Bob',
    updatedAt: '2026-03-16',
    requestedBy: 'Facilities',
    items: [
      { id: 'i1', name: 'Chair Model A', qty: 10, supplierId: 'SUP-0001' },
      { id: 'i2', name: 'Chair Model B', qty: 5, supplierId: 'SUP-0001' },
    ],
    itemsRequested: 2,
    supplier: { id: 'SUP-0001', name: 'ACME Supplies' },
  },
  {
    id: '2',
    code: 'ORD-002',
    name: 'Project Materials',
    createdBy: 'Carlos',
    createdDate: '2026-03-15',
    updatedBy: 'Carlos',
    updatedAt: '2026-03-15',
    requestedBy: 'Project A',
    items: [
      { id: 'i3', name: 'Plywood 4x8', qty: 20, supplierId: 'SUP-0003' },
    ],
    itemsRequested: 1,
    supplier: { id: 'SUP-0003', name: 'Gamma Suppliers' },
  },
];

export default orders;

export const initialOrderState = {
  id: '',
  code: '',
  name: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedAt: '',
  requestedBy: '',
  items: [],
  itemsRequested: 0,
  supplier: { id: '', name: '' },
};
