"use client";

import React, { useEffect, useState, useMemo } from "react";
import Landing from "../ui/Landing/Landing";
import { generateMaterialInventoryReport, getDocumentPDF } from "../../services/MaterialInventory";

export default function MaterialInventoryReportLanding() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await generateMaterialInventoryReport();
        if (!mounted) return;
        if (res.error) {
          setError(res.error);
          setItems([]);
        } else {
          setItems(Array.isArray(res.data) ? res.data : []);
          setError(null);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || e);
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const columns = useMemo(
    () => [
      { header: "Code", key: "materialCode" },
      { header: "Name", key: "materialName" },
      { header: "Stock", key: "stockQuantity", align: "right" },
      { header: "Requested", key: "requestedQuantity", align: "right" },
      { header: "Ordered", key: "orderedQuantity", align: "right" },
      { header: "Effective", key: "effectiveQuantity", align: "right" },
    ],
    []
  );

  const stats = useMemo(() => {
    const total = items.length;
    const totalEffective = items.reduce((s, i) => s + (Number(i.effectiveQuantity) || 0), 0);
    return [
      { key: "total", label: "Materials", number: total, change: `${total} items`, isPositive: true },
      { key: "effective", label: "Effective Quantity", number: totalEffective, change: `${totalEffective} units`, isPositive: true },
    ];
  }, [items]);

  const filterFn = (it, k) => {
    const ks = k || "";
    return [it.materialCode, it.materialName].filter(Boolean).some((v) => String(v).toLowerCase().includes(ks));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Landing
      title="Material Inventory Report"
      data={items}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search materials"
      emptyMessage={error ? `Error: ${String(error)}` : "No records found"}
      width="320px"
      filterFn={filterFn}
      onNew={getDocumentPDF}
      newButtonLabel={"Generate Report PDF"}
    />
  );
}
