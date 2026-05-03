'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { GetAll } from '@/services/PurchaseDelivery';
import { deliveries as sampleDeliveries } from './deliveriesData';
import { orders as sampleOrders } from '../PurchaseOrders/ordersData';
// import { sampleSuppliers } from '../Suppliers/suppliersData';
const sampleSuppliers = [];
const baseColumns = [
   { header: 'Delivery Date', key: 'deliveryDate' },
  { header: 'Delivery No', key: 'deliveryNumber' },
  { header: 'Supplier', key: 'name' },
  { header: 'Order No', key: 'orderNumber' },
  { header: 'Supplier DR No', key: 'supplierDRNumber' },
  { header: 'Received By', key: 'receivedBy' },
  { header: 'Status', key: 'status' },
  

];

export default function DeliveryLanding() {
  const [deliveries, setDeliveries] = useState([]);
  const router = useRouter();

  useEffect(()=>{
    const fetchDeliveries = async() => {

    const res = await GetAll();
    console.log(res)
     if(res && !res.error){
          setDeliveries(res.data);
     }
   }

   fetchDeliveries();
  },[])

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/purchase/deliveries/deliveryform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/purchase/deliveries/deliveryform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = deliveries.length;
    return [
      { key: 'total', label: 'Total Deliveries', number: total, change: `${total} records`, isPositive: true },
    ];
  }, [deliveries]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.code,
      item.name,
      item.orderId,
      item.status,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      ...(item.items || []).map((it) => `${it.name} ${it.supplierId}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Pucrhase Deliveries"
      data={deliveries}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search deliveries"
      newButtonLabel="New Delivery"
      onNew={() => router.push('/purchase/deliveries/deliveryform')}
      emptyMessage="No deliveries found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
