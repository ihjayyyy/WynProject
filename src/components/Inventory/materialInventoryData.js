export const sampleMaterialInventory = [
  {
    id: 'I1',
    createdBy: 'system',
    createdDate: '2026-01-15',
    updatedBy: 'user1',
    updatedDate: '2026-02-01',
    name: 'Concrete - Site A',
    rackId: 'R1',
    materialId: 'M1',
    quantity: 120,
  },
  {
    id: 'I2',
    createdBy: 'user2',
    createdDate: '2026-01-20',
    updatedBy: 'user2',
    updatedDate: '2026-02-05',
    name: 'Hammers Batch',
    rackId: 'R2',
    materialId: 'M2',
    quantity: 40,
  },
];

export const initialMaterialInventoryState = {
  id: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedDate: '',
  name: '',
  rackId: '',
  materialId: '',
  quantity: 0,
};
