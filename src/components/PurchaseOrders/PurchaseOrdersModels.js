import * as Yup from "yup";

 export const POFields =(suppliers,onFieldhanged) =>([
    { name:'code', label:'Supplier Code', span:'span1', readOnly:true },
    { name: 'supplierId', label: 'Supplier', type: 'select', options: suppliers.map((s) => ({ label: s.name, value: s.id })), searchable: true, span: 'span3', 
        onChange: (val, values, setValues) => {
          const found = suppliers.find((s) => s.id === val);
               if (!found) {
                  const clearedValues = {
                     ...values,
                     supplierCode: '',
                     address: '',
                     contactPerson: '',
                     email: '',
                     terms: '',
                     contactNumber: '',
                     vatType: 'included',
                     supplierName: '',
                     code: '',
                     name: ''
                  };
                  setValues(clearedValues);
                  onFieldhanged("supplierId", val, clearedValues);
                  return;
          }
          const valuesCopy = { ...values, 
            supplierCode:found.code, 
            address:found.address,
            contactPerson:found.contactPerson,
            email:found.email,
            terms:found.terms,
            contactNumber:found.contactNumber,
            vatType:found.vatType ? found.vatType : "included",
            supplierName:found.supplierName,
            code:found.code,
            name:found.name
         };
          if (found) setValues(valuesCopy);
         onFieldhanged("supplierId", val, valuesCopy); 
      }},
      { name: 'supplierName', hidden:true },
      { name: 'code', hidden:true },
      { name: 'name', hidden:true },
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
        { name:'vatType', label:'VAT', type:'select', span:'span2', options: [{label:'Included', value:"included"},{label:'Not Included', value:"notincluded"}, {label:'NON-VAT', value:"nonvat"}],
             onChange: (val, values, setValues) => {
               onFieldhanged("vatType", val, values); 
             }
      }, 
      { name:'estimatedDeliveryDate', label:'Estimated Delivery', type:'date', span:'span2'}, 
     ,]);


export const PODetailsColumns = [
    { header: 'Material', key: 'material', width: '200px', render: (it) =>{return(it.code + ' - ' + it.name)}},
    { header: 'Unit Cost', key: 'unitCost', align: 'right', width: '120px', render: (it) => (Number(it.unitCost).toFixed(2)) },
    { header: 'Qty', key: 'quantity', align: 'right', width: '80px', render: (it) => (it.quantity).toFixed(0) + ' ' + it.uom},
    { header: 'Discount', key: 'discount', align: 'right', width: '80px', render: (it) => (Number(it.discount).toFixed(2))},
    { header: 'VAT', key: 'vat', align: 'right', width: '140px', render: (it) => Number(it.vat || 0).toFixed(2) },
    { header: 'Amount', key: 'amount', align: 'right', width: '140px', render: (it) => Number(it.amount || 0).toFixed(2) }
];
//
 export  const POItemsFields  = (materials,po) =>([
            {name:'id', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'parentId', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'materialId', label:'Material', type:'select', options:materials.map(({ id, name }) =>  ({ value:id, name:name })), readonly:false, 
              initialvalue:"",
               validator : Yup.string().required(`Material is required`),
               onChange : (item, updateField, fields) => {

                  const material = materials.find(a => a.id == item.value)
                  console.log(material)
                  const itemfields = [...fields]

                           if (!material) {
                              updateField("unitCost", 0);
                              updateField("code", "");
                              updateField("name", "");
                              updateField("uom", "");
                              updateField("vat", 0);
                              updateField("amount", 0);
                              return;
                           }

                  updateField("unitCost", material.purchasePrice);
                  updateField("code", material.code);
                  updateField("name", material.name);
                  updateField("uom", material.purchaseUnitOfMeasure);
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const discount = itemfields.find(a=>a.name === 'discount');
                           const quantityValue = Number(quantity?.value || 0);
                           const discountValue = Number(discount?.value || 0);
                           const subamount = (quantityValue * Number(material.purchasePrice || 0)) - discountValue;
                  
                  let vat = 0;
                  let amount = subamount;
                  const vatType = po && po.vatType ? po.vatType : "";
                  switch(vatType){
                     case "included":
                        vat = Math.round((subamount - (subamount / 1.12)) * 100) / 100;
                        break;
                     case "notincluded":
                        vat = Math.round(subamount * 0.12 * 100) / 100;
                        amount = subamount + vat;
                        break;
                     case "nonvat":
                        vat = 0;
                        break;
                     default:
                        vat = 0;
                        break;
                  }


                  updateField("vat", vat);
                  updateField("amount", amount);


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
                  const unitcost = itemfields.find(a=>a.name === 'unitCost');
                  const discount = itemfields.find(a=>a.name === 'discount');

                  const subamount = (item.value * unitcost.value) - discount.value;
                  let amount = subamount;
                   let vat = 0;

                  const vatType = po && po.vatType ? po.vatType : "";
                  switch(vatType){
                     case "included":
                        vat = Math.round((subamount - (subamount / 1.12)) * 100) / 100;
                        break;
                     case "notincluded":
                        vat = Math.round(subamount * 0.12 * 100) / 100;
                        amount = subamount + vat;
                     break;
                     case "nonvat":
                        vat = 0;
                        break;
                     default:
                        vat = 0;
                        break;
                  }
                  updateField("vat", vat);
                  updateField("amount", amount)
               },                  
            },
            {name:'unitCost', label:'Unit Cost', type:'currency',  readonly:false, 
              validator : Yup.number().required(`Unit Cost is required`).typeError("Unit Cost must be a number"),
              initialvalue:0,
              onChange : (item, updateField, fields) => {
                  
                  const itemfields = [...fields]
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const discount = itemfields.find(a=>a.name === 'discount');

                 const subamount = (item.value * quantity.value) - discount.value;
                  let amount = subamount;
                   let vat = 0;
                  const vatType = po && po.vatType ? po.vatType : "";
                  switch(vatType){
                     case "included":
                        vat = Math.round((subamount - (subamount / 1.12)) * 100) / 100;
                        break;
                     case "notincluded":
                        vat = Math.round(subamount * 0.12 * 100) / 100;
                        amount = subamount + vat;
                     break;
                     case "nonvat":
                        vat = 0;
                        break;
                     default:
                        vat = 0;
                        break;
                  }
                  updateField("vat", vat);
                  updateField("amount", amount)
               },         
            },
            {name:'uom', label:'Unit of Measure', type:'text',  readonly:true,},
            {name:'discount', label:'Discount', type:'currency',  readonly:false,  validator : Yup.number().required(`Discount is required`),
              initialvalue:0,
              onChange : (item, updateField, fields) => {
                  
                  const itemfields = [...fields]
                  const quantity = itemfields.find(a=>a.name === 'quantity');
                  const unitcost = itemfields.find(a=>a.name === 'unitCost');

                  const subamount = (quantity.value * unitcost.value) - item.value;
                  let amount = subamount;
                   let vat = 0;
                  const vatType = po && po.vatType ? po.vatType : "";
                  switch(vatType){
                     case "included":
                        vat = Math.round((subamount - (subamount / 1.12)) * 100) / 100;
                        break;
                     case "notincluded":
                        vat = Math.round(subamount * 0.12 * 100) / 100;
                        amount = subamount + vat;
                    break;
                     case "nonvat":
                        vat = 0;
                        break;
                     default:
                        vat = 0;
                        break;
                  }
                  updateField("vat", vat);
                  updateField("amount", amount)
               }, 
            },
            {name:'vat', label:'VAT (' + po.vatType   + ")", type:'currency',  readonly:true, initialvalue:0, validator : Yup.number().required(`Amount is required`)},
            {name:'amount', label:'Amount', type:'currency',  readonly:true, initialvalue:0, validator : Yup.number().required(`Amount is required`)},
    ]);