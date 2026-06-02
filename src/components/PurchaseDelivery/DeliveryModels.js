import * as Yup from "yup";
import { getRacksByMaterialId } from '@/services/MaterialInventory';

 export const FormFields =(suppliers,orders, onFieldhanged) =>([
    { name: 'supplierId', label: 'Supplier', type: 'select', options: suppliers.map((s) => ({ label: s.name, value: s.id })), 
      searchable: true, span: 'span4', 
        onChange: (val, values, setValues) => {
          const found = suppliers.find((s) => s.id === val);
               if (!found) {
                  const clearedValues = {
                     ...values,
                     code: '',
                     name: ''
                  };
                  setValues(clearedValues);
                  onFieldhanged("supplierId", val, clearedValues);
                  return;
               }
          const valuesCopy = { ...values, 
            code:found.code,
            name:found.name
         };
          if (found) setValues(valuesCopy);
         onFieldhanged("supplierId", val, valuesCopy); 
      }},
    { name: 'code', hidden:true },
    { name: 'name', hidden:true },
    { name: 'spacer-1', type: 'spacer', span: 'span2' },
    { name:'deliveryDate', label:'Request Date', type:'date', span:'span2'},
    { name:'orderId', label:'Order Number', type:'select', options: orders.map((s) => ({ label: s.orderNumber, value: s.id })), searchable: true, span:'span2',
        onChange: (val, values, setValues) => {
          const found = orders.find((s) => s.id === val);
               if (!found) {
                  const clearedValues = {
                     ...values,
                     orderNumber: '',
                  };
                  setValues(clearedValues);
                  onFieldhanged("orderId", val, clearedValues);
                  return;
               }
          const valuesCopy = { ...values, 
            orderNumber:found.orderNumber,
         };
          if (found) setValues(valuesCopy);
         onFieldhanged("orderId", val, valuesCopy); 
      }
    },
    { name:'requestNumber', label:'Request Number', type:'textbox', span:'span2'},

    { name: 'spacer-4', type: 'spacer', span: 'span2' },
    { name:'supplierDRNumber', label:'Supplier DR', type:'textbox', span:'span2'},
    { name:'receivedBy', label:'Received By', type:'textbox', span:'span4'},
    { name: 'orderNumber', hidden:true },
 ]);

 export const TableColumns = [
    { header: 'Material', key: 'material', width: '200px', render: (it) =>{return(it.code + ' - ' + it.name)}},
   //  { header: 'Rack', key: 'rack', width: '120px', render: (it) =>{return(it.rackCode || it.rackName || it.rack?.code || '')}},
    { header: 'UOM', key: 'uom', width: '60px', render: (it) =>{return(it.uom)}},
    { header: 'Order Qty', key: 'orderQuantity', align: 'right', width: '80px', render: (it) => (it.orderQuantity).toFixed(0) },
    { header: 'Previous Bal', key: 'previousBalance', align: 'right', width: '80px', render: (it) => (it.previousBalance).toFixed(0) },
    { header: 'Delivered Qty', key: 'quantity', align: 'right', width: '80px', render: (it) => (it.quantity).toFixed(0)},
    { header: 'Remaining Bal', key: 'remainingBalance', align: 'right', width: '80px', render: (it) => (it.remainingBalance).toFixed(0)},
    { header: 'Remarks', key: 'remarks', width: '200px', render: (it) =>{return(it.remarks)}},
 ];

 export  const ItemsFields  = (materials,dr) =>([
           {name:'id', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'parentId', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'materialId', label:'Material', type:'select', options:materials.map(({ id, name }) =>  ({ value:id, name:name })), readonly:false, 
                     hydrateOnOpen: true,
              initialvalue:"",
               validator : Yup.string().required(`Material is required`),
                      onChange : async (item, updateField, fields) => {
                  const material = materials.find(a => a.id == item.value)
                           if (!material) {
                              updateField("code", "");
                              updateField("name", "");
                              updateField("uom", "");
                                             const rackField = (fields || []).find((f) => f.name === 'rackId');
                                             if (rackField) {
                                                rackField.options = [];
                                             }
                                             updateField("rackId", 0);

                              return;
                           }
                  updateField("code", material.code);
                  updateField("name", material.name);
                  updateField("uom", material.purchaseUnitOfMeasure);
                           try {
                              const res = await getRacksByMaterialId(material.id);
                              const rackOptions = (Array.isArray(res?.data) ? res.data : []).map((entry) => ({
                                 value: entry?.rack?.id || 0,
                                 name: entry?.rack?.code || entry?.rack?.name || '',
                                 code: entry?.rack?.code || '',
                                 rackName: entry?.rack?.name || '',
                                 isDefault: Boolean(entry?.isDefault),
                              })).filter((r) => Number(r.value) > 0);

                              const rackField = (fields || []).find((f) => f.name === 'rackId');
                              if (rackField) {
                                 rackField.options = rackOptions.map((r) => ({
                                    ...r,
                                    label: r.label || r.name || r.code || '',
                                 }));
                              }

                              const currentRackId = Number(rackField?.value || 0);
                              const hasCurrentRack = rackOptions.some((r) => Number(r.value) === currentRackId);
                              const defaultRack = rackOptions.find((r) => r.isDefault) || null;

                              if (hasCurrentRack) {
                                 updateField("rackId", currentRackId);
                              } else if (defaultRack) {
                                 updateField("rackId", defaultRack.value);
                              } else {
                                 updateField("rackId", 0);
                              }
                           } catch (error) {
                              const rackField = (fields || []).find((f) => f.name === 'rackId');
                              if (rackField) {
                                 rackField.options = [];
                              }
                              updateField("rackId", 0);

                           }

               },              
            },
                  {name:'rackId', label:'Rack', type:'select', options:[], readonly:false,
                     onChange : (item, updateField, fields) => {
                        const rackField = (fields || []).find((f) => f.name === 'rackId');
                        const selectedRack = rackField && Array.isArray(rackField.options)
                           ? rackField.options.find((r) => String(r.value) === String(item.value))
                           : null;

                        if (!selectedRack) {
                           updateField("rackCode", "");
                           updateField("rackName", "");
                           return;
                        }
                     }
                  },
            {name:'code', label:'Code', type:'text',  hidden:true,},
            {name:'name', label:'Name', type:'text',  hidden:true,},
            {name:'orderQuantity', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'previousBalance', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'remainingBalance', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'quantity', label:'Quantity', type:'number',  readonly:false, initialvalue:1,
                         validator : Yup.number().required(`Quantity is required`)
                                                 .typeError("Quantity must be a number")
                                                 .positive("Quantity must be greater than 0.")
                                                 .min(1, "Quantity must be greater than 0."),
                          onChange : (item, updateField, fields) => {
                              console.log("quantity changed:",item.value,fields)

                               const previousBalance = fields.find(a=>a.name === 'previousBalance');
                              //calculate remaining balance
                              const bal = previousBalance.value > 0 ? previousBalance.value - item.value : item.value
                              updateField("remainingBalance", bal);
                           },                  
                        },
            {name:'uom', label:'Unit of Measure', type:'text',  readonly:true,},
            {name:'remarks', label:'Remarks', type:'text', },
 ]);