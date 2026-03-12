export const sampleAssemblies = [
  {
    id: 'A1',
    createdBy: 'system',
    createdDate: '2026-02-01',
    updatedBy: 'system',
    updatedDate: '2026-02-10',
    code: 'ASM-001',
    name: 'Window Frame Assembly',
    uom: 'set',
  },
  {
    id: 'A2',
    createdBy: 'user1',
    createdDate: '2026-02-15',
    updatedBy: 'user2',
    updatedDate: '2026-03-01',
    code: 'ASM-002',
    name: 'Door Assembly',
    uom: 'set',
  },
];

export const initialAssemblyState = {
  id: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedDate: '',
  code: '',
  name: '',
  uom: '',
};

export const sampleAssemblyMaterials = [
  {
    id: 'AM1',
    assemblyId: 'A1',
    materialId: 'M1',
    quantity: 10,
    uom: 'kg',
    createdBy: 'system',
    createdDate: '2026-02-10',
  },
  {
    id: 'AM2',
    assemblyId: 'A1',
    materialId: 'M2',
    quantity: 2,
    uom: 'pc',
    createdBy: 'user1',
    createdDate: '2026-02-12',
  },
];

export const initialAssemblyMaterialState = {
  id: '',
  assemblyId: '',
  materialId: '',
  quantity: 0,
  uom: '',
};
