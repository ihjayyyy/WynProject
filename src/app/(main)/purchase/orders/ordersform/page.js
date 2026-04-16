'use client'

import PurchaseOrdersForm from '../../../../../components/PurchaseOrders/PurchaseOrdersForm';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/(main)/accessContext';
import { useContext } from 'react';
export default function OrdersFormPage() {
  const PageName = 'Purchase.Orders';
  
  const { getAccess } = useContext(AccessContext);

  return (
  getAccess(PageName).access !== 'n' ? <PurchaseOrdersForm /> : <InvalidPage/>) 
}
