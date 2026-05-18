import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import ItemModal from './itemModal';
import detailStyle from "./DetailsTable.module.scss"
import * as Yup from "yup";
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Button from '../ui/Button/Button';

export default function DetailsTable({ itemModalHeader, columns = [], data = { items: [], deletedItems: [] }, itemFields = [], onChange, editable = false, emptyMessage = 'No current items', parentId = 0, showActions = editable }) {

  const [items, setItems] = useState([]);
  const [deleteditems, setDeletedItems] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalFields, setModalFields] = useState(itemFields);
  const [modalMode, setModalMode] = useState("new");
  const [itemIndex, setItemIndex] = useState(-1);

  // FIX: Track whether the last items/deleteditems change came from the parent (via data prop)
  // or from an internal user action (add/update/delete). We only call onChange for internal
  // actions — not when we're just syncing down from the parent — which breaks the loop.
  const isInternalChangeRef = useRef(false);

  // Sync itemFields from props
  useEffect(() => {
    const localizeItemFields = itemFields.map((item) => ({ ...item }));
    setModalFields(localizeItemFields);
  }, [itemFields]);

  // Sync items from parent data prop — mark as external so onChange is NOT fired
  useEffect(() => {
    const mapped = (data.items || []).map((item) => ({ ...item }));
    const deletedItems = (data.deletedItems || []).map((item) => ({ ...item }));
    isInternalChangeRef.current = false; // coming from parent, don't echo back
    setItems(mapped);
    setDeletedItems(deletedItems);
  }, [data]);

  // Notify parent only when items changed due to an internal user action (add/update/delete)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      onChange(items, deleteditems);
    }
  }, [items, deleteditems, onChange]);

  const initializeItem = (data) => {
    const initializedFields = modalFields.map((item) => {
      const keyValue = data ? data.find(k => k.key === item.name) : null;
      const value = keyValue ? keyValue.value : item.initialvalue && item.initialvalue !== "undefined" ? item.initialvalue : "";

      let i = { ...item };
      switch (item.type) {
        case "text" || "select":
          i = { ...item, value: value };
          break;
        case "number":
          i = { ...item, value: value ? value : 0 };
          break;
        case "currency":
          i = { ...item, value: value ? value : 0 };
          break;
        case "checkbox":
          i = { ...item, value: value ? value : false };
          break;
        default:
          i = { ...item, value: value };
          break;
      }

      return ({ ...i, parentId: parentId, hidden: item.hidden ? item.hidden : false });
    });

    setModalFields(initializedFields);
  };

  useEffect(() => {
    initializeItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (data, index = -1) => {
    setItemIndex(index);
    initializeItem();
    if (data) {
      setModalMode("edit");
      loadItem(data);
    } else {
      setModalMode("new");
      initializeItem();
    }
    setModalOpen(true);
  };

  const loadItem = (data) => {
    const itemKeyValue = Object.entries(data).map(([key, value]) => ({
      key: key,
      value: value
    }));
    initializeItem(itemKeyValue);
  };

  const close = (data, index) => {
    if (data) {
      index === "undefined" || index === -1 ? addDataTableItem(data) : updateDataTableItem(data, index);
      // Note: onChange is handled by the items useEffect above for add/update
    }
    setModalOpen(false);
  };

  const addDataTableItem = (item) => {
    isInternalChangeRef.current = true; // user action — notify parent
    const itemCopy = items.map((item) => ({ ...item }));
    itemCopy.push(item);
    setItems(itemCopy);
  };

  const updateDataTableItem = (item, index) => {
    isInternalChangeRef.current = true; // user action — notify parent
    const itemsCopy = [...items];
    itemsCopy[index] = item;
    setItems(itemsCopy);
  };

  const deleteDataTableItem = (index) => {
    setModalOpen(false);

    const itemsCopy = [...items];
    const item = { ...itemsCopy[index] };
    const deleted = [...deleteditems];

    if (item.id !== 0) {
      deleted.push(item);
      setDeletedItems(deleted);
    }

    itemsCopy.splice(index, 1);

    isInternalChangeRef.current = true; // user action — notify parent
    setItems(itemsCopy);
  };

  return (
    <div className={detailStyle.detailContainer}>
      <div className={detailStyle.newButtonContainer}>
        {editable && (
          <Button icon={<FiPlus />} onClick={(e) => { e.stopPropagation(); openModal(); }}>Add</Button>
        )}
      </div>
      <DataTable columns={columns} data={items} showActions={showActions} emptyMessage={emptyMessage} onActionClick={openModal} />
      <ItemModal headerLabel={itemModalHeader} itemIndex={itemIndex} mode={modalMode} isOpen={isModalOpen} onClose={close} fields={[...modalFields]} onItemRemove={deleteDataTableItem} />
    </div>
  );
}