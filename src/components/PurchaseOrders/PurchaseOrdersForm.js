'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {  POFields, PODetailsColumns, POItemsFields } from './PurchaseOrdersModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import * as Yup from "yup";
import { initAsyncCompiler } from 'sass';
import POStyles from './PurchaseOrders.module.scss'
import { InitialData, Create, Get } from '@/services/purchaseorder';
import { useToast } from '../ui/Toast/Toast';

export default function PurchaseOrdersForm() {
  const router = useRouter();
    const toast = useToast();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || 0);
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const [suppliers, setSuppliers] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const [po, setPO] = useState({}); 
  const [tableData, setTableData] = useState([]); 
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncludedd] = useState(0);
  // set PO Fields
  const onPOChange = (fieldname,value, formData)=>{
      console.log("field changed.",fieldname,value, formData);
      const poChildren = po.children.map(d => {
                let vat = 0;
                console.log(d)
                let subamount = (d.unitcost * d.quantity) - d.discount;
                let amount = subamount;

                  switch(formData.vatType){
                     case "included":
                        vat = Math.round((subamount - (subamount / 1.12)) * 100) / 100;
                        break;
                     case "notincluded":
                        vat = Math.round(subamount * 0.12 * 100) / 100;
                        amount = subamount + vat;
                        console.log(vat,amount)
                        break;
                     case "nonvat":
                        vat = 0;
                        break;
                     default:
                        vat = 0;
                        break;
                  }
              console.log(vat,amount)
            return {...d, vat:vat,amount:amount}
      }
      );
      console.log(poChildren)
      setPO({...po,...formData, children:poChildren})
      setTableData({...tableData,items:poChildren})
  }

  const poFields = POFields(suppliers,onPOChange); 
  const poDetailsColumns = PODetailsColumns;
  const [poItemFields,setPOItemFields] = useState(POItemsFields(materials,po)) 
  const [sampleOrders, setSampleOrders] = useState([]);
  
 //set PO Data 
 useEffect(() => {
  GetPO();
}, [orderId]);

const GetPO =async (id)=>{

    let initPO = {...InitialData}
    if(orderId!==0){
      const getpo = await Get(orderId);
      console.log("get po", getpo)
        initPO =  getpo.data;
      }
    setPO(initPO) ;
    setTableData({items:initPO.children, deletedItems:initPO.deletedChildren})
}

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
        if(res && !res.error){
          setSuppliers(res.data);          
        }

  };

  const fetchMaterials = async() => {
    const res = await getMaterials();
     if(res && !res.error){
          setMaterials(res.data);
    }
  }
   fetchSupplier();
   fetchMaterials();
  },[]);


  const detailsUpdated = (items, deletedItems) =>{
      console.log("Table has changed")
      console.log(po)
      const totalVAT = items.reduce((total, item) => total + item.vat, 0);
      const totalIncluded = items.reduce((total, item) => total + item.amount, 0);
      const totalexcluded = totalIncluded - totalVAT;
      //calculate VAT
      setTotalExcluded(totalexcluded);
      setTotalVAT(totalVAT);
      setTotalIncludedd(totalIncluded);

        const poCopy = {...po};
        poCopy.children = items;
        poCopy.deletedChildren = deletedItems;
        poCopy.vat = totalVAT;
        poCopy.amount = totalIncluded;
        
    setPO(poCopy);

  }

  const updatePOItemFields = ()=>{
    console.log(po)
    var poitems = POItemsFields(materials,po);
    console.log(poitems)
    setPOItemFields(poitems);
  }

   useEffect(() => {
     console.log("initialize PO items")
      updatePOItemFields();
}, [materials,po]);



  const submit = async(entity)=>{
    console.log(entity)
    entity.children = po.children;
    entity.deletedChildren = po.deletedChildren;
    const updatedPO = {...po, ...entity}
    console.log("submit")
    console.log(updatedPO)
   const res =  await Create(updatedPO);

    if (res?.error) {
      toast.error('Failed to save proposal');
      return null;
    }
    else {
      toast.success('Proposal saved');
      return '/purchase/orders';  
    }


  }
 
  return (
    <div>
    <EntityForm
      title={<div className={POStyles.formTitle}><span>PO-{po.id}</span><span className={POStyles.status}>{po.status}</span></div>}
      breadcrumbLabel="Purchase Order"
      icon={<FiList />}
      fields={poFields}
      initialValues={po}
      extraContent={<div className={POStyles.extraContentContainer}>
                      <DetailsTable itemModalHeader="Order Details"  parentId={orderId} 
                              columns={poDetailsColumns} editable={!isReadOnly} 
                              itemFields={poItemFields} data={tableData} onChange={detailsUpdated} />
                      <div className={POStyles.summaryContainer}>
                          <div className={POStyles.notesContainer}>

                          </div>
                          <div className={POStyles.totalContainer}>
                             <div className={POStyles.totalLabel}>Total Excluding VAT:</div>
                             <div className={POStyles.totalValue}>{totalExcluded.toFixed(2)}</div>
                             <div className={POStyles.totalLabel}>Total  VAT:</div>
                             <div className={POStyles.totalValue}>{totalVAT.toFixed(2)}</div>
                             <div className={POStyles.totalLabel}>Total  Including VAT:</div>
                             <div className={`${POStyles.totalValue} ${POStyles.highlight}`}>{totalIncluded.toFixed(2)}</div>
                          </div>
                      </div>
        </div>
            
          }
      onSubmit={submit}
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
    </div>

  );
}
