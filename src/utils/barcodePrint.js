import JsBarcode from "jsbarcode";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatLabelDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function createBarcodeSvg(value) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  JsBarcode(svg, value, {
    format: "CODE128",
    displayValue: false,
    height: 24,
    width: 1.35,
    margin: 0,
  });

  return svg.outerHTML;
}

export function openBarcodePrintPreview(items = []) {
  const labels = items
    .map((item) => {
      const barcode = String(item?.barcode ?? item?.code ?? "").trim();
      if (!barcode) return "";

      const rack = item?.rackName || item?.rack || "";
      const date = formatLabelDate(item?.createdAt || item?.updatedAt);
      const name = item?.name || item?.materialName || "";
      const barcodeSvg = createBarcodeSvg(barcode);

      return `
        <article class="label">
          <div class="label-meta">
            <span>${escapeHtml(rack)}</span>
            <span>${escapeHtml(date)}</span>
          </div>
          <div class="barcode">${barcodeSvg}</div>
          <div class="label-text">${escapeHtml(barcode)} | ${escapeHtml(name)}</div>
        </article>
      `;
    })
    .filter(Boolean)
    .join("");

  if (!labels) return false;

  const printFrame = document.createElement("iframe");
  printFrame.setAttribute("title", "Barcode print preview");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  printFrame.style.visibility = "hidden";

  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentDocument;
  const printWindow = printFrame.contentWindow;
  if (!printDocument || !printWindow) {
    printFrame.remove();
    return false;
  }

  const removePrintFrame = () => {
    printWindow.removeEventListener("afterprint", removePrintFrame);
    printFrame.remove();
  };

  printWindow.addEventListener("afterprint", removePrintFrame);
  printFrame.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  printDocument.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Barcode Labels</title>
        <style>
          :root {
            color-scheme: light;
            font-family: Arial, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #e5e7eb;
            color: #111827;
          }

          .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #111827;
            color: #ffffff;
          }

          .toolbar h1 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
          }

          .toolbar button {
            border: 0;
            border-radius: 4px;
            padding: 8px 14px;
            background: #ffffff;
            color: #111827;
            cursor: pointer;
            font-weight: 600;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 16px auto;
            padding: 8mm;
            background: #ffffff;
          }

          .label-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.5mm 4mm;
          }

          .label {
            min-width: 0;
            min-height: 18mm;
            padding: 2mm 2mm;
            border: 0.25mm solid #9ca3af;
            break-inside: avoid;
          }

          .label-meta {
            display: flex;
            justify-content: space-between;
            gap: 4px;
            min-height: 3mm;
            font-size: 6.5px;
            line-height: 1.2;
          }

          .label-meta span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .barcode {
            display: flex;
            justify-content: center;
            margin: 1.5mm 0 0;
            min-height: 8mm;
          }

          .barcode svg {
            display: block;
            max-width: 100%;
            height: 8mm;
          }

          .label-text {
            overflow-wrap: anywhere;
            text-align: center;
            font-size: 7px;
            line-height: 1.25;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }

            body {
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: auto;
              min-height: auto;
              margin: 0;
              padding: 0;
            }

            .label-grid {
              gap: 1.5mm 4mm;
            }
          }
        </style>
      </head>
      <body>
        <header class="toolbar">
          <h1>Barcode Labels</h1>
          <button type="button" onclick="window.print()">Print</button>
        </header>
        <main class="page">
          <section class="label-grid">${labels}</section>
        </main>
      </body>
    </html>
  `);
  printDocument.close();

  return true;
}
