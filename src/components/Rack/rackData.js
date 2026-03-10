import { sampleWarehouses } from '../Warehouse/warehouseData';

export const sampleRacks = [
  {
    id: 'R1',
    createdBy: 'system',
    createdDate: '2026-01-12',
    updatedBy: 'system',
    updatedDate: '2026-02-02',
    code: 'RK-001',
    name: 'Rack A1',
    warehouseId: sampleWarehouses[0]?.id || 'W1',
  },
  {
    id: 'R2',
    createdBy: 'user2',
    createdDate: '2026-01-20',
    updatedBy: 'user2',
    updatedDate: '2026-02-10',
    code: 'RK-002',
    name: 'Rack B1',
    warehouseId: sampleWarehouses[1]?.id || 'W2',
  },
  {
    id: 'R3',
    createdBy: 'user3',
    createdDate: '2026-02-05',
    updatedBy: 'user3',
    updatedDate: '2026-02-22',
    code: 'RK-003',
    name: 'Rack C1',
    warehouseId: sampleWarehouses[2]?.id || 'W3',
  },
];

export const initialRackState = {
  id: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedDate: '',
  code: '',
  name: '',
  warehouseId: '',
};
