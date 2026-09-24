"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Landing from "../ui/Landing/Landing";
import { generateMaterialInventoryReport } from "../../services/MaterialInventory";
import {
  createPdfDocument,
  drawPdfHeader,
  loadPdfLogo,
  previewPdfDocument,
  renderPdfTable,
} from "../../utils/pdfTemplate";

const columns = [
  { header: "Code", key: "materialCode" },
  { header: "Name", key: "materialName" },
  { header: "Stock", key: "stockQuantity", align: "right" },
  { header: "BOM", key: "projectQuantity", align: "right" },
  { header: "Balance", key: "balance", align: "right" },
  { header: "Requested", key: "requestedQuantity", align: "right" },
  { header: "Ordered", key: "orderedQuantity", align: "right" },
  { header: "Effective", key: "effectiveQuantity", align: "right" },
];

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

  const stats = useMemo(() => {
    const total = items.length;
    const totalEffective = items.reduce(
      (s, i) => s + (Number(i.effectiveQuantity) || 0),
      0
    );
    return [
      {
        key: "total",
        label: "Materials",
        number: total,
        change: `${total} items`,
        isPositive: true,
      },
      {
        key: "effective",
        label: "Effective Quantity",
        number: totalEffective,
        change: `${totalEffective} units`,
        isPositive: true,
      },
    ];
  }, [items]);

  const filterFn = (it, k) => {
    const ks = k || "";
    return [it.materialCode, it.materialName]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(ks));
  };

  const handlePrintReport = useCallback(async () => {
    if (!items.length) return;

    let logoInfo = null;
    try {
      logoInfo = await loadPdfLogo();
    } catch {
      logoInfo = null; // fall back to no-logo header if it fails to load
    }

    const doc = createPdfDocument({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const marginLeft = 14;
    const marginRight = 14;
    const tableStartY = drawPdfHeader(doc, {
      logoInfo,
      title: "MATERIAL INVENTORY REPORT",
    });

    const pdfHeaders = [
      "Material Description",
      "Warehouse",
      "BOM",
      "Balance",
      "Request",
      "Orders",
      "Effective Qty",
    ];

    const pdfBody = items.map((item) => {
      const balance =
        item.balance ??
        (Number(item.stockQuantity) || 0) - (Number(item.projectQuantity) || 0);

      return [
        "", // description drawn manually in didDrawCell
        item.stockQuantity ?? 0,
        item.projectQuantity ?? 0,
        balance,
        item.requestedQuantity ?? 0,
        item.orderedQuantity ?? 0,
        item.effectiveQuantity ?? 0,
      ];
    });

    // Description column's width is fixed via columnStyles below. We use
    // this constant directly for wrapping instead of reading
    // data.cell.width inside didParseCell — at that point in autoTable's
    // layout pass the cell width isn't reliably finalized yet (it can
    // come back undefined/NaN), which silently breaks every width
    // comparison in the wrap loop and forces one word per line.
    const DESCRIPTION_COL_WIDTH = 70;
    const DESCRIPTION_CELL_PADDING = 2;
    const DESCRIPTION_MAX_WIDTH =
      DESCRIPTION_COL_WIDTH - DESCRIPTION_CELL_PADDING * 2;

    // Cache of wrapped lines per row, so cell height (didParseCell) and
    // actual rendering (didDrawCell) always agree on line count.
    const descriptionLineCache = new Map();

    const wrapDescription = (code, name, maxWidth) => {
      doc.setFontSize(8);

      doc.setFont(undefined, "bold");
      const codeWidth = doc.getTextWidth(`${code} `);
      doc.setFont(undefined, "normal");

      const firstLineWidth = Math.max(maxWidth - codeWidth, maxWidth * 0.3);

      // Wrap the name into: a first line that shares space with the code,
      // then subsequent lines using the full cell width.
      const words = name.split(/\s+/).filter(Boolean);
      const lines = [];
      let current = "";
      let widthForLine = firstLineWidth;

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (doc.getTextWidth(candidate) <= widthForLine || !current) {
          current = candidate;
        } else {
          lines.push(current);
          current = word;
          widthForLine = maxWidth; // subsequent lines get full width
        }
      }
      if (current) lines.push(current);
      if (lines.length === 0) lines.push("");

      return { lines, codeWidth };
    };

    renderPdfTable(doc, {
      startY: tableStartY,
      head: [pdfHeaders],
      body: pdfBody,
      margin: { left: marginLeft, right: marginRight, top: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "top",
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
        minCellHeight: 0,
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39],
        fontStyle: "bold",
        lineColor: [209, 213, 219],
        lineWidth: 0.2,
      },
      bodyStyles: {
        lineColor: [229, 231, 235],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: "right", cellWidth: "auto" },
        2: { halign: "right", cellWidth: "auto" },
        3: { halign: "right", cellWidth: "auto" },
        4: { halign: "right", cellWidth: "auto" },
        5: { halign: "right", cellWidth: "auto" },
        6: { halign: "right", cellWidth: "auto" },
      },
      theme: "grid",
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 0) return;

        const item = items[data.row.index];
        const code = item?.materialCode || "";
        const name = item?.materialName || "";

        const wrapped = wrapDescription(code, name, DESCRIPTION_MAX_WIDTH);
        descriptionLineCache.set(data.row.index, wrapped);

        // One text-array entry per rendered line, so autoTable sizes the
        // row correctly (actual text is drawn manually in didDrawCell).
        data.cell.text = new Array(wrapped.lines.length).fill("");
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.index !== 0) return;

        const cached = descriptionLineCache.get(data.row.index);
        if (!cached) return;

        const item = items[data.row.index];
        const code = item?.materialCode || "";
        const { lines, codeWidth } = cached;

        const x = data.cell.x + data.cell.padding("left");
        let y = data.cell.y + data.cell.padding("top") + 3;

        doc.setFontSize(8);

        // First line: bold code, then the first wrapped chunk of the name
        doc.setFont(undefined, "bold");
        doc.text(code, x, y);

        doc.setFont(undefined, "normal");
        doc.text(lines[0] || "", x + codeWidth, y);

        // Remaining lines, left-aligned under the description (no indent)
        for (let i = 1; i < lines.length; i++) {
          y += 3.6;
          doc.text(lines[i], x, y);
        }
      },
      didDrawPage: (data) => {
        if (data.pageNumber === 1) {
          drawPdfHeader(doc, {
            logoInfo,
            title: "MATERIAL INVENTORY REPORT",
          });
        }
      },
    });

    previewPdfDocument(doc);
  }, [items]);

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
      onNew={handlePrintReport}
      newButtonLabel={"Print Materials Report"}
      loading={loading}
    />
  );
}