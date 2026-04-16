"use client";

import React, { createContext, useState, useEffect } from "react";
import {getCurrentUser,getUserAccess} from '../../services/User';

export const AccessContext = createContext({});

export const AccessProvider = ({ children }) => {
 const [userAccess, setAccess] = useState([]);
 const [user, setUser] = useState({});

  
    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        //const data = await response.json();
        setUser(response.data.value);

      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {

      }
    };


   const fetchAccess = async () => {
      try {
        const response = await getUserAccess();
        //const data = await response.json();

        setAccess(response.data.value);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {

      }
    };
useEffect(() => {

    console.log('loading Access context');
    fetchUser();
    fetchAccess();

  }, []);

  
  const refreshAccess = () =>{
      console.log(refershAccess);
      fetchAccess();
  }
  const getAccess = (name) => {
   
    const access = userAccess.find(a=>a.name.toLowerCase()===name.toLowerCase());
    return access ? access : {name:name,access:'n'};
 };

  const isAllowed = (pagename, access)=>{
 
    const pageAccess = getAccess(pagename).access;

     const matches = access.split('').filter(char => pageAccess.includes(char));
     console.log(pageAccess, matches)
     return matches && matches.length > 0 && true;
 
   }

  return (
   <AccessContext.Provider value={{ user, userAccess, refreshAccess, getAccess, isAllowed }}>
     {children}
   </AccessContext.Provider>
 );
};