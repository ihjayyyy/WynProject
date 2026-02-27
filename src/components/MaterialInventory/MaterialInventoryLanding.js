'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { sampleMaterialInventory } from './materialInventoryData';
import styles from './MaterialInventoryLanding.module.scss';

const baseColumns = [
  { header: 'MaterialType', key: 'materialType' },
  { header: 'UOM', key: 'uom' },
  { header: 'UnitCost', key: 'unitCost' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'VAT', key: 'vat' },
  { header: 'WT', key: 'wt' },
  { header: 'TotalCost', key: 'totalCost' },
  { header: 'Id', key: 'id' },
  { header: 'CreatedBy', key: 'createdBy' },
  { header: 'CreatedDate', key: 'createdDate' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
];

export default function MaterialInventoryLanding() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory] = useState(sampleMaterialInventory);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/materialinventory/materialinventoryform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(`/materialinventory/materialinventoryform?id=${item.id}&mode=edit`),
      },
    ],
    [router]
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems]
  );

  const filteredInventory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return inventory;
    }

    return inventory.filter((item) =>
      [
        item.materialType,
        item.uom,
        item.unitCost,
        item.quantity,
        item.vat,
        item.wt,
        item.totalCost,
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [searchTerm, inventory]);

  return (
    <div className={styles.inventoryWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Material Inventory</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search material inventory"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Materials"
            handleOnClick={() => router.push('/materialinventory/materialinventoryform')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        <DataTable
          columns={columns}
          data={filteredInventory}
          showActions={false}
          emptyMessage="No material inventory records found"
        />
      </div>
    </div>
  );
}
