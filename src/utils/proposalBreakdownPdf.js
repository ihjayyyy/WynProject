import {
    createPdfDocument,
    loadPdfLogo,
    drawPdfHeader,
    renderPdfTable,
} from './pdfTemplate';

const CURRENCY = 'PHP ';

const money = (n) =>
    CURRENCY +
    (Number(n) || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const amountOf = (child) =>
    Number(child.totalAmount) || Number(child.totalPrice) || Number(child.extendedCost) || 0;

function groupByScope(children = []) {
    const map = new Map();
    (children || []).forEach((child) => {
        if (!child) return;
        const key = String(child.scopeOfWork || '').trim() || '(No scope)';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(child);
    });
    return Array.from(map.entries()).map(([scope, rows]) => ({
        scope,
        rows,
        total: rows.reduce((sum, row) => sum + amountOf(row), 0),
    }));
}

export async function buildProposalBreakdownPdf(proposal, detailed) {
    const groups = groupByScope(proposal.children);
    const grandTotal =
        Number(proposal.proposalTotal) || groups.reduce((sum, group) => sum + group.total, 0);

    const right = { halign: 'right' };
    const shaded = { fillColor: [243, 244, 246] };
    const body = [];

    groups.forEach((group, index) => {
        body.push(
            detailed
                ? [
                    `${index + 1}.0`,
                    { content: group.scope, colSpan: 4 },
                    { content: money(group.total), styles: right },
                ]
                : [
                    `${index + 1}.0`,
                    { content: group.scope, colSpan: 2 },
                    { content: money(group.total), styles: right },
                ]
        );

        group.rows.forEach((row) => {
            const quantity = `${Number(row.quantity) || 0} ${row.uom || ''}`.trim();
            const computedUnitCost = row.unitCost * (1 + (row.laborPercentage/100)) * (1 + proposal.vatPercentage);
            body.push(
                detailed
                    ? [
                        '',
                        row.name || '',
                        { content: quantity, styles: right },
                        { content: money(computedUnitCost), styles: right },
                        { content: money(computedUnitCost * Number(row.quantity)), styles: right },
                        '',
                    ]
                    : ['', row.name || '', { content: quantity, styles: right }, '']
            );
        });
    });

    body.push(
        detailed
            ? [
                { content: '', styles: shaded },
                {
                    content: 'Total Project Cost',
                    colSpan: 4,
                    styles: { ...shaded, fontStyle: 'bold', halign: 'right' },
                },
                { content: money(grandTotal), styles: { ...shaded, fontStyle: 'bold', halign: 'right' } },
            ]
            : [
                { content: '', styles: shaded },
                { content: 'Total Project Cost', colSpan: 2, styles: { ...shaded, fontStyle: 'bold' } },
                { content: money(grandTotal), styles: { ...shaded, fontStyle: 'bold', halign: 'right' } },
            ]
    );

    const doc = createPdfDocument();
    // let logoInfo = null;
    // try {
    //     logoInfo = await loadPdfLogo();
    // } catch (error) {
    //     // Continue without a logo if the image cannot be loaded.
    // }

    // const startY = drawPdfHeader(doc, {
    //     logoInfo,
    //     title: 'Proposal Breakdown',
    //     leftDetails: [
    //         `Customer: ${proposal.customerName || ''}`,
    //         `Proposal: ${proposal.name || ''}`,
    //         proposal.location ? `Location: ${proposal.location}` : '',
    //     ].filter(Boolean),
    //     rightDetails: [
    //         `Proposal No: ${proposal.proposalNo || ''}`,
    //         `Ref No: ${proposal.customerReferenceNumber || ''}`,
    //     ],
    // });

    renderPdfTable(doc, {
        // startY: startY + 4,
        startY: 8,
        head: [detailed
            ? ['Item', 'Work Item', 'Qty', 'Unit Cost', 'Total Cost', 'Amount']
            : ['Item', 'Work Item', 'Qty', 'Amount']],
        body,
        columnStyles: detailed
            ? { 0: { cellWidth: 14 }, 2: { cellWidth: 24 }, 3: { cellWidth: 28 }, 4: { cellWidth: 28 }, 5: { cellWidth: 30 } }
            : { 0: { cellWidth: 14 }, 2: { cellWidth: 28 }, 3: { cellWidth: 34 } },
    });

    return doc;
}