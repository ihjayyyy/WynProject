
import React, { useMemo, useState,useEffect } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from './itemModal'; 
import detailStyle from "./DetailsTable.module.scss" 
import * as Yup from "yup";
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Button from '../ui/Button/Button';

export default function DetailsTable({itemModalHeader, columns = [], data  = {items:[],deletedItems:[]}, itemFields=[], onChange, editable = false, emptyMessage='No current items', parentId = 0}) {
    
    const [items, setItems] = useState([]);
    const [deleteditems, setDeletedItems] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalFields, setModalFields] = useState(itemFields);
    const [modalMode, setModalMode] = useState("new");
    const [itemIndex, setItemIndex] = useState(-1);

      useEffect(()=>{
        console.log("use effect item fields")
        const localizeItemFields = itemFields.map((item)=>({...item}));
        setModalFields(localizeItemFields);
      },[itemFields])


      useEffect(() => {
        const mapped = (data.items || []).map((item) => ({ ...item}));
        const deletedItems = (data.deletedItems || []).map((item) => ({ ...item}));
        setItems(mapped);
        setDeletedItems(deletedItems);
      }, [data]);
    

      const initializeItem = (data) => {
        console.log(modalFields)
       const initializedFields = modalFields.map((item)=>{
           const keyValue = data ? data.find(k => k.key === item.name) : null; 
           const value = keyValue ? keyValue.value : item.initialvalue && item.initialvalue !== "undefined" ? item.initialvalue : "";
        
           let i = {...item};
           switch(item.type){
            case "text" || "select" :
                i =  {...item, value:value};
                break;
            case "number":
                i = {...item, value: value ? value : 0}; 
                break;
            case "currency":
                 i = {...item, value: value ? value : 0};  
                break;
            case "checkbox" :
                i = {...item,  value: value ? value : false}; 
                break;
            default:
              i = {...item, value:value};
                break;
           }
           
           
            return({...i, parentId:parentId, hidden: item.hidden ? item.hidden: false})     
        });

        setModalFields(initializedFields);
      };

      useEffect(()=>{

        initializeItem();

      },[])

      const openModal = (data, index=-1) =>{
       
        console.log('Open Item Modal');
        console.log(modalFields)
        setItemIndex(index);
        initializeItem();
        if(data) 
          {setModalMode("edit"); loadItem(data)} 
        else
          {setModalMode("new");
           initializeItem();}
        setModalOpen(true);
    }

    const loadItem = (data) =>{

      const itemKeyValue = Object.entries(data).map(([key, value]) => ({
        key: key,
        value: value
      }));
      initializeItem(itemKeyValue);

    }

    const close = (data, index) =>{
        console.log('Close Item Modal');
        console.log(modalFields)
        console.log(data);
        console.log(index)
        if(data){
            index === "undefined" || index === -1 ?  addDataTableItem(data) : updateDataTableItem(data,index) ;

              onChange(items, deleteditems);
        }

        setModalOpen(false);
    }

   const addDataTableItem = (item) =>{

      console.log('add item')

      const itemCopy = items.map((item) => ({ ...item}));
      itemCopy.push(item)
      setItems(itemCopy);

  };

 useEffect(()=>{

    onChange(items, deleteditems);

 },[items])

    const updateDataTableItem = (item, index) =>{
      console.log('update item')
      items[index] = item;
      setItems(items);
  };
    const deleteDataTableItem = (index) =>{
      console.log('delete item', index)
      setModalOpen(false);

      const itemsCopy = [...items];
      const item = {...itemsCopy[index]};
      const deleted = [...deleteditems];
      if(item.id !==0){
        deleted.push(item);
        setDeletedItems(deleted);
      }
    
      itemsCopy.splice(index,1);

      setItems(itemsCopy);
      onChange(items, deleteditems);
  };


      return (
        <div className={detailStyle.detailContainer}>
            <div className={detailStyle.newButtonContainer}>
                {editable && <button type="button" onClick={(e)=>{
                    e.stopPropagation();
                    openModal()
                }}>Add</button>}
            </div>
             <DataTable columns={columns} data={items} showActions={editable} emptyMessage={emptyMessage} onActionClick={openModal} />
             <ItemModal headerLabel={itemModalHeader} itemIndex={itemIndex} mode={modalMode} isOpen={isModalOpen} onClose = {close} fields={[...modalFields]} onItemRemove={deleteDataTableItem}> </ItemModal>
        </div>

       );
}