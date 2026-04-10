
import React, { useMemo, useState,useEffect } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from './itemModal'; 
import * as Yup from "yup";
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Button from '../ui/Button/Button';

export default function DetailsTable({itemModalHeader, columns = [], data  = {items:[],deletedItems:[]}, itemFields=[], onChange, editable = true, emptyMessage='No current items', parentId = 0}) {
    
    const [items, setItems] = useState([]);
    const [deleteditems, setDeletedItems] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [modalFields, setModalFields] = useState(itemFields || []);




      useEffect(() => {
        const mapped = (data.items || []).map((item) => ({ ...item}));
        const deletedItems = (data.deletedItems || []).map((item) => ({ ...item}));
        setItems(mapped);
        setDeletedItems(deletedItems);
      }, [data]);
    

      const initializeNewItem = () => {
        console.log(itemFields)
       const initializedFields = itemFields.map((item)=>{
           let i = {...item};
           switch(item.type){
            case "text" || "select" :
                i = item.initialvalue && item.initialvalue !== "undefined" ? {...item, value:item.initialvalue} : {...item, value:""};
                break;
            case "number":
                i = item.initialvalue && item.initialvalue !== "undefined" ? {...item, value:parseFloat(item.initialvalue)} : {...item, value:0};
                break;
            case "currency":
                 i = item.initialvalue && item.initialvalue !== "undefined" ? {...item, value:parseFloat(item.initialvalue)} : {...item, value:0};
                break;
            case "checkbox" :
                i = item.initialvalue && item.initialvalue !== "undefined" ? {...item, value:item.initialvalue} : {...item, value:false};
                break;
            default:
              i = item.initialvalue && item.initialvalue !== "undefined" ? {...item, value:item.initialvalue} : {...item, value:""};
                break;
           }
           
           
            return({...i, parentId:parentId, hidden: item.hidden ? item.hidden: false})     
        });
        console.log(initializedFields)
        setModalFields(initializedFields);
      };

      useEffect(()=>{

        initializeNewItem();

       if (editable) {
        columns.push({ header: 'Actions', key: '__actions', align: 'right', width: '120px', render: (it) => {
          return (
            <div>
              <Button size="sm" variant="outlinedPrimary" icon={<FiEdit2 />} title="Edit" onClick={() => { openModal(it); }} />
              <Button size="sm" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => {
                setConfirmTarget(it);
                setIsConfirmOpen(true);
              }} />
            </div>
          );
        } });
      }

      },[])

      const openModal = (data) =>{
       
        console.log('Open Item Modal');

        data ? loadItems(data) : initializeNewItem();
        setModalOpen(true);
    }

    const loadItem = (data) =>{

    }
    const close = (data) =>{
        console.log('Close Item Modal');
        console.log(data);
        data && data.id === 0 && addDataTableItem(data);

        setModalOpen(false);
    }

      const addDataTableItem = (item) =>{

      console.log('add item')

      const itemCopy = items.map((item) => ({ ...item}));
      itemCopy.push(item)
      setItems(itemCopy);
  };

    const updateDataTableItem = (item) =>{
      console.log('update item')
  };
    const deleteDataTableItem = () =>{
      console.log('delete item')
  };


      return (
        <div className="detail-container">
            <div className='new-button'>
                <button type="button" onClick={(e)=>{
                    e.stopPropagation();
                    openModal()
                }}>New</button>
            </div>
             <DataTable columns={columns} data={items} showActions={true} emptyMessage={emptyMessage} />
             <ItemModal headerLabel={itemModalHeader} isOpen={isModalOpen} onClose = {close} fields={[...modalFields]}> </ItemModal>
        </div>

       );
}