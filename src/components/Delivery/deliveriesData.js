export const deliveries = [
  {
    id: 'd1',
    code: 'DLV-001',
    name: 'Delivery for ORD-001',
    orderId: '1',
    status: 'Pending',
    createdBy: 'Alice',
    createdDate: '2026-03-17',
    updatedBy: 'Alice',
    updatedDate: '2026-03-17',
    items: [
      { id: 'i1', name: 'Chair Model A', qty: 10, supplierId: 'SUP-0001' },
    ],
  },
  {
    id: 'd2',
    code: 'DLV-002',
    name: 'Delivery for ORD-002',
    orderId: '2',
    status: 'Delivered',
    createdBy: 'Carlos',
    createdDate: '2026-03-16',
    updatedBy: 'Carlos',
    updatedDate: '2026-03-17',
    items: [
      { id: 'i3', name: 'Plywood 4x8', qty: 20, supplierId: 'SUP-0003' },
    ],
  },
];

export default deliveries;

export const initialDeliveryState = {
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
