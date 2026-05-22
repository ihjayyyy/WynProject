"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import * as Yup from 'yup';
import EntityForm from '../EntityForm/EntityForm';
import DetailsTable from '../ItemDetails/DetailsTable';
import { getTransferredMaterialTransfers, getMaterialTransfer, receiveMaterialTransfer } from '@/services/MaterialTransfer';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { ItemsFields as TransferItemsFields, TableColumns as TransferTableColumns } from '@/components/MaterialTransfer/MaterialTransferModels';
import { useToast } from '../ui/Toast/Toast';
import { FiDownload } from 'react-icons/fi';

export default function MaterialReceivedForm() {
  const backPath = '/inventory/materialreceived';
  const toast = useToast();

  const [transfers, setTransfers] = useState([]);
  const [selectedTransferId, setSelectedTransferId] = useState(0);
  const [transferData, setTransferData] = useState(null);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [itemFields, setItemFields] = useState([]);
  const confirmModal = useConfirmModal();
  const [actionLoading, setActionLoading] = useState(false);
  const searchParams = useSearchParams();

  // sync URL id param when opening via landing edit/view
  useEffect(() => {
    const id = Number(searchParams.get('id') || 0);
    if (id) setSelectedTransferId(id);
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const res = await getTransferredMaterialTransfers();
      if (!res?.error && Array.isArray(res.data)) setTransfers(res.data);
      else setTransfers([]);
    })();
  }, []);

  useEffect(() => {
    if (!selectedTransferId) {
      setTransferData(null);
      setTableData({ items: [], deletedItems: [] });
      setItemFields([]);
      return;
    }

    (async () => {
      const res = await getMaterialTransfer(Number(selectedTransferId));
      if (res?.error) {
        toast.error('Failed to load material transfer');
        setTransferData(null);
        setTableData({ items: [], deletedItems: [] });
        setItemFields([]);
        return;
      }

      const data = res.data || null;
      setTransferData(data);


      const children = Array.isArray(data?.children) ? data.children : [];

      // Pre-populate table items from transfer children, with receivedQuantity default 0
      const preItems = children.map((c) => ({
        id: c.id ?? c.transferDetailId ?? 0,
        parentId: c.parentId ?? c.transferId ?? selectedTransferId,
        materialId: c.materialId ?? (c.material ? c.material.id : 0),
        code: c.code || (c.material && c.material.code) || '',
        name: c.name || (c.material && c.material.name) || '',
        quantity: Number(c.quantity ?? c.qty ?? 0),
        receivedQuantity: Number(c.receivedQuantity ?? 0),
        uom: c.uom || (c.material && c.material.uom) || '',
        remarks: c.remarks || '',
      }));

      setTableData({ items: preItems, deletedItems: [] });

      const materialOptions = children.map((c) => ({
        value: c.materialId ?? c.id ?? (c.material ? c.material.id : 0),
        label: (c.code ? `${c.code} - ` : '') + (c.name || (c.material && c.material.name) || ''),
        code: c.code || (c.material && c.material.code) || '',
        name: c.name || (c.material && c.material.name) || '',
        uom: c.uom || (c.material && c.material.uom) || '',
      }));

      const baseFields = TransferItemsFields(materialOptions || []);
      const nextFields = baseFields.map((f) => ({ ...f }));

      const qtyIndex = nextFields.findIndex((f) => f.name === 'quantity');
      if (qtyIndex !== -1) nextFields[qtyIndex].readonly = true;

      nextFields.splice(qtyIndex + 1, 0, {
        name: 'receivedQuantity',
        label: 'Received Quantity',
        type: 'number',
        initialvalue: 0,
        validator: Yup.number().typeError('Must be a number').min(0, 'Cannot be negative'),
      });

      setItemFields(nextFields);
    })();
  }, [selectedTransferId, toast]);

  const formFields = useMemo(() => (
    [
      {
        name: 'transferId',
        label: 'Material Transfer',
        type: 'select',
        options: (values) => (Array.isArray(transfers) ? transfers.map(t => ({ value: t.id, label: `${t.code || t.name || ''}` })) : []),
        searchable: true,
        onChange: (val) => {
          setSelectedTransferId(Number(val) || 0);
        },
      }
    ]
  ), [transfers]);

  const detailsUpdated = (items, deletedItems) => {
    setTableData({ items, deletedItems });
  };

  const handleSave = async (values) => {
    if (!selectedTransferId) {
      toast.error('No material transfer selected');
      return null;
    }

    const details = (tableData.items || []).map((it) => ({
      transferDetailId: it.id || it.parentId || 0,
      receivedQuantity: Number(it.receivedQuantity || 0),
    }));

    const payload = { details };

    const performReceive = async () => {
      setActionLoading(true);
      try {
        const res = await receiveMaterialTransfer(Number(selectedTransferId), payload);
        if (res?.error) {
          console.error('Receive error', res.error);
          toast.error('Failed to mark as received');
        } else {
          toast.success('Transfer marked as received');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to mark as received');
      } finally {
        setActionLoading(false);
      }
    };

    // If any receivedQuantity differs from original quantity, show confirmation
    const mismatched = (tableData.items || []).some((it) => Number(it.receivedQuantity || 0) !== Number(it.quantity || 0));
    if (mismatched) {
      confirmModal.show(
        'Confirm receive',
        'One or more received quantities do not match the transfer quantity. Do you want to continue?',
        'Continue',
        'primary',
        () => async () => { await performReceive(); }
      );
    } else {
      await performReceive();
    }

    return null;
  };

  return (
    <EntityForm
      title={transferData ? `Receive for ${transferData.name || transferData.code || ''}` : 'New Material Received'}
      breadcrumbLabel="Material Received"
      icon={<FiDownload />}
      fields={formFields}
      initialValues={{ id: selectedTransferId || undefined, transferId: selectedTransferId }}
      onSubmit={handleSave}
      backPath={backPath}
      width="100%"
      extraContent={(
        <div style={{ marginTop: 12 }}>
          <DetailsTable
            itemModalHeader="Receive Items"
            parentId={selectedTransferId}
            columns={TransferTableColumns.concat([{ header: 'Received', key: 'receivedQuantity', align: 'right', render: (it) => (Number(it.receivedQuantity) || 0) }])}
            editable={!!selectedTransferId}
            allowAdd={false}
            itemFields={itemFields}
            data={tableData}
            onChange={detailsUpdated}
            emptyMessage={selectedTransferId ? 'No items received yet' : 'Select a material transfer first'}
          />
        </div>
      )}
      showSubmitButton={true}
    />
  );
}
