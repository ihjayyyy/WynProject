'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData } from '../../services/Auth';

export const AccessContext = createContext({});

export const useCurrentUser = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within a AccessProvider');
  }
  return context;
};

export const AccessProvider = ({ children }) => {
  const [userAccess, setAccess] = useState([]);
  const [user, setUser] = useState({});

  const loadFromAuth = () => {
    const authData = getAuthData();
    if (!authData) return;

    setUser({
      id: authData.userId,
      name: `${authData.firstName} ${authData.lastName}`.trim(),
      email: authData.email,
    });

    const access = (authData.role?.children ?? []).map(({ name, access }) => ({
      name,
      access,
    }));
    setAccess(access);
  };

  useEffect(() => {
    loadFromAuth();
  }, []);

  const refreshAccess = () => {
    loadFromAuth();
  };

  const getAccess = (name) => {
    const access = userAccess.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    return access ? access : { name, access: 'n' };
  };

  const isAllowed = (pagename, access) => {
    const pageAccess = getAccess(pagename).access;
    const matches = access
      .split('')
      .filter((char) => pageAccess.includes(char));
    return matches && matches.length > 0 && true;
  };

  return (
    <AccessContext.Provider
      value={{ user, userAccess, refreshAccess, getAccess, isAllowed }}>
      {children}
    </AccessContext.Provider>
  );
};
