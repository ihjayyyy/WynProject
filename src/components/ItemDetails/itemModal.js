import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { FiX } from "react-icons/fi";
import modalstyle from "./itemmodal.module.scss"
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

const ItemModal = ({ headerLabel, isOpen, onClose, fields }) => {

const[itemFields, setFields] = useState([]);

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

  const handleSave = () => {
    console.log("Save clicked")

    const returnFields = itemFields.map((item)=>({
      name:item.name,
      value:item.value,
      type:item.type
    }));

    onClose(returnFields);
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
                        <input className={modalstyle.number} {...register(item.name)} readOnly={item.readonly} type="number" step="0.01" placeholder="Enter value" value={item.value} onChange={(e)=>{handleChange(e,item)}} />
                    ) : item.type === "select" ? (
                         <select {...register(item.name)} value={item.value} onChange={(e)=>{handleChange(e,item)}}  >
                            <option value="">Select {item.label}</option>
                            {item.options && item.options.map((opt) =>  (
                                <option key={opt.value} value={opt.value}>{opt.name}</option>
                            ))}
                            </select>
                    ) : (
                    <input {...register(item.name)} type={item.type} readOnly={item.readonly} value={item.value} onChange={(e)=>{handleChange(e,item)}} />
                    )}
                    </div>
                     {errors[item.name] && (          
                     <p style={{ color: "red" }} className={modalstyle.error}>{errors && errors[item.name] && errors[item.name].message}</p>)}
                </div> 
                ))
              )}
          

        </div>

        <div className={modalstyle.actionContainer} >
            <button className={modalstyle.actionButton} type="button" onClick={handleSave} disabled={!isValid}>Save</button>
        </div>


    </div>
    </div>
);

if (!isOpen) return null;
return createPortal(content,document.body);
};

export default ItemModal;