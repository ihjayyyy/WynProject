"use client";

import React, { createContext, useState, useEffect } from "react";
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';

export const ConfirmModalContext = createContext({});

export const ConfirmModalProvider = ({ children }) => {
const [isConfirmOpen, setConfirmModal] = useState(false);
const [title, setTitle] = useState('');
const [message, setmessage] = useState('');
const [confirmText, setconfirmText] = useState('');
const [variant, setVariant] = useState('');
const [confirmAction, setConfirmAction] = useState(null);

const showConfirmModal =(title,message,confirmText,variant, action)=>{
        setTitle(title);
        setmessage(message);
        setconfirmText(confirmText);
        setVariant(variant);
        setConfirmAction(action);
        setConfirmModal(true);
}

const handleConfirmAction =()=>{
    confirmAction();
    resetModal();
}
const resetModal= ()=>{
        setTitle('');
        setmessage('');
        setconfirmText('');
        setVariant('');
        setConfirmAction(null);
        setConfirmModal(false);
}

  return (
   <ConfirmModalContext.Provider value={{ showConfirmModal, resetModal }}>
     {children}
    <ConfirmModal open={isConfirmOpen} title={title} message={message} confirmText={confirmText} confirmVariant={variant} onConfirm={() => {
             handleConfirmAction();
            }} onCancel={() => {
              resetModal();
            }} />
   </ConfirmModalContext.Provider>
 );    
};
