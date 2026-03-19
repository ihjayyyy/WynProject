export const invoices = [
  {
    id: 'inv1',
    code: 'INV-001',
    name: 'Invoice for ORD-001',
    orderId: '1',
    status: 'Unpaid',
    createdBy: 'Alice',
    createdDate: '2026-03-18',
    updatedBy: 'Alice',
    updatedDate: '2026-03-18',
    items: [
      { id: 'i1', name: 'Chair Model A', qty: 10, price: 25, supplierId: 'SUP-0001' },
    ],
  },
  {
    id: 'inv2',
    code: 'INV-002',
    name: 'Invoice for ORD-002',
    orderId: '2',
    status: 'Paid',
    createdBy: 'Carlos',
    createdDate: '2026-03-17',
    updatedBy: 'Carlos',
    updatedDate: '2026-03-18',
    items: [
      { id: 'i3', name: 'Plywood 4x8', qty: 20, price: 12, supplierId: 'SUP-0003' },
    ],
  },
];

export default invoices;

export const initialInvoiceState = {
  id: '',
  code: '',
  name: '',
  orderId: '',
  status: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedDate: '',
  items: [],
};
