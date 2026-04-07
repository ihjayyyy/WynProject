'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {  PODetailsColumns } from './OrderModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialOrderState, orders as sampleOrders } from './ordersData';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import * as Yup from "yup";


export default function OrdersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const [suppliers, setSuppliers] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const [supplierOptions, setSupplierOptions] = useState([]); 
  const [FormFields, setFormFields] = useState([]); 
  const initialValues = useMemo(() => {
    if (!orderId) return initialOrderState;
    const selected = sampleOrders.find((r) => r.id === orderId || r.code === orderId);
    return selected || initialOrderState;
  }, [orderId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(orderId && sampleOrders.some((r) => r.id === orderId || r.code === orderId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [orderId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!orderId) return 'New Purchase Order';
    if (isEditMode) return 'Edit Purchase Order';
    return 'View Order';
  }, [orderId, isEditMode]);

  
  
  useEffect(() => {
     const fetchSupplier = async() => {
     console.log('Load Suppliers');
         const res = await getSuppliers();
             console.log(res);
        if(res && !res.error){
          setSuppliers(res.data);
          var options = res.data.map((s) => ({ label: s.name, value: s.id }));
          setSupplierOptions(options);
          
        }
  };

  const fetchMaterials = async() => {
    const res = await getMaterials();
     if(res && !res.error){
          setMaterials(res.data);
          console.log(res)
    }
  }
   fetchSupplier();
   fetchMaterials();
  },[]);

  // useEffect(() => {
      


  //   setFormFields(fields);
  
  // },[suppliers]);
  const addItem = () =>{
      console.log('add item')
  };
    const canceladdItem = () =>{
      console.log('cancel item')
  };

  const poDetails = [];
  const poDetailsColumns = PODetailsColumns;

 const fields = [
    { name:'supplierCode', label:'Supplier Code', span:'span1', readOnly:true },
    { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions, searchable: true, span: 'span3', 
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
     

     ,];

    const orderItems = [
            {name:'id', label:'id', type:'number',  hidden:true, initialvalue:0},
            {name:'material', label:'Material', type:'select', options:materials.map(({ id, name }) =>  ({ value:id, name:name })), readonly:false, 
              initialvalue:"",
               validator : Yup.string().required(`Material is required`),
               onChange : (item, updateField, fields) => {

                  const material = materials.find(a=>a.id == item.value)
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
    ];
 
  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Purchase Order"
      icon={<FiList />}
      fields={fields}
      initialValues={initialValues}
      extraContent={<DetailsTable itemModalHeader="Order Details"  parentId={orderId} columns={poDetailsColumns} editable={!isReadOnly} itemFields={orderItems} items={poDetails || []} onChange={(updated, deleted) => {
              setChildrenState(updated || []);
              if (deleted) setDeletedChildrenState((prev) => dedupeDeleted(deleted || []));
              // debug: log full proposal form data when materials/scopes change
              try {
                const filteredChildren = (updated || []).filter((c) => !c || !c.__isScope);
                console.log('Proposal form data (debug):', {
                  ...initialValues,
                  children: filteredChildren,
                  deletedChildren: dedupeDeleted(deleted || []),
                });
              } catch (err) {
                console.log('Failed to log proposal data', err);
              }
            }} />}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        // Create
        if (!orderId) {
          const nextNumber = (sampleOrders || []).reduce((max, item) => {
            const parts = (item.code || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newCode = `ORD-${String(nextNumber).padStart(3, '0')}`;
          const newId = String((sampleOrders || []).length + 1);
          const newItem = {
            ...values,
            id: newId,
            code: newCode,
            supplier: values.supplier || { id: values.supplierId || '', name: '' },
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          sampleOrders.push(newItem);
          console.log('create')
          return '/purchase/orders';
        }

        // Update
        const idx = (sampleOrders || []).findIndex((i) => i.id === orderId || i.code === orderId);
        const updatedItem = {
          ...values,
          id: orderId,
          supplier: values.supplier || { id: values.supplierId || '', name: '' },
          updatedBy: 'You',
          updatedDate: now,
        };
        if (idx !== -1) sampleOrders[idx] = updatedItem;
        return '/purchase/orders';
      }}
      backPath="/purchase/orders"
      width="100%"
      showSubmitButton={false}
      readOnly={isReadOnly}

      headerActions={
        !orderId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : (
          <>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
              ) : null
            ) : (
              <>
                <Button
                  variant="outlineDanger"
                  onClick={() => {
                    if (mode === 'edit') {
                      router.push(`/purchase/orders/ordersform?id=${orderId}`);
                      return;
                    }
                    setIsEditModeLocal(false);
                  }}>
                  Cancel
                </Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
  );
}
