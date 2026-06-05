'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Landing from '../ui/Landing/Landing';
import { getInventoryMovements } from '@/services/InventoryMovement';
import { getRacks } from '@/services/Rack';
import { getMaterials } from '@/services/Materials';

const quantityFormat = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const baseColumns = [
  { header: 'Reference No.', key: 'referenceNumber' },
  { header: 'Reference Id', key: 'referenceId' },
  { header: 'Rack', key: 'rackId' },
  { header: 'Material', key: 'materialId' },
  {
    header: 'Quantity Before',
    key: 'quantityBefore',
    render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityBefore)}</div>,
  },
  {
    header: 'Quantity Change',
    key: 'quantityChange',
    render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityChange)}</div>,
  },
  {
    header: 'Quantity After',
    key: 'quantityAfter',
    render: (item) => <div style={{ textAlign: 'right' }}>{quantityFormat(item.quantityAfter)}</div>,
  },
  { header: 'Action Type', key: 'actionType' },
  { header: 'Mode', key: 'mode' },
];

export default function InventoryMovementLanding() {
  const [movements, setMovements] = useState([]);
  const [racks, setRacks] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const [movementRes, rackRes, materialRes] = await Promise.all([
        getInventoryMovements(),
        getRacks(),
        getMaterials(),
      ]);

      if (cancelled) return;

      if (!movementRes?.error) {
        const data = movementRes?.data;
        if (Array.isArray(data)) setMovements(data);
        else if (Array.isArray(data?.value)) setMovements(data.value);
        else setMovements([]);
      } else {
        setMovements([]);
      }

      if (!rackRes?.error) setRacks(Array.isArray(rackRes?.data) ? rackRes.data : []);
      else setRacks([]);

      if (!materialRes?.error) setMaterials(Array.isArray(materialRes?.data) ? materialRes.data : []);
      else setMaterials([]);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const rackMap = useMemo(
    () =>
      (racks || []).reduce((acc, r) => {
        acc[r.id] = r.name || r.code || r.id;
        return acc;
      }, {}),
    [racks]
  );

  const materialMap = useMemo(
    () =>
      (materials || []).reduce((acc, m) => {
        acc[m.id] = m.name || m.code || m.id;
        return acc;
      }, {}),
    [materials]
  );

  const columns = useMemo(() => {
    return baseColumns.map((col) => {
      if (col.key === 'rackId') {
        return {
          ...col,
          render: (item) => rackMap[item.rackId] || item.rackId || '',
        };
      }
      if (col.key === 'materialId') {
        return {
          ...col,
          render: (item) => materialMap[item.materialId] || item.materialId || '',
        };
      }
      return col;
    });
  }, [rackMap, materialMap]);

  const stats = useMemo(() => {
    const list = Array.isArray(movements) ? movements : [];
    const total = list.length;
    const totalIncrease = list.reduce(
      (sum, item) => sum + (Number(item.quantityChange) > 0 ? Number(item.quantityChange) : 0),
      0
    );
    const totalDecrease = list.reduce(
      (sum, item) => sum + (Number(item.quantityChange) < 0 ? Math.abs(Number(item.quantityChange)) : 0),
      0
    );
    const netChange = list.reduce((sum, item) => sum + (Number(item.quantityChange) || 0), 0);

    return [
      { key: 'total', label: 'Total Movements', number: total, change: `${total} records`, isPositive: true },
      {
        key: 'increase',
        label: 'Total Increase',
        number: quantityFormat(totalIncrease),
        change: `${quantityFormat(totalIncrease)} units`,
        isPositive: true,
      },
      {
        key: 'decrease',
        label: 'Total Decrease',
        number: quantityFormat(totalDecrease),
        change: `${quantityFormat(totalDecrease)} units`,
        isPositive: false,
      },
      {
        key: 'net',
        label: 'Net Change',
        number: quantityFormat(netChange),
        change: `${quantityFormat(netChange)} units`,
        isPositive: netChange >= 0,
      },
    ];
  }, [movements]);

  const filterFn = (item, keyword) =>
    [
      item.referenceId,
      item.referenceNumber,
      item.actionType,
      item.mode,
      item.rackId,
      item.materialId,
      rackMap[item.rackId],
      materialMap[item.materialId],
      item.quantityBefore,
      item.quantityChange,
      item.quantityAfter,
    ]
      .filter((v) => v !== undefined && v !== null && v !== '')
      .some((v) => String(v).toLowerCase().includes(keyword));

  return (
    <Landing
      title="Inventory Movement"
      data={movements}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search movements"
      emptyMessage="No inventory movements found"
      width="320px"
      filterFn={filterFn}
    />
  );
}