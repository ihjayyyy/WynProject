
import React, { useMemo, useState,useEffect } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from './itemModal'; 
import * as Yup from "yup";

export default function DetailsTable({itemModalHeader, columns = [], items = [], itemFields=[], onChange, editable = true, emptyMessage='No current items', parentId = 0}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [localItems, setLocalItems] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [deletedItems, setDeletedItems] = useState([]);
    const [inputFields, setInputFields] = useState([]);
    const [itemValues, setItemValues] = useState(itemFields || []);


      useEffect(() => {
        const mapped = (items || []).map((item) => ({ ...item}));
        setLocalItems(mapped);
      }, [items]);
    

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
           
           
            return({...i, hidden: item.hidden ? item.hidden: false})     
        });
        console.log(initializedFields)
        setItemValues(initializedFields);
      };

      useEffect(()=>{

        initializeNewItem();

      },[])

      const openNewModal = () =>{
       
        console.log('Open Item Modal');

        initializeNewItem();
        setModalOpen(true);
    
    }
    const close = (data) =>{
        console.log('Close Item Modal');
        console.log(data);
        setModalOpen(false);
    }

    const addToTable = (data) =>{

      setLocalItems(mapped);
    }
      return (
        <div className="detail-container">
            <div className='new-button'>
                <button type="button" onClick={(e)=>{
                    e.stopPropagation();
                    openNewModal()
                }}>New</button>
            </div>
             <DataTable columns={columns} data={items} showActions={false} emptyMessage={emptyMessage} />
             <ItemModal headerLabel={itemModalHeader} isOpen={isModalOpen} onClose = {close} fields={[...itemValues]}> </ItemModal>
        </div>

       );
}