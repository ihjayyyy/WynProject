import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { FiX } from "react-icons/fi";
import modalstyle from "./itemmodal.module.scss"
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import Button from '../ui/Button/Button';
import {FiTrash2 } from 'react-icons/fi';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import inputStyles from '../ui/Input/Input.module.scss';

const ItemModal = ({ headerLabel, mode = "new", itemIndex=-1, isOpen, onClose, fields, onItemRemove }) => {

const[itemFields, setFields] = useState([]);
const[isConfirmOpen, setConfirmModal] = useState(false);
  useEffect(() => {
    console.log('use effect')
    console.log(fields)
    const tempFields = [...fields]
    setFields(tempFields)
   
  },[fields]);

const buildSchema = (config) => {
  const shape = {};
 
  itemFields.forEach(field => {
        const validator = field.validator;
        if (validator && field.type === 'number') {
          shape[field.name] = validator.transform((currentValue, originalValue) => {
            if (originalValue === '' || originalValue === null || originalValue === undefined) return undefined;
            if (typeof originalValue === 'number' && Number.isNaN(originalValue)) return undefined;
            return currentValue;
          });
        } else {
          shape[field.name] = validator;
        }
  });

   return Yup.object().shape(shape);
};  

const schema = buildSchema();

 const {
    register,
    reset,
    formState: { errors },
  } = useForm({
    mode:"onBlur",
    resolver: yupResolver(schema),
  });

// Manually validate itemFields against schema to determine isValid
const [isValid, setIsValid] = useState(false);
useEffect(() => {
  schema.validate(itemFields.reduce((acc, field) => ({ ...acc, [field.name]: field.value }), {}), { abortEarly: false })
    .then(() => setIsValid(true))
    .catch(() => setIsValid(false));
}, [itemFields, schema]);

  const handleClose = () => {
    reset(); // reset form values and errors
    onClose(null);
  };  

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
    const val = e.target.type === "checkbox"
      ? e.target.checked
      : e.target.type === "number"
        ? (e.target.value === '' ? '' : Number(e.target.value))
        : e.target.value;
    const nextFields = (itemFields || []).map((field) => (
      field.name === item.name ? { ...field, value: val } : field
    ));
    setFields(nextFields);

  item.onChange && item.onChange(item, updateField, nextFields, val);

};

const updateField = (fieldNameToUpdate, value) => {
   console.log(fieldNameToUpdate, value)
  setFields((prevFields) => {
   const fieldcopy = [...prevFields];
   const i = fieldcopy.find(x=>x.name === fieldNameToUpdate);
   if(!i) return prevFields;
   i.value = value;
   return fieldcopy;
  });
}


const content = (
    <div className={modalstyle.itemModal} onClick={handleClose}>
    <div className={modalstyle.modalcontainer}  onClick={(e) => e.stopPropagation()}>
        <div className={modalstyle.modalHeader}>
            <h3 className={modalstyle.title}>{headerLabel}</h3>
            <button className={modalstyle.buttonCloseContainer} type="button" onClick={handleClose} aria-label="Close modal">
              <FiX />
            </button>
        </div>
        <div className={modalstyle.modalBody}>
                {itemFields.map((item)=> (
                  item.hidden ?  null :
                (
                <div key={item.name} className={modalstyle.fieldContainer}>
                    {/* <div className={modalstyle.inputcontainer}> */}
                    {item.type === "currency" || item.type ==="number" ? (
                        <Input
                          label={item.label}
                          {...register(item.name)}
                          readOnly={item.readonly}
                          type="number"
                          step="0.01"
                          placeholder="Enter value"
                          value={item.value ?? 0}
                          onChange={(e)=>{handleChange(e,item)}}
                        />
                    ) : item.type === "select" ? (
                         <div className={inputStyles.field}>
                           <label>{item.label}</label>
                           <Select
                             id={item.name}
                             value={item.value !== "undefined" ? item.value : ""}
                             onChange={(e)=>{handleChange(e,item)}}
                             options={[
                              { value: '', label: `Select ${item.label}` },
                              ...((item.options || []).map((opt) => ({
                                value: opt.value,
                                label: opt.label || opt.name || String(opt.value),
                              }))),
                             ]}
                           />
                         </div>
                    ) : item.type === "checkbox" ? (
                    <Input
                      label={item.label}
                      {...register(item.name)}
                      type="checkbox"
                      checked={Boolean(item.value)}
                      onChange={(e)=>{handleChange(e,item)}}
                    />
                    ) : (
                    <Input
                      label={item.label}
                      {...register(item.name)}
                      type={item.type}
                      readOnly={item.readonly}
                      value={item.value ?? ""}
                      onChange={(e)=>{handleChange(e,item)}}
                    />
                    )}
                    {/* </div> */}
                     {errors[item.name] && (          
                     <p style={{ color: "red" }} className={modalstyle.error}>{errors && errors[item.name] && errors[item.name].message}</p>)}
                </div> 
                ))
              )}
          

        </div>

        <div className={modalstyle.actionContainer} >
            <Button variant={isValid ? "primary" : "secondary"} onClick={handleSave} disabled={!isValid}>Save</Button>
            {mode !=="new" &&<Button size="lg" variant="danger" icon={<FiTrash2 />} title="Delete" onClick={() => {setConfirmModal(true);}} />}
        </div>
        <ConfirmModal open={isConfirmOpen} title="Remove Item?" message="Are you sure you want to remove this item?" confirmText="Remove" confirmVariant="danger" onConfirm={() => {
              handleRemove(itemIndex);
              setConfirmModal(false);
        }} onCancel={() => {
          setConfirmModal(false);
        }} />

    </div>
    </div>
);

if (!isOpen) return null;
return createPortal(content,document.body);
};

export default ItemModal;