const DEFAULT_MODULE_OPTIONS = [
  { label: 'Inquiry', value: 'inquiry' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Project', value: 'project' },
  { label: 'Sales Billing', value: 'salesbilling' },
  { label: 'Sales Collection', value: 'salescollection' },
  { label: 'Purchase Request', value: 'purchaserequest' },
  { label: 'Purchase Order', value: 'purchaseorder' },
  { label: 'Purchase Invoice', value: 'purchaseinvoice' },
  { label: 'Purchase Delivery', value: 'purchasedelivery' },
  { label: 'Inventory Movement', value: 'inventoryMovement' },
  { label: 'Customer', value: 'customer' },
  { label: 'Supplier', value: 'supplier' },
];

const DEFAULT_MODULE_OPTION_BY_VALUE = new Map(
  DEFAULT_MODULE_OPTIONS.map((option) => [String(option.value).toLowerCase(), option.label])
);

const SUPPLIER_FILTER_MODULES = ['purchaseorder', 'purchaseinvoice', 'purchasedelivery'];
const RACK_FILTER_MODULE = 'inventoryMovement';

const MODULE_ACCESS_REQUIREMENTS = {
  inquiry: ['Inquiry', 'Inquiries'],
  proposal: ['Projects.Proposal'],
  project: ['Projects.Projects'],
  salesbilling: ['Finance.SalesBilling', 'Finance.Billings'],
  salescollection: ['Finance.Collection', 'Finance.Collections'],
  purchaserequest: ['Purchase.Requests'],
  purchaseorder: ['Purchase.Orders'],
  purchaseinvoice: ['Purchase.Invoices'],
  purchasedelivery: ['Purchase.Deliveries'],
  inventorymovement: ['Inventory.InventoryMovement', 'Inventory.Report'],
  customer: ['Customers', 'Customer'],
  supplier: ['Suppliers', 'Supplier'],
};

const MODULE_STATUS_FILTERS = {
  inquiry: [
    { label: 'New', value: 'New' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ],
  proposal: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Win', value: 'Win' },
    { label: 'Lose', value: 'Lose' },
    { label: 'Close', value: 'Close' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Pending', value: 'Pending' },
    { label: 'ForApproval', value: 'ForApproval' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
  ],
  project: [
    { label: 'NotStarted', value: 'NotStarted' },
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Closed', value: 'Closed' },
  ],
  salesbilling: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Billed', value: 'Billed' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'PartiallyPaid', value: 'PartiallyPaid' },
    { label: 'Paid', value: 'Paid' },
  ],
  salescollection: [
    { label: 'Draft', value: 'Draft' },
    { label: 'PartiallyPaid', value: 'PartiallyPaid' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Closed', value: 'Closed' },
  ],
  purchaserequest: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Ordered', value: 'Ordered' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Cancelled', value: 'Cancelled' },
  ],
  purchaseorder: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Ordered', value: 'Ordered' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Partial', value: 'Partial' },
    { label: 'Delivered', value: 'Delivered' },
  ],
  purchaseinvoice: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Invoiced', value: 'Invoiced' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'PartiallyPaid', value: 'PartiallyPaid' },
    { label: 'Paid', value: 'Paid' },
  ],
  purchasedelivery: [
    { label: 'Draft', value: 'Draft' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Cancelled', value: 'Cancelled' },
  ],
  inventorymovement: [
    { label: 'Addition', value: 'Addition' },
    { label: 'Deduction', value: 'Deduction' },
    { label: 'Adjustment', value: 'Adjustment' },
    { label: 'Delivery', value: 'Delivery' },
    { label: 'TransferToProject', value: 'TransferToProject' },
    { label: 'TransferToWarehouse', value: 'TransferToWarehouse' },
    { label: 'ManualAdjustment', value: 'ManualAdjustment' },
  ],
  // Customer and Supplier are reference/master data — no workflow statuses
  customer: [],
  supplier: [],
};

const getStatusOptionsForModule = (moduleValue) => {
  const moduleKey = normalizeModuleValue(moduleValue);
  const options = MODULE_STATUS_FILTERS[moduleKey] || [];
  return [{ label: 'All Status', value: '' }, ...options];
};

const normalizeModuleValue = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const toModuleLabel = (value) => {
  const normalized = normalizeModuleValue(value);
  const fromDefault = DEFAULT_MODULE_OPTION_BY_VALUE.get(normalized);
  if (fromDefault) return fromDefault;

  const source = String(value || '').trim();
  if (source) return source;

  return '-';
};

const getReportColumns = ({ moduleKey, asText, formatDate, formatDateTime, formatCurrency, StatusBadge, styles }) => {
  const commonStatus = {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  };

  // ── Inquiry ──────────────────────────────────────────────────────────────
  if (moduleKey === 'inquiry') {
    return [
      { header: 'Inquiry No', key: 'inquiryNo', render: (item) => asText(item.raw?.inquiryNo) },
      { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
      { header: 'Company', key: 'companyName', render: (item) => asText(item.raw?.companyName) },
      { header: 'Contact Person', key: 'contactPerson', render: (item) => asText(item.raw?.contactPerson) },
      { header: 'Email', key: 'email', render: (item) => asText(item.raw?.email) },
      { header: 'Date', key: 'date', render: (item) => formatDate(item.raw?.date) },
      commonStatus,
    ];
  }

  // ── Proposal ─────────────────────────────────────────────────────────────
  if (moduleKey === 'proposal') {
    return [
      { header: 'Proposal No', key: 'proposalNo', render: (item) => asText(item.raw?.proposalNo) },
      { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
      { header: 'Start Date', key: 'forecastedStartDate', render: (item) => formatDate(item.raw?.forecastedStartDate) },
      {
        header: 'Proposal Total',
        key: 'proposalTotal',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.proposalTotal),
      },
      commonStatus,
      {
        header: 'Approval',
        key: 'approvalStatus',
        render: (item) => <StatusBadge status={asText(item.raw?.approvalStatus)} />,
      },
    ];
  }

  // ── Project ───────────────────────────────────────────────────────────────
  if (moduleKey === 'project') {
    return [
      { header: 'Project No', key: 'projectNo', render: (item) => asText(item.raw?.projectNo) },
      { header: 'Company', key: 'companyName', render: (item) => asText(item.raw?.companyName) },
      { header: 'Start Date', key: 'startDate', render: (item) => formatDate(item.raw?.startDate) },
      { header: 'End Date', key: 'endDate', render: (item) => formatDate(item.raw?.endDate) },
      {
        header: 'Contract Price',
        key: 'contractPrice',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.contractPrice),
      },
      {
        header: 'Progress %',
        key: 'overallProgress',
        align: 'right',
        render: (item) => `${Number(item.raw?.overallProgress || 0).toFixed(2)}%`,
      },
      commonStatus,
    ];
  }

  // ── Sales Billing ─────────────────────────────────────────────────────────
  if (moduleKey === 'salesbilling') {
    return [
      { header: 'Billing No', key: 'salesBillingNo', render: (item) => asText(item.raw?.salesBillingNo) },
      { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
      { header: 'Billing Date', key: 'billingDate', render: (item) => formatDate(item.raw?.billingDate) },
      { header: 'Due Date', key: 'dueDate', render: (item) => formatDate(item.raw?.dueDate) },
      {
        header: 'Amount',
        key: 'amount',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.amount),
      },
      {
        header: 'Balance',
        key: 'balance',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.balance),
      },
      commonStatus,
      {
        header: 'Payment',
        key: 'paymentStatus',
        render: (item) => <StatusBadge status={asText(item.raw?.paymentStatus)} />,
      },
    ];
  }

  // ── Sales Collection ──────────────────────────────────────────────────────
  if (moduleKey === 'salescollection') {
    return [
      { header: 'Collection No', key: 'collectionNo', render: (item) => asText(item.raw?.collectionNo) },
      { header: 'Receipt No', key: 'receiptNumber', render: (item) => asText(item.raw?.receiptNumber) },
      { header: 'Customer', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
      { header: 'Date', key: 'date', render: (item) => formatDate(item.raw?.date) },
      {
        header: 'Amount',
        key: 'amount',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.amount),
      },
      {
        header: 'Total Paid',
        key: 'totalAmountPaid',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.totalAmountPaid),
      },
      commonStatus,
    ];
  }

  // ── Purchase Request ──────────────────────────────────────────────────────
  if (moduleKey === 'purchaserequest') {
    return [
      { header: 'Request No', key: 'requestNumber', render: (item) => asText(item.raw?.requestNumber) },
      { header: 'Project', key: 'projectName', render: (item) => asText(item.raw?.projectName) },
      { header: 'Requested By', key: 'requestedBy', render: (item) => asText(item.raw?.requestedBy) },
      { header: 'Request Date', key: 'requestDate', render: (item) => formatDate(item.raw?.requestDate) },
      commonStatus,
    ];
  }

  // ── Purchase Order ────────────────────────────────────────────────────────
  if (moduleKey === 'purchaseorder') {
    return [
      { header: 'Order No', key: 'orderNumber', render: (item) => asText(item.raw?.orderNumber) },
      { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
      { header: 'Order Date', key: 'orderDate', render: (item) => formatDate(item.raw?.orderDate) },
      {
        header: 'Est. Delivery',
        key: 'estimatedDeliveryDate',
        render: (item) => formatDate(item.raw?.estimatedDeliveryDate),
      },
      {
        header: 'Amount',
        key: 'amount',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.amount),
      },
      commonStatus,
      {
        header: 'Delivery',
        key: 'deliveryStatus',
        render: (item) => <StatusBadge status={asText(item.raw?.deliveryStatus)} />,
      },
    ];
  }

  // ── Purchase Invoice ──────────────────────────────────────────────────────
  if (moduleKey === 'purchaseinvoice') {
    return [
      { header: 'Invoice No', key: 'invoiceNumber', render: (item) => asText(item.raw?.invoiceNumber) },
      { header: 'PO No', key: 'purchaseOrderNumber', render: (item) => asText(item.raw?.purchaseOrderNumber) },
      { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
      { header: 'Invoice Date', key: 'invoiceDate', render: (item) => formatDate(item.raw?.invoiceDate) },
      { header: 'Due Date', key: 'dueDate', render: (item) => formatDate(item.raw?.dueDate) },
      {
        header: 'Amount',
        key: 'amount',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.amount),
      },
      {
        header: 'Balance',
        key: 'balance',
        align: 'right',
        render: (item) => formatCurrency(item.raw?.balance),
      },
      commonStatus,
      {
        header: 'Payment',
        key: 'paymentStatus',
        render: (item) => <StatusBadge status={asText(item.raw?.paymentStatus)} />,
      },
    ];
  }

  // ── Purchase Delivery ─────────────────────────────────────────────────────
  if (moduleKey === 'purchasedelivery') {
    return [
      { header: 'Delivery No', key: 'deliveryNumber', render: (item) => asText(item.raw?.deliveryNumber) },
      { header: 'Order No', key: 'orderNumber', render: (item) => asText(item.raw?.orderNumber) },
      { header: 'Supplier', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
      { header: 'Delivery Date', key: 'deliveryDate', render: (item) => formatDate(item.raw?.deliveryDate) },
      commonStatus,
    ];
  }

  // ── Inventory Movement ────────────────────────────────────────────────────
  if (moduleKey === 'inventorymovement') {
    return [
      { header: 'Reference No', key: 'referenceNumber', render: (item) => asText(item.raw?.referenceNumber) },
      { header: 'Material', key: 'materialName', render: (item) => asText(item.raw?.materialName) },
      { header: 'Action Type', key: 'actionType', render: (item) => asText(item.raw?.actionType) },
      { header: 'Mode', key: 'mode', render: (item) => asText(item.raw?.mode) },
      {
        header: 'Before',
        key: 'quantityBefore',
        align: 'right',
        render: (item) => Number(item.raw?.quantityBefore || 0).toLocaleString(),
      },
      {
        header: 'Change',
        key: 'quantityChange',
        align: 'right',
        render: (item) => Number(item.raw?.quantityChange || 0).toLocaleString(),
      },
      {
        header: 'After',
        key: 'quantityAfter',
        align: 'right',
        render: (item) => Number(item.raw?.quantityAfter || 0).toLocaleString(),
      },
      { header: 'Created At', key: 'createdAt', render: (item) => formatDateTime(item.raw?.createdAt) },
    ];
  }

  // ── Customer ──────────────────────────────────────────────────────────────
  if (moduleKey === 'customer') {
    return [
      { header: 'Code', key: 'code', render: (item) => asText(item.raw?.code) },
      { header: 'Customer Name', key: 'customerName', render: (item) => asText(item.raw?.customerName) },
      { header: 'Contact No', key: 'contactNumber', render: (item) => asText(item.raw?.contactNumber) },
      { header: 'Email', key: 'email', render: (item) => asText(item.raw?.email) },
      { header: 'Address', key: 'address', render: (item) => asText(item.raw?.address) },
      { header: 'VAT Type', key: 'vatType', render: (item) => asText(item.raw?.vatType) },
      {
        header: 'Terms (days)',
        key: 'terms',
        align: 'right',
        render: (item) => asText(item.raw?.terms ?? '-'),
      },
    ];
  }

  // ── Supplier ──────────────────────────────────────────────────────────────
  if (moduleKey === 'supplier') {
    return [
      { header: 'Code', key: 'code', render: (item) => asText(item.raw?.code) },
      { header: 'Supplier Name', key: 'supplierName', render: (item) => asText(item.raw?.supplierName) },
      { header: 'Contact Person', key: 'contactPerson', render: (item) => asText(item.raw?.contactPerson) },
      { header: 'Contact No', key: 'contactNumber', render: (item) => asText(item.raw?.contactNumber) },
      { header: 'Email', key: 'email', render: (item) => asText(item.raw?.email) },
      { header: 'Address', key: 'address', render: (item) => asText(item.raw?.address) },
      { header: 'VAT Type', key: 'vatType', render: (item) => asText(item.raw?.vatType) },
      {
        header: 'Terms (days)',
        key: 'terms',
        align: 'right',
        render: (item) => asText(item.raw?.terms ?? '-'),
      },
    ];
  }

  // ── Fallback (all/unknown module) ─────────────────────────────────────────
  return [
    { header: 'Module', key: 'module' },
    { header: 'Reference No', key: 'referenceNo' },
    { header: 'Party', key: 'partyName' },
    { header: 'Date', key: 'primaryDate' },
    {
      header: 'Amount',
      key: 'amount',
      align: 'right',
      render: (item) => formatCurrency(item.amount),
    },
    commonStatus,
    {
      header: 'Details Status',
      key: 'details',
      render: (item) =>
        item.detailStatuses.length ? (
          <div className={styles.detailsWrap}>
            {item.detailStatuses.map((entry) => (
              <StatusBadge key={`${item.key}-${entry}`} status={entry} className={styles.detailBadge} />
            ))}
          </div>
        ) : (
          '-'
        ),
    },
  ];
};

export {
  DEFAULT_MODULE_OPTIONS,
  MODULE_ACCESS_REQUIREMENTS,
  MODULE_STATUS_FILTERS,
  SUPPLIER_FILTER_MODULES,
  RACK_FILTER_MODULE,
  normalizeModuleValue,
  toModuleLabel,
  getStatusOptionsForModule,
  getReportColumns,
};