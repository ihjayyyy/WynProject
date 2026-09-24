import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.jpg";

const DEFAULT_MARGIN = { left: 14, right: 14 };

const DEFAULT_TABLE_STYLES = {
  fontSize: 8,
  cellPadding: 2,
  overflow: "linebreak",
  valign: "top",
  lineColor: [209, 213, 219],
  lineWidth: 0.2,
};

const DEFAULT_HEAD_STYLES = {
  fillColor: [243, 244, 246],
  textColor: [17, 24, 39],
  fontStyle: "bold",
  lineColor: [209, 213, 219],
  lineWidth: 0.2,
};

const DEFAULT_BODY_STYLES = {
  lineColor: [229, 231, 235],
  lineWidth: 0.2,
};

export function createPdfDocument(options = {}) {
  return new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    ...options,
  });
}

export function loadPdfLogo(src = logo) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);

      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", 1),
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = reject;
    image.src = typeof src === "string" ? src : src?.src || src;
  });
}

export function drawPdfHeader(doc, {
  logoInfo,
  title,
  subtitle = `Issued on ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`,
  leftDetails = [],
  rightDetails = [],
} = {}) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Wyn Power Corporation", margin, 14);

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Internal Use", pageWidth - margin, 14, { align: "right" });

  if (logoInfo) {
    const logoHeight = 14;
    const logoWidth = (logoInfo.width / logoInfo.height) * logoHeight;
    doc.addImage(logoInfo.dataUrl, "JPEG", margin, 19, logoWidth, logoHeight);
  }

  doc.setFont(undefined, "bold");
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 30, { align: "center" });

  doc.setFont(undefined, "normal");
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(11);
  doc.text(subtitle, pageWidth / 2, 38, { align: "center" });
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.setLineWidth(0.2);
  doc.line(
    pageWidth / 2 - subtitleWidth / 2,
    39.2,
    pageWidth / 2 + subtitleWidth / 2,
    39.2
  );

  const detailStartY = 47;
  const drawDetails = (details, x, align) => {
    doc.setFontSize(9);
    details.forEach((detail, index) => {
      doc.text(String(detail), x, detailStartY + index * 5, { align });
    });
  };

  drawDetails(leftDetails, margin, "left");
  drawDetails(rightDetails, pageWidth - margin, "right");
  doc.setTextColor(0, 0, 0);

  return Math.max(
    46,
    detailStartY + Math.max(leftDetails.length, rightDetails.length) * 5 + 2
  );
}

export function renderPdfTable(doc, options) {
  const { styles, headStyles, bodyStyles, margin, ...tableOptions } = options;

  autoTable(doc, {
    styles: { ...DEFAULT_TABLE_STYLES, ...styles },
    headStyles: { ...DEFAULT_HEAD_STYLES, ...headStyles },
    bodyStyles: { ...DEFAULT_BODY_STYLES, ...bodyStyles },
    margin: { ...DEFAULT_MARGIN, ...margin },
    theme: "grid",
    ...tableOptions,
  });
}

export function previewPdfDocument(doc) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printFrame = document.createElement("iframe");
  printFrame.setAttribute("title", "PDF print preview");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "1px";
  printFrame.style.height = "1px";
  printFrame.style.border = "0";
  printFrame.style.opacity = "0";

  const removePrintFrame = () => {
    printFrame.contentWindow?.removeEventListener(
      "afterprint",
      removePrintFrame
    );
    URL.revokeObjectURL(url);
    printFrame.remove();
  };

  printFrame.onload = () => {
    const printWindow = printFrame.contentWindow;
    if (!printWindow) {
      removePrintFrame();
      return;
    }

    printWindow.addEventListener("afterprint", removePrintFrame);
    printWindow.focus();
    printWindow.print();
  };

  printFrame.src = url;
  document.body.appendChild(printFrame);
}

