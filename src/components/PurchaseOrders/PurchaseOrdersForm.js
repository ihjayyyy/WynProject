'use client';

import React, { useMemo, useState, useEffect,useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {  POFields, PODetailsColumns, POItemsFields } from './PurchaseOrdersModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import POStyles from './PurchaseOrders.module.scss'
import { InitialData, Create, Get, Update, SubmitForApproval, Approve, Reject, SetStatus } from '@/services/PurchaseOrder';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

export default function PurchaseOrdersForm() {
  const PageName = 'Purchase.Orders';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialOrderId = Number(searchParams.get('id') || 0);
  const initialMode = searchParams.get('mode') || (initialOrderId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/orders');
  const [orderId, setOrderId] = useState(initialOrderId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const [po, setPO] = useState({});
  const [validPO, setvalidPO] = useState(false); 
  const [tableData, setTableData] = useState([]); 
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncludedd] = useState(0);

  useEffect(() => {
    const nextOrderId = Number(searchParams.get('id') || 0);
    const nextMode = searchParams.get('mode') || (nextOrderId ? 'view' : 'edit');
    setOrderId(nextOrderId);
    setMode(nextMode);
  }, [searchParams]);

  // set PO Fields
  const onPOChange = (fieldname,value, formData)=>{
      console.log("field changed.",fieldname,value, formData);
      const poChildren = po.children.map(d => {
          let vat = 0;
          console.log(d)
          const unitCost = Number(d.unitCost || 0);
          const quantity = Number(d.quantity || 0);
          const discount = Number(d.discount || 0);
          let subamount = (unitCost * quantity) - discount;
          let amount = subamount;

                  console.log(formData.vatType)
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

 //load Supplier and Materials 
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
  
 //set PO Data 
 useEffect(() => {
  GetPO();
}, [orderId]);

const GetPO =async ()=>{

    let initPO = {...InitialData}
    if(orderId!==0){
      const getpo = await Get(orderId);
      console.log("get po", getpo)
      initPO =  getpo.data;       
    }
    else{
      setMode("new");
    }
    setPO(initPO) ;
    setvalidPO( Object.keys(initPO).length === 0 ? false:true);
    setTableData({items:initPO.children, deletedItems:initPO.deletedChildren})
}

//Set Form View
const isReadOnly  = useMemo(() => {
  if(validPO)
    return mode === 'view';
  else
    return true;
  }, [po, mode]);

//Set Form Title
const formTitle = useMemo(() => {
    const title =  po &&  po.status ? po.orderNumber : 'New Purchase Order';
   return <div className={POStyles.formTitle}><span>{title}</span>{po.status && <span className={POStyles.status}>{po.status}</span>}</div>
}, [po]);


//Events : When Details Changed
const detailsUpdated = (items, deletedItems) =>{
      console.log("Table has changed")
      console.log(po)
      const totalVAT = items.reduce((total, item) => total + Number(item.vat || 0), 0);
      const totalIncluded = items.reduce((total, item) => total + Number(item.amount || 0), 0);
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

//Set Item Details data
useEffect(() => {
     console.log("initialize PO items")
      updatePOItemFields();
}, [materials,po]);

const updatePOItemFields = ()=>{
    console.log(po)
    var poitems = POItemsFields(materials,po);
    console.log(poitems)
    setPOItemFields(poitems);
  }

const handleSaveConfirm =(entity)=>{
  console.log(entity)
      const title = "Save PO";
      const message = "Are you sure you want to save this PO?";
      const confirmText = "Save";
      const variant="primary";
      const action =()=>async ()=>await save(entity);
      confirmModal.show(title,message,confirmText,variant, action);
}
//Events: Save Form
  const save = async(entity)=>{
    console.log(po)

    //final validate entity

    entity.children = (po.children || []).map((child) => ({
      ...child,
      quantity: Number(child.quantity || 0),
      unitCost: Number(child.unitCost || 0),
      discount: Number(child.discount || 0),
      vat: Number(child.vat || 0),
      amount: Number(child.amount || 0),
    }));
    entity.deletedChildren = po.deletedChildren;
    const updatedPO = {...po, ...entity, vat:po.vat, amount:po.amount}
    console.log("submit")
    console.log(updatedPO)
    
    let res = {};

    updatedPO.id && updatedPO.id <=0 ? res =  await Create(updatedPO) : res = await Update(updatedPO.id,updatedPO);
    console.log(res);
    if (res?.error) {
      toast.error('Failed to save purchase order.');
      return null;
    }
    else {
      toast.success('Purchase Order has been saved.');
      router.push(backPath);  
    }


  }

  const CancelPO = async()=>{
    setMode("cancel PO");
    const res = await SubmitForApproval(id);

  }
  const submitForApproval = async()=>{
    setMode("edit");
    const res = await SubmitForApproval(id);

  }
  const handleCanceEditConfirm =()=>{
      const title = "Cancel Edit";
      const message = "Are you sure you want to cancel editing of this PO?";
      const confirmText = "Cancel Edit";
      const variant="dangaer";
      const action = ()=> ()=>CancelEdit();
      confirmModal.show(title,message,confirmText,variant, action);
}

  const CancelEdit = () =>{
    setMode('view');
  }

  const handleCloseConfirm  =()=>{
      const title = "Close window";
      const message = "Are you sure you want to close this window?";
      const confirmText = "Close";
      const variant="primary";
      const action = ()=> ()=>closeForm();
      confirmModal.show(title,message,confirmText,variant, action);
}

  const closeForm = () =>{
      router.push(backPath);
      return;
  }

  //buttons
  const CreateButton = () =>{
    return isAllowed(PageName, 'w') && !orderId ? <Button type="submit" variant="save">Save</Button> : null;
  }

  const ViewButton = () =>{
    return isAllowed(PageName, 'w') && orderId && mode === 'view' ?
    <div  className={POStyles.buttonsContainer}>
        {po && po.status && po.status.toLowerCase() === 'draft' && <Button onClick={()=>CancelPO()} variant="danger">Cancel PO</Button>}
        <Button onClick={()=>setMode("edit")} variant="save">Edit</Button>
        {po && po.status && po.status.toLowerCase() === 'draft' && <Button onClick={()=>submitForApproval()} variant="save">Submit For Approval</Button>}  
    </div> : null;
  }

  const CRUDButton = () =>{
    return isAllowed(PageName, 'w') && orderId && mode === 'edit' ?
    <div  className={POStyles.buttonsContainer}>
      <Button  variant="outlineDanger" onClick={handleCanceEditConfirm}>Cancel</Button>
       <Button type="submit" variant="save">Save</Button>
    </div>   : null
  }
  

    const ApprovalButton = () =>{
    return isAllowed(PageName, 'a') && orderId && po.status && po.status.toLowerCase() === "submitted"  ?
    <div  className={POStyles.buttonsContainer}>
      <Button  variant="outlineDanger" onClick={tryCancelEditMode}>Reject</Button>
       <Button variant="save">Approve</Button>
    </div> : null
  }

  return isAllowed(PageName, 'r') ? 
  validPO ? 
        <EntityForm
          title={formTitle}
          breadcrumbLabel="Purchase Order"
          icon={<FiList />}
          fields={poFields}
          initialValues={po}

          extraContent={<div className={POStyles.extraContentContainer}>
                          <DetailsTable itemModalHeader="Order Details"  parentId={orderId} 
                                  columns={poDetailsColumns} editable={isAllowed(PageName, 'w') && !isReadOnly} 
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
          onSubmit={handleSaveConfirm}
          backPath={backPath}
          width="100%"
          showSubmitButton={false}
          readOnly={isReadOnly}

          headerActions={
            <div className={POStyles.buttonsContainer}>
              <Button variant="warning" onClick={handleCloseConfirm}>Close</Button>
              <CreateButton/>
              <ViewButton/>
              <CRUDButton/>
              <ApprovalButton/>
            </div>  
          }
        />
        :
        <InvalidPage message='Purchase order not found.'/>
  :
  <InvalidPage/>
}
