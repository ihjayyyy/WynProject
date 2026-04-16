import React, { useEffect, useState, useContext } from "react";
import { createPortal } from 'react-dom';
import { FiX } from "react-icons/fi";
import modalstyle from "./itemmodal.module.scss"
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Button from '../ui/Button/Button';
import {FiTrash2 } from 'react-icons/fi';
// import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { ConfirmModalContext } from '@/app/contextProviders/confirmModalContext';

const ItemModal = ({ headerLabel, mode = "new", itemIndex=-1, isOpen, onClose, fields, onItemRemove }) => {
const { showConfirmModal } = useContext(ConfirmModalContext);

const[itemFields, setFields] = useState([]);
// const[isConfirmOpen, setConfirmModal] = useState(false);
  useEffect(() => {
    console.log('use effect')
    console.log(fields)
    const tempFields = [...fields]
    setFields(tempFields)
   
  },[...fields]);

const buildSchema = (config) => {
  const shape = {};
 
  itemFields.forEach(field => {
        shape[field.name] = field.validator;
  });

   return Yup.object().shape(shape);
};  

const schema = buildSchema();

 const {
    register,
    reset,
    formState: { errors, isValid  },
  } = useForm({
    mode:"onBlur",
    resolver: yupResolver(schema),
  });

  const handleClose = () => {
    reset(); // reset form values and errors
    onClose(null);
  };  

  const handleShowConfirm =(itemindex)=>{
    const title = "Remove item";
    const message = "Are you sure you want to remove this item?";
    const confirmText = "Remove";
    const variant="danger";
    showConfirmModal(title,message,confirmText,variant, ()=>()=>handleRemove(itemindex));
  }

  const handleSave = () => {
    console.log("Save clicked")

   const itemData =  itemFields.reduce((item, data)=>{
      item[data.name] = data.value;
      return item;
    },{})

    onClose(itemData, itemIndex);
    reset();
  };    

  const handleRemove = (itemIndex) => {
    console.log("Remove confirm clicked")

    onItemRemove(itemIndex);
    onClose();
    reset();
  };    
const handleChange = (e, item) => {
    console.log(e)
    const val = e.target.type === "number" ? e.target.valueAsNumber : e.target.value;
    updateField(item.name,val);

   item.onChange && item.onChange(item, updateField, itemFields);

};

const updateField = (fieldNameToUpdate, value) => {
   console.log(fieldNameToUpdate, value)
   const fieldcopy = [...itemFields];
    const i = fieldcopy.find(x=>x.name === fieldNameToUpdate);
    i.value = value;
   setFields(fieldcopy);
}


const content = (
    <div className={modalstyle.itemModal}
    >
    <div className={modalstyle.modalcontainer}  onClick={(e) => e.stopPropagation()}>
        <div className={modalstyle.modalHeader}>
            <div className={modalstyle.buttonCloseContainer}>
                <FiX  onClick={handleClose} />
            </div>
        </div>
        <div className={modalstyle.modalBody}>
                <p className={modalstyle.title}>{headerLabel}</p>
                {itemFields.map((item)=> (
                  item.hidden ?  null :
                (
                <div key={item.name} className={modalstyle.fieldContainer}>
                    <label>{item.label}</label>
                    <div className={modalstyle.inputcontainer}>
                    {item.type === "currency" || item.type ==="number" ? (
                        <input className={modalstyle.number} {...register(item.name)} readOnly={item.readonly} type="number" step="0.01" placeholder="Enter value" value={item.value ? item.value : 0} onChange={(e)=>{handleChange(e,item)}} />
                    ) : item.type === "select" ? (
                         <select {...register(item.name)} value={item.value !== "undefined" ? item.value : ""} onChange={(e)=>{handleChange(e,item)}}  >
                            <option value="">Select {item.label}</option>
                            {item.options && item.options.map((opt) =>  (
                                <option key={opt.value} value={opt.value}>{opt.name}</option>
                            ))}
                            </select>
                    ) : (
                    <input {...register(item.name)} type={item.type} readOnly={item.readonly} value={item.value ? item.value : ""} onChange={(e)=>{handleChange(e,item)}} />
                    )}
                    </div>
                     {errors[item.name] && (          
                     <p style={{ color: "red" }} className={modalstyle.error}>{errors && errors[item.name] && errors[item.name].message}</p>)}
                </div> 
                ))
              )}
          

        </div>

        <div className={modalstyle.actionContainer} >
            <button className={isValid? modalstyle.saveButton : modalstyle.saveDisabledButton} type="button" onClick={handleSave} disabled={!isValid}>Save</button>
            {mode !=="new" &&<Button size="lg" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => {handleShowConfirm(itemIndex);}} />}
        </div>
        {/* <ConfirmModal open={isConfirmOpen} title="Remove Item?" message="Are you sure you want to remove this item?" confirmText="Remove" confirmVariant="danger" onConfirm={() => {
              handleRemove(itemIndex);
              setConfirmModal(false);
        }} onCancel={() => {
          setConfirmModal(false);
        }} /> */}

    </div>
    </div>
);

if (!isOpen) return null;
return createPortal(content,document.body);
};

export default ItemModal;