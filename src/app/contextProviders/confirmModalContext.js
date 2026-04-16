"use client";

import React, { createContext, useState, useContext } from "react";
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';

export const ConfirmModalContext = createContext({});

export const useConfirmModal = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  }
  return context;
};

export const ConfirmModalProvider = ({ children }) => {
const [isConfirmOpen, setConfirmModal] = useState(false);
const [title, setTitle] = useState('');
const [message, setmessage] = useState('');
const [confirmText, setconfirmText] = useState('');
const [variant, setVariant] = useState('');
const [confirmAction, setConfirmAction] = useState(null);

const show =(title,message,confirmText,variant, action)=>{
        setTitle(title);
        setmessage(message);
        setconfirmText(confirmText);
        setVariant(variant);
        setConfirmAction(action);
        setConfirmModal(true);
}

const handleConfirmAction =()=>{
    confirmAction();
    reset();
}
const reset= ()=>{
        setTitle('');
        setmessage('');
        setconfirmText('');
        setVariant('');
        setConfirmAction(null);
        setConfirmModal(false);
}

  return (
   <ConfirmModalContext.Provider value={{ show, reset }}>
     {children}
    <ConfirmModal open={isConfirmOpen} title={title} message={message} confirmText={confirmText} confirmVariant={variant} onConfirm={() => {
             handleConfirmAction();
            }} onCancel={() => {
              reset();
            }} />
   </ConfirmModalContext.Provider>
 );    
};
