// export const FormFields = [
//  { name: 'code', label: 'Code', span: 'span2' },
//  { name: 'name', label: 'Name', span: 'span2' },
//  { name:'orderDate', label:'Order Date', span:'span2'},
//  { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions, searchable: true, span: 'span2', 
//     onChange: (val, values, setValues) => {
//        const found = sampleSuppliers.find((s) => s.id === val);
//        if (found) setValues({ ...values, supplier: { id: found.id, name: found.name } });
//      } },
//   { name:'supplierCode', label:'Supplier Code', span:'span2', readOnly:true },
//   { name:'contactPerson', label:'Contact Person', span:'span2'},
//   { name:'contactNumber', label:'Contact Number', span:'span2'},
//   { name:'address', label:'Address', span:'span2'},
//   { name:'email', label:'Email', span:'span2'},
//   { name:'email', label:'Email', span:'span2'},
//   { name:'supplierReferenceNo', label:'Supplier PO', span:'span2'},
//   { name:'estimatedDeliveryDate', label:'Estimated Delivery', span:'span2'},  
//   { name:'estimatedDeliveryDate', label:'Estimated Delivery', span:'span2'},    

// ];



export const PODetailsColumns = [
    { header: 'Material', key: 'material', width: '260px', render: (it) => {
      if (!it || it.isTotalRow) return '';
      return (
        <div className={pmStyles.materialCell}>
          <div className={pmStyles.materialCode}>{it.code || ''}</div>
          <div className={pmStyles.materialName}>{it.name || ''}</div>
        </div>
      );
    } },
    { header: 'Unit Cost', key: 'unitCost', align: 'right', width: '120px', render: (it) => (((it && it.isTotalRow) || it.unitCost === '' || it.unitCost == null) ? '' : Number(it.unitCost).toLocaleString()) },
    { header: 'UoM', key: 'uom', width: '80px' },
    { header: 'Qty', key: 'quantity', align: 'right', width: '80px' },
    { header: 'Amount', key: 'amount', align: 'right', width: '140px', render: (it) => Number(it.amount || 0).toLocaleString() }
];