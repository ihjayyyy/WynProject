import * as Yup from "yup";

 export const POFields =(suppliers) =>([
    { name:'supplierCode', label:'Supplier Code', span:'span1', readOnly:true },
    { name: 'supplierId', label: 'Supplier', type: 'select', options: suppliers.map((s) => ({ label: s.name, value: s.id })), searchable: true, span: 'span3', 
        onChange: (val, values, setValues) => {
          console.log(suppliers)
          const found = suppliers.find((s) => s.id === val);
          console.log(found)
          if (found) setValues({ ...values, supplierCode:found.code, 
            address:found.address,
            contactPerson:found.contactPerson,
            email:found.email,
            terms:found.terms,
            contactNumber:found.contactNumber,
            supplier: { id: found.id, name: found.name } });
        } },
      { name: 'spacer-2', type: 'spacer', span: 'span2' },
      { name:'orderDate', label:'Order Date', type:'date', span:'span2'},
      { name:'address', label:'Address', span:'span4'},
        { name: 'spacer-3', type: 'spacer', span: 'span2' },
      { name:'supplierReferenceNo', label:'Supplier PO', span:'span2'},
      { name:'contactPerson', label:'Contact Person', span:'span4'},
      { name: 'spacer-4', type: 'spacer', span: 'span2' },
      { name:'terms', label:'Terms',  span:'span2'}, 
       { name:'contactNumber', label:'Contact Number',  span:'span2'},
        { name:'email', label:'Email', span:'span2'},
       { name: 'spacer-5', type: 'spacer', span: 'span2' },
      { name:'estimatedDeliveryDate', label:'Estimated Delivery', type:'date', span:'span2'}, 
     

     ,]);


export const PODetailsColumns = [
    { header: 'Material', key: 'material', width: '200px', render: (it) =>{ console.log(it); return(it.code + '-' + it.name)}},
    { header: 'Unit Cost', key: 'unitcost', align: 'right', width: '120px', render: (it) => (Number(it.unitcost).toFixed(2)) },
    { header: 'UoM', key: 'uom', width: '80px' },
    { header: 'Qty', key: 'quantity', align: 'right', width: '80px' },
    { header: 'Discount', key: 'discount', align: 'right', width: '80px', render: (it) => (Number(it.discount).toFixed(2))},
    { header: 'Amount', key: 'amount', align: 'right', width: '140px', render: (it) => Number(it.amount || 0).toFixed(2) }
];

 export  const POItemsFields = (materials) =>([
            {name:'id', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'parentId', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'material', label:'Material', type:'select', options:materials.map(({ id, name }) =>  ({ value:id, name:name })), readonly:false, 
              initialvalue:"",
               validator : Yup.string().required(`Material is required`),
               onChange : (item, updateField, fields) => {

                  const material = materials.find(a=>a.id == item.value)
                  console.log(material)
                  const itemfields = [...fields]

                  updateField("unitcost", material.unitCost);
                  updateField("code", material.code);
                  updateField("name", material.name);
                  updateField("uom", material.unitOfMeasure);
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const discount = itemfields.find(a=>a.name === 'discount');
                  const amount = (quantity.value * material.unitCost) - discount.value;
                  updateField("amount", amount)

               },
               
            },
            {name:'code', label:'Code', type:'text',  hidden:true,},
            {name:'name', label:'Name', type:'text',  hidden:true,},
            {name:'quantity', label:'Quantity', type:'number',  readonly:false, initialvalue:1,
             validator : Yup.number().required(`Quantity is required`)
                                     .typeError("Quantity must be a number")
                                     .positive("Quantity must be greater than 0.")
                                     .min(1, "Quantity must be greater than 0."),
              onChange : (item, updateField, fields) => {
                  
                  const itemfields = [...fields]
                  const unitcost = itemfields.find(a=>a.name === 'unitcost');
                  const discount = itemfields.find(a=>a.name === 'discount');

                  const amount = (item.value * unitcost.value) - discount.value;
                  updateField("amount", amount)
               },                  
            },
            {name:'unitcost', label:'Unit Cost', type:'currency',  readonly:false, 
              validator : Yup.number().required(`Unit Cost is required`).typeError("Unit Cost must be a number"),
              initialvalue:0,
              onChange : (item, updateField, fields) => {
                  
                  const itemfields = [...fields]
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const discount = itemfields.find(a=>a.name === 'discount');

                  const amount = (item.value * quantity.value) - discount.value;
                  updateField("amount", amount)
               },         
            },
            {name:'uom', label:'Unit of Measure', type:'text',  readonly:true,},
            {name:'discount', label:'Discount', type:'currency',  readonly:false,  validator : Yup.number().required(`Discount is required`),
              initialvalue:0,
              onChange : (item, updateField, fields) => {
                  
                  const itemfields = [...fields]
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const unitcost = itemfields.find(a=>a.name === 'unitcost');

                  const amount = (unitcost.value * quantity.value) - item.value;
                  updateField("amount", amount)
               }, 
            },
            {name:'amount', label:'Amount', type:'currency',  readonly:true, initialvalue:0, validator : Yup.number().required(`Amount is required`)},
    ]);