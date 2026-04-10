'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {  POFields, PODetailsColumns, POItemsFields } from './OrderModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialOrderState, orders as sampleOrders } from './ordersData';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import * as Yup from "yup";
import { initAsyncCompiler } from 'sass';


export default function OrdersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const [suppliers, setSuppliers] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const [po, setPO] = useState([]); 
  const [tableData, setTableData] = useState([]); 

  // set PO Fields
  const poFields = POFields(suppliers); 
  const poDetailsColumns = PODetailsColumns;
  const poItemFields = POItemsFields(materials) 

 //set PO Data 
 useEffect(() => {

  const initializePO = () =>{
    const initPO = {
        "name": "",
        "code": "",
        "children": [
          // {
          //   "id": 0,
          //   "parentId": 0,
          //   "materialId": 0,
          //   "code": "",
          //   "name": "",
          //   "uom": "",
          //   "unitCost": 0,
          //   "quantity": 0,
          //   "vat": 0,
          //   "discount": 0,
          //   "amount": 0
          // }
        ],
        "deletedChildren": [
          // {
          //   "id": 0,
          //   "parentId": 0,
          //   "materialId": 0,
          //   "code": "",
          //   "name": "",
          //   "uom": "",
          //   "unitCost": 0,
          //   "quantity": 0,
          //   "vat": 0,
          //   "discount": 0,
          //   "amount": 0
          // }
        ],
        "orderDate": new Date(),
        "supplierId": 0,
        "supplierCode": "",
        "supplierName": "",
        "contactNumber": "",
        "address": "",
        "contactPerson": "",
        "email": "",
        "supplierReferenceNo": "",
        "estimatedDeliveryDate": new Date(),
        "amount": 0,
        "discount": 0,
        "vat": 0,
        "totalAmount": 0
      }

      if(!orderId){
        setPO(initializePO());
        setTableData({items:po.children, deletedItems:po.deletedChildren})
      }
      else{
        //call api
          // fetch(`/api/user/${userId}`)
          //   .then(res => res.json())
          //   .then(data => setUserData(data));
        setPO(initializePO());
        setTableData({items:po.children, deletedItems:po.deletedChildren})
      }
  };
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




 
  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Purchase Order"
      icon={<FiList />}
      fields={poFields}
      initialValues={po}
      extraContent={<DetailsTable itemModalHeader="Order Details"  parentId={orderId} 
                 columns={poDetailsColumns} editable={!isReadOnly} 
                 itemFields={poItemFields} data={tableData} onChange={(updated, deleted) => {

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
