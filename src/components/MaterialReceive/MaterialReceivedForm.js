"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Yup from 'yup';
import EntityForm from '../EntityForm/EntityForm';
import EntityStyle from '../EntityForm/EntityContainer.module.scss';
import Button from '../ui/Button/Button';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import DetailsTable from '../ItemDetails/DetailsTable';
import { getTransferredMaterialTransfers, getMaterialTransfer, receiveMaterialTransfer } from '@/services/MaterialTransfer';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { ItemsFields as ReceivedItemsFields, TableColumns as ReceivedTableColumns } from '@/components/MaterialReceive/MaterialReceivedModels';
import { useToast } from '../ui/Toast/Toast';
import { FiDownload } from 'react-icons/fi';

export default function MaterialReceivedForm() {
  const backPath = '/inventory/materialreceived';
  const toast = useToast();
  const router = useRouter();

  const [transfers, setTransfers] = useState([]);
  const searchParams = useSearchParams();
  const initialId = Number(searchParams.get('id') || 0);
  const [selectedTransferId, setSelectedTransferId] = useState(initialId);
  const initialMode = searchParams.get('mode') || (initialId ? 'view' : 'edit');
  const [mode, setMode] = useState(initialMode);
  const [transferData, setTransferData] = useState(null);
  const [tableData, setTableData] = useState({ items: [], deletedItems: [] });
  const [itemFields, setItemFields] = useState([]);
  const [tableError, setTableError] = useState('');
  const confirmModal = useConfirmModal();
  const [actionLoading, setActionLoading] = useState(false);
  // (selectedTransferId is initialized from URL `id` param)

  useEffect(() => {
    if (!selectedTransferId) {
      setMode('new');
    } else {
      const spMode = searchParams.get('mode');
      setMode(spMode || 'view');
    }
  }, [selectedTransferId, searchParams]);

  // Base list of transfers eligible to be received. This is the ONLY place
  // that sets `transfers` — the currently-loaded transfer (which may no
  // longer be "eligible", e.g. already PartiallyReceived) is merged in
  // separately via `transferOptions` below instead of mutating this state,
  // to avoid a race between the two async loads clobbering each other.
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

      // Pre-populate table items from transfer children, with receivedQuantity default 0.
      // Any remarks already on the item (e.g. from a prior partial receive) are kept
      // separately in `existingRemarks` so they can be displayed read-only and merged
      // with new remarks on save, rather than being overwritten.
      const preItems = children.map((c) => ({
        id: c.id ?? c.transferDetailId ?? 0,
        parentId: c.parentId ?? c.transferId ?? selectedTransferId,
        materialId: c.materialId ?? (c.material ? c.material.id : 0),
        code: c.code || (c.material && c.material.code) || '',
        name: c.name || (c.material && c.material.name) || '',
        rackId: c.rackId ?? (c.rack ? c.rack.id : 0),
        rackCode: (c.rack && c.rack.code) || '',
        rackName: (c.rack && c.rack.name) || '',
        quantity: Number(c.quantity ?? c.qty ?? 0),
        receivedQuantity: Number(c.receivedQuantity ?? 0),
        uom: c.uom || (c.material && c.material.uom) || '',
        existingRemarks: c.remarks || '',
        remarks: '',
      }));

      setTableData({ items: preItems, deletedItems: [] });
      setItemFields(ReceivedItemsFields(data?.status));
    })();
  }, [selectedTransferId, toast]);

  // Dropdown option source, derived rather than stored: base "eligible"
  // transfers, plus the currently loaded transfer if it isn't already in
  // that list (e.g. it's PartiallyReceived and no longer "eligible").
  // Deriving this avoids the two-effect race that used to blank the select.
  const transferOptions = useMemo(() => {
    const list = Array.isArray(transfers) ? [...transfers] : [];
    if (transferData?.id && !list.find((t) => String(t.id) === String(transferData.id))) {
      list.unshift(transferData);
    }
    return list;
  }, [transfers, transferData]);

  const isReceived = useMemo(
    () => String(transferData?.status || '').toLowerCase() === 'received',
    [transferData]
  );

  const isReadOnly = useMemo(() => {
    if (isReceived) return true;
    if (transferData) return mode === 'view';
    return mode !== 'edit' && mode !== 'new' ? true : false;
  }, [transferData, mode, isReceived]);

  const isPartiallyReceived = useMemo(
    () => String(transferData?.status || '').toLowerCase() === 'partiallyreceived',
    [transferData]
  );

  // True when every item currently has a received quantity of 0 — nothing to save yet.
  const allReceivedZero = useMemo(() => {
    const items = tableData.items || [];
    if (items.length === 0) return true;
    return items.every((it) => Number(it.receivedQuantity || 0) === 0);
  }, [tableData.items]);

  // True as soon as at least one item has received qty > 0 on this pass.
  // Drives the remarks requirement for the other lines, independent of the
  // transfer's server-side status (matters on the very first receive, before
  // the transfer itself is marked "PartiallyReceived").
  const anyReceivedThisPass = useMemo(
    () => (tableData.items || []).some((it) => Number(it.receivedQuantity || 0) > 0),
    [tableData.items]
  );

  const formFields = useMemo(() => (
    [
      {
        name: 'transferId',
        label: 'Material Transfer',
        type: 'select',
        options: () => transferOptions.map(t => ({ value: t.id, label: `${t.transferNumber || t.code || t.name || ''}` })),
        searchable: true,
        // Once a transfer is loaded (edit/view of an existing receipt), the
        // dropdown is locked — you can't reassign which transfer a receipt
        // is against. Only free to pick when starting a brand-new receipt.
        readonly: !!transferData,
        disabled: !!transferData,
        onChange: (val) => {
          setSelectedTransferId(Number(val) || 0);
        },
        validator: Yup.number().typeError('Material Transfer is required').required('Material Transfer is required'),
      }
    ]
  ), [transferOptions, transferData]);

  const detailsUpdated = (items, deletedItems) => {
    setTableData({ items, deletedItems });
    if (Array.isArray(items) && items.length > 0) setTableError('');
  };

  // Combines remarks carried over from a prior partial receive with what the
  // user enters this time. If both exist they're joined with a newline so
  // history is preserved; if only one exists, that one is used as-is.
  const combineRemarks = (oldRemarks, newRemarks) => {
    const oldTrim = (oldRemarks || '').trim();
    const newTrim = (newRemarks || '').trim();
    if (oldTrim && newTrim) return `${oldTrim}\n${newTrim}`;
    return oldTrim || newTrim;
  };

  const handleSave = async (values) => {
    if (!selectedTransferId) {
      toast.error('No material transfer selected');
      return null;
    }

    const details = (tableData.items || []).map((it) => ({
      transferDetailId: it.id || it.parentId || 0,
      receivedQuantity: Number(it.receivedQuantity || 0),
      remarks: combineRemarks(it.existingRemarks, it.remarks),
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
          router.push(backPath);
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

  const headerActions = (() => {
    if (isReadOnly) {
      const menuItems = !isReceived
        ? [{ key: 'edit', label: 'Edit', onClick: () => setMode('edit') }]
        : [];
      return menuItems.length > 0 ? <DropdownAction item={transferData || {}} items={menuItems} /> : null;
    }

    return (
      <>
        <Button variant="outlineDanger" onClick={() => { setMode(transferData ? 'view' : 'new'); }}>Cancel</Button>
        <Button type="submit" variant="save" disabled={actionLoading || !selectedTransferId || allReceivedZero}>Save</Button>
      </>
    );
  })();

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
            columns={ReceivedTableColumns}
            editable={!!selectedTransferId && !isReadOnly}
            allowAdd={false}
            itemFields={itemFields}
            data={tableData}
            onChange={detailsUpdated}
            emptyMessage={selectedTransferId ? 'No items received yet' : 'Select a material transfer first'}
            hideDeleteButton
            saveButtonLabel="Receive"
          />
          {tableError ? <div style={{ color: 'red', marginTop: 8 }}>{tableError}</div> : null}
        </div>
      )}
      onValidate={async (values) => {
        const errors = {};
        if (!values.transferId && !selectedTransferId) {
          errors.transferId = 'Material Transfer is required';
          setTableError(errors.transferId);
        } else if (!tableData.items || (Array.isArray(tableData.items) && tableData.items.length === 0)) {
          errors.transferId = 'At least one receive item is required';
          setTableError(errors.transferId);
        } else if (
          (isPartiallyReceived || anyReceivedThisPass) &&
          (tableData.items || []).some((it) => {
            const quantity = Number(it.quantity || 0);
            const received = Number(it.receivedQuantity || 0);
            const isLinePartiallyReceived = received < quantity;
            return isLinePartiallyReceived && !String(it.remarks || '').trim();
          })
        ) {
          errors.transferId = 'Remarks are required for partially received items';
          setTableError(errors.transferId);
        } else {
          setTableError('');
        }
        return errors;
      }}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={headerActions}
    />
  );
}