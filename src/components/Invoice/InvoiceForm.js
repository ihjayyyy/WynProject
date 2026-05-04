'use client';

import React, { useMemo, useState, useEffect,useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import {  FormFields, TableColumns, ItemsFields } from '../Invoice/InvoiceModels';
import DetailsTable from '../ItemDetails/DetailsTable';
import EntityForm from '../EntityForm/EntityForm';
import EntityStyle from '../EntityForm/EntityContainer.module.scss'
import Button from '../ui/Button/Button';
import { getSuppliers } from '@/services/Supplier';
import { getMaterials } from '@/services/Materials';
import {Get as GetPO, GetOrdersBySupplier} from '@/services/PurchaseOrder';
import { InitialData, Create, Get, Update, ConfirmInvoice, Reject } from '@/services/PurchaseInvoice';
import { useToast } from '../ui/Toast/Toast';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';

export default function PurchaseInvoiceForm() {
  const PageName = 'Purchase.Invoices';
  const { isAllowed } = useContext(AccessContext);
  const confirmModal = useConfirmModal();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialId = Number(searchParams.get('id') || 0);
  const initialMode = searchParams.get('mode') || (initialId ? 'view' : 'edit');
  const [backPath, setBackPath] = useState('/purchase/invoices');
  const [formId, setformId] = useState(initialId);
  const [mode, setMode] = useState(initialMode);
  const [suppliers, setSuppliers] = useState([]); 
  const [materials, setMaterials] = useState([]); 
  const [orders, setOrders] = useState([]); 

  const [formData, setForm] = useState({});
  const [validForm, setvalidForm] = useState(false); 
  const [tableData, setTableData] = useState([]); 
  const [totalExcluded, setTotalExcluded] = useState(0);
  const [totalVAT, setTotalVAT] = useState(0);
  const [totalIncluded, setTotalIncludedd] = useState(0);



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

  const fetchOrders = async(supplierid) => {
          console.log(supplierid)
      const res = await GetOrdersBySupplier(supplierid);
       if(res && !res.error){
            setOrders(res.data);
     }
  };
  
  const loadOrders = async(orderId) =>{
     const res = await GetPO(orderId);
     console.log(res);

      const children = res.data.children.map(d => {
          var orderItem = {
              id: 0,
              parentId: 0,
              poChildId: d.id,
              materialId: d.materialId,
              code: d.code,
              name: d.name,
              uom: d.uom,

              orderQuantity: d.quantity,
              quantity: d.orderBalance,
              previousBalance: d.orderBalance,
              remainingBalance: 0,
              remarks: ""
              };
              return orderItem;
          }
      );

     setForm({...formData, children:children})
     setTableData({...tableData,items:children})
  
  };

    useEffect(() => {
      const nextId = Number(searchParams.get('id') || 0);
      const nextMode = searchParams.get('mode') || (nextId ? 'view' : 'edit');
      setformId(nextId);
      setMode(nextMode);
    }, [searchParams]);

const confirmLoadOrders = async(orderId)=>{

      const title = "Load Purchase Order";
      const message = "Do you want to load items from this Purchase Order?";
      const confirmText = "Yes";
      const variant="primary";
      const action =()=>async ()=>await loadOrders(orderId);
      confirmModal.show(title,message,confirmText,variant, action);
}

  // set Form Fields
  const onFormChange = (fieldname,value, updatedformData)=>{
      console.log("field changed.",fieldname,value, updatedformData);

      if(fieldname === 'supplierId'){
         fetchOrders(value);
      }

      if(fieldname === 'purchaseOrderId'){
         confirmLoadOrders(value);
      }

}
  const formFields = FormFields(suppliers,orders,onFormChange); 
  const childTableColumns = TableColumns;
  const [childFields,setItemFields] = useState(ItemsFields(materials,formData)) 

const GetFormData = async () => {
  let initData = { ...InitialData };
  if (formId !== 0) {
    const getdata = await Get(formId);
    console.log("get form data", getdata);
    initData = getdata.data;

    // Normalize date fields for form input
    if (initData.invoiceDate) {
      const d = new Date(initData.invoiceDate);
      if (!isNaN(d)) {
        initData.invoiceDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
  } else {
    setMode("new");
  }
  setForm(initData);
  setvalidForm(Object.keys(initData).length === 0 ? false : true);
  setTableData({ items: initData.children, deletedItems: initData.deletedChildren });
}  

 //set Form Data 
 useEffect(() => {
  GetFormData();
}, [formId]);

//Set Form View
const isReadOnly  = useMemo(() => {
  if(validForm)
    return mode === 'view';
  else
    return true;
  }, [formData, mode]);

//Set Form Title
const formTitle = useMemo(() => {
    const title =  formData &&  formData.status ? formData.invoiceNumber : 'New Invoice';
   return <div className={EntityStyle.formTitle}><span>{title}</span>{formData.status && <span className={EntityStyle.status}>{formData.status}</span>}</div>
}, [formData]);

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

        const formDataCopy = {...formData};
        formDataCopy.children = items;
        formDataCopy.deletedChildren = deletedItems;
        formDataCopy.vat = totalVAT;
        formDataCopy.amount = totalIncluded;
        
    setForm(formDataCopy);

  }

//Set Item Details data
useEffect(() => {
     console.log("initialize Form items")
      updateItemFields();
}, [materials,formData]);

const updateItemFields = ()=>{
    console.log(formData)
    var items = ItemsFields(materials,formData);
    console.log(items)
    setItemFields(items);
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
    console.log(formData)

    //final validate entity

    entity.children = (formData.children || []).map((child) => ({
      ...child,
      quantity: Number(child.quantity || 0),
      unitCost: Number(child.unitCost || 0),
      discount: Number(child.discount || 0),
      vat: Number(child.vat || 0),
      amount: Number(child.amount || 0),
    }));
    entity.deletedChildren = po.deletedChildren;
    const updatedForm = {...formData, ...entity, vat:formData.vat, amount:formData.amount}
    console.log("submit")
    console.log(updatedForm)
    
    let res = {};
    updatedForm.id = updatedForm.id === null ?? 0;

    updatedForm.id == 0 ? res =  await Create(updatedForm) : res = await Update(updatedForm.id,updatedForm);
    console.log(res);
    if (res?.error) {
      toast.error('Failed to save purchase Invoice.');
      return null;
    }
    else {
      toast.success('Purchase Invoice has been saved.');
      router.push(backPath);  
    }

}

const handleCancelConfirm =()=>{
      const title = "Cancel Invoice";
      const message = "Are you sure you want to cancel this invoice?";
      const confirmText = "Cancel invoice";
      const variant="primary";
      const action = ()=> async ()=>await Cancel();
      confirmModal.show(title,message,confirmText,variant, action);
}

const Cancel = async()=>{
    setMode("view");
    const res = await SetStatus('Cancel', po.id);

    if (res?.error) {
      toast.error('Failed to submit purchase invoice.' );
      return null;
    }
    else {
      toast.success('Purchase Invoice has been cancelled.');
      router.push(backPath);  
    }

}

const handleSubmitConfirm =()=>{
      const title = "Submit for approval";
      const message = "Are you sure you want to this invoice for approval?";
      const confirmText = "Submit";
      const variant="primary";
      const action = ()=> async ()=>await submitForApproval();
      confirmModal.show(title,message,confirmText,variant, action);
}

const submitForApproval = async()=>{
    //setMode("edit");
    const res = await SubmitForApproval(po.id);
    console.log(res)
   if (res?.error) {
      toast.error('Failed to submit purchase invoice.');
      return null;
    }
    else {
      toast.success('Purchase Invoice has been submitted for approval.');
      router.push(backPath);  
    }
}
  const handleCanceEditConfirm =()=>{
      const title = "Cancel Edit";
      const message = "Are you sure you want to cancel editing of this invoice?";
      const confirmText = "Cancel Edit";
      const variant="dangaer";
      const action = ()=> ()=>CancelEdit();
      confirmModal.show(title,message,confirmText,variant, action);
}

const CancelEdit = () =>{
    setMode('view');
}

const handleApproveConfirm =()=>{
      const title = "Approve";
      const message = "Are you sure you want to approve this invoice?";
      const confirmText = "Approve invoice";
      const variant="primary";
      const action = ()=> async ()=>await approve();
      confirmModal.show(title,message,confirmText,variant, action);
}

const approve = async () =>{
    setMode('view');
    const res = await Approve(po.id)

    if (res?.error) {
      toast.error('Failed to approve purchase invoice.');
      return null;
    }
    else {
      toast.success('Purchase Invoice has been approved.');
      router.push(backPath);  
    }
}

const handleInvoiceConfirm =()=>{
      const title = "Order";
      const message = "Are you sure you want to order this invoice?";
      const confirmText = "Confirm Invoice";
      const variant="primary";
      const action = ()=> async ()=>await confirmForm();
      confirmModal.show(title,message,confirmText,variant, action);
}

const confirmForm = async () =>{
    setMode('view');
    const res = await SetStatus('Invoice',formData.id)

    if (res?.error) {
      toast.error('Failed to confirm purchase invoice.');
      return null;
    }
    else {
      toast.success('Purchase invoice has been confirmed.');
      router.push(backPath);  
    }
}

  const handleRejectConfirm =()=>{
      const title = "Reject";
      const message = "Are you sure you want to reject this invoice?";
      const confirmText = "Reject invoice";
      const variant="primary";
      const action = ()=> async ()=>await reject();
      confirmModal.show(title,message,confirmText,variant, action);
}

const reject = async () =>{
    setMode('view');
    const res = await Reject(po.id)

    if (res?.error) {
      toast.error('Failed to reject purchase invoice.');
      return null;
    }
    else {
      toast.success('Purchase Invoice has been rejected.');
      router.push(backPath);  
    }
}

const handleArchiveConfirm =()=>{
      const title = "Archive";
      const message = "Are you sure you want to archive this invoice?";
      const confirmText = "Archive";
      const variant="primary";
      const action = ()=> async ()=>await archive();
      confirmModal.show(title,message,confirmText,variant, action);
}

const archive = async () =>{
    setMode('view');
    const res = await SetStatus('Archive', po.id);

        if (res?.error) {
      toast.error('Failed to archive purchase invoice.');
      return null;
    }
    else {
      toast.success('Purchase Invoice has been archived.');
      router.push(backPath);  
    }
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
    return isAllowed(PageName, 'w') && !formId ? <Button type="submit" variant="save">Save</Button> : null;
}

const ViewButton = () =>{
    return isAllowed(PageName, 'w') && formId && mode === 'view' ?
    <div  className={EntityStyle.buttonsContainer}>
        {formData && formData.status && (formData.status.toLowerCase() === 'draft' || formData.status.toLowerCase() === 'rejected') 
              && <Button onClick={()=>setMode("edit")} variant="save">Edit</Button>}
        {formData && formData.status && formData.status.toLowerCase() === 'draft'  && <Button onClick={handleSubmitConfirm} variant="save">Submit For Approval</Button>}  
    </div> : null;
}

const CancelButton = () =>{
    return isAllowed(PageName, 'w') && formId && mode === 'view' ?
    <div  className={EntityStyle.buttonsContainer}>
        {formData && formData.status && (formData.status.toLowerCase() !== 'invoiced' && formData.status.toLowerCase() !== 'cancelled' && formData.status.toLowerCase() !== 'archived')  
        && <Button onClick={handleCancelConfirm} variant="danger">Cancel Invoice</Button>}
    </div> : null;
}

const CRUDButton = () =>{
    return isAllowed(PageName, 'w') && formId && mode === 'edit' ?
    <div  className={EntityStyle.buttonsContainer}>
      <Button  variant="outlineDanger" onClick={handleCanceEditConfirm}>Cancel</Button>
       <Button type="submit" variant="save">Save</Button>
    </div>   : null
}
  
const ApprovalButton = () =>{
    return isAllowed(PageName, 'a') && formId && formData.status && formData.status.toLowerCase() === "submitted"  ?
    <div  className={EntityStyle.buttonsContainer}>
      {formData && formData.status && (formData.status.toLowerCase() === 'submitted') && mode==='view' && <Button onClick={()=>setMode("edit")} variant="save">Edit</Button>}
       {mode==='view' && <Button  variant="outlineDanger" onClick={handleRejectConfirm}>Reject</Button>}
        {mode==='view' && <Button variant="save" onClick={handleApproveConfirm}>Approve</Button>}
    </div> : null
}

const ConfirmButton = () =>{
    return isAllowed(PageName, 'ww') && formId && formData.status && formData.status.toLowerCase() === "draft"  ?
    <div  className={EntityStyle.buttonsContainer}>
       <Button variant="save" onClick={handleInvoiceConfirm}>Confirm Invoice</Button>
    </div> : null
}

const ArchiveButton = () =>{
    return isAllowed(PageName, 'w') && mode === 'view'  && formId && formData.status && (formData.status.toLowerCase() === "ordered" || formData.status.toLowerCase() === "approved" || formData.status.toLowerCase() === "rejected" || formData.status.toLowerCase() === "cancelled") ?
    <div  className={EntityStyle.buttonsContainer}>
       <Button variant="primary" onClick={handleArchiveConfirm}>Archive</Button>
    </div> : null
}

  return isAllowed(PageName, 'r') ? 
  validForm ? 
        <EntityForm
          title={formTitle}
          breadcrumbLabel="Purchase Order"
          icon={<FiList />}
          fields={formFields}
          initialValues={formData}

          extraContent={<div className={EntityStyle.extraContentContainer}>
                          <DetailsTable itemModalHeader="Invoice Details"  parentId={formId} 
                                  columns={childTableColumns} editable={isAllowed(PageName, 'w') && !isReadOnly} 
                                  itemFields={childFields} data={tableData} onChange={detailsUpdated} />
                          <div className={EntityStyle.summaryContainer}>
                              <div className={EntityStyle.notesContainer}>

                              </div>
                              <div className={EntityStyle.totalContainer}>
                                <div className={EntityStyle.totalLabel}>Total Excluding VAT:</div>
                                <div className={EntityStyle.totalValue}>{totalExcluded.toFixed(2)}</div>
                                <div className={EntityStyle.totalLabel}>Total  VAT:</div>
                                <div className={EntityStyle.totalValue}>{totalVAT.toFixed(2)}</div>
                                <div className={EntityStyle.totalLabel}>Total  Including VAT:</div>
                                <div className={`${EntityStyle.totalValue} ${EntityStyle.highlight}`}>{totalIncluded.toFixed(2)}</div>
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
            <div className={EntityStyle.buttonsContainer}>
              <Button variant="warning" onClick={handleCloseConfirm}>Close</Button>
              <CreateButton/>
              <CancelButton/>
              <ViewButton/>
              <CRUDButton/>
              <ConfirmButton/>
              <ArchiveButton/>
            </div>  
          }
        />
        :
        <InvalidPage message='Purchase Invoice not found.'/>
  :
  <InvalidPage/>



}