import * as XLSX from 'xlsx';

/**
 * Universal MediGlaxo Branded Excel (.xlsx) Report Exporter
 * Generates official pharmaceutical reports with company headers, metadata,
 * auto-formatted column widths, and summary rows.
 */

const COMPANY_NAME = 'MEDIGLAXO PHARMA PRIVATE LIMITED';
const PORTAL_URL = 'https://mgpjn.com';

export function downloadBrandedExcel({
  reportTitle = 'REPORT',
  subtitle = '',
  columns = [],
  data = [],
  totals = null,
  fileName = 'mediglaxo_report',
  generatedBy = 'MediGlaxo Central Administration'
}) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Construct official header banner rows
  const sheetRows = [
    [COMPANY_NAME],
    [reportTitle.toUpperCase()],
    [subtitle ? `${subtitle} | Generated on: ${formattedDate} at ${formattedTime} | By: ${generatedBy} | Portal: ${PORTAL_URL}` : `Generated on: ${formattedDate} at ${formattedTime} | By: ${generatedBy} | Portal: ${PORTAL_URL}`],
    [], // Blank separator row
    columns.map(col => col.header) // Column headers row (Index 4)
  ];

  // Append data rows
  data.forEach((item, rowIdx) => {
    const row = columns.map(col => {
      const val = typeof col.accessor === 'function' ? col.accessor(item, rowIdx) : item[col.accessor];
      return val !== undefined && val !== null ? val : '';
    });
    sheetRows.push(row);
  });

  // Optional totals/summary row
  if (totals && Array.isArray(totals)) {
    sheetRows.push([]); // blank separator
    sheetRows.push(totals);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetRows);

  // Calculate dynamic column widths based on cell content
  const colWidths = columns.map((col, cIdx) => {
    let maxLen = col.header ? col.header.toString().length : 12;
    data.forEach(item => {
      const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
      if (val !== undefined && val !== null) {
        const len = val.toString().length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });
  ws['!cols'] = colWidths;

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  const safeSheetName = reportTitle.slice(0, 30).replace(/[:\\\/?*\[\]]/g, '');
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName || 'Report');

  // Trigger file download
  const cleanFileName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, cleanFileName);
}

/**
 * 1. Sales & Orders Report Exporter
 */
export function exportSalesReport(orders = [], meta = {}) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'Order Number', accessor: (o) => o.order_number || `ORD#${o.id}` },
    { header: 'Date & Time', accessor: (o) => o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : 'N/A' },
    { header: 'Customer Name', accessor: (o) => o.customer_name || o.user?.name || 'Walk-in Customer' },
    { header: 'Contact Mobile', accessor: (o) => o.phone || o.user?.phone || 'N/A' },
    { header: 'Delivery City', accessor: (o) => o.city || 'N/A' },
    { header: 'Pincode', accessor: (o) => o.pincode || 'N/A' },
    { header: 'Assigned Sub-Retailer', accessor: (o) => o.assigned_sub_retailer ? `${o.assigned_sub_retailer.name} (${o.assigned_sub_retailer.pincode})` : 'Central Warehouse' },
    { header: 'Order Status', accessor: (o) => (o.order_status || 'Pending').toUpperCase() },
    { header: 'Payment Mode', accessor: (o) => (o.payment_method || 'COD').toUpperCase() },
    { header: 'Payment Status', accessor: (o) => (o.payment_status || 'Pending').toUpperCase() },
    { header: 'Items Count', accessor: (o) => o.items ? o.items.length : 1 },
    { header: 'Wallet Used (₹)', accessor: (o) => Number(o.wallet_amount_used || 0).toFixed(2) },
    { header: 'Subtotal (₹)', accessor: (o) => Number(o.subtotal || o.total_amount || 0).toFixed(2) },
    { header: 'Total Paid (₹)', accessor: (o) => Number(o.total_amount || 0).toFixed(2) }
  ];

  const totalAmount = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalWalletUsed = orders.reduce((sum, o) => sum + (Number(o.wallet_amount_used) || 0), 0);

  const totalsRow = [
    'TOTALS',
    `Total Orders: ${orders.length}`,
    '', '', '', '', '', '', '', '', '',
    '',
    `₹${totalWalletUsed.toFixed(2)}`,
    '',
    `₹${totalAmount.toFixed(2)}`
  ];

  downloadBrandedExcel({
    reportTitle: 'Official Pharmaceutical Sales & Orders Report',
    subtitle: `Comprehensive Audit of Customer & Wholesale Medicine Orders (Total Value: ₹${totalAmount.toFixed(2)})`,
    columns,
    data: orders,
    totals: totalsRow,
    fileName: 'MediGlaxo_Sales_Report',
    generatedBy: meta.userName || 'Super Admin'
  });
}

/**
 * 2. Stock & Inventory Audit Report Exporter
 */
export function exportStockReport(products = [], meta = {}) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'Product ID', accessor: 'id' },
    { header: 'Product Name', accessor: 'name' },
    { header: 'Category', accessor: (p) => p.category?.name || p.category_name || 'General' },
    { header: 'Dosage Form', accessor: (p) => p.dosage_form || p.sub_category_name || 'Tablet' },
    { header: 'Box Packaging', accessor: (p) => p.box_packing || '1 Box (10 Strips)' },
    { header: 'Batch No', accessor: (p) => p.batch_no || 'STD-BATCH' },
    { header: 'MRP (₹)', accessor: (p) => Number(p.mrp || 0).toFixed(2) },
    { header: 'Base Cost Price (₹)', accessor: (p) => Number(p.base_price || 0).toFixed(2) },
    { header: 'Configured Rate (₹)', accessor: (p) => Number(p.product_price || p.end_user_price || p.price || 0).toFixed(2) },
    { header: 'Stock Units', accessor: (p) => Number(p.stock || 0) },
    { header: 'Total Stock Valuation (₹)', accessor: (p) => (Number(p.stock || 0) * Number(p.base_price || p.price || 0)).toFixed(2) },
    { header: 'Stock Status', accessor: (p) => Number(p.stock || 0) <= 0 ? 'OUT OF STOCK' : Number(p.stock || 0) <= 25 ? 'LOW STOCK' : 'HEALTHY' }
  ];

  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValuation = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.base_price) || Number(p.price) || 0)), 0);

  const totalsRow = [
    'TOTALS',
    `Total SKUs: ${products.length}`,
    '', '', '', '', '', '', '', '',
    `${totalStockUnits} Units`,
    `₹${totalValuation.toFixed(2)}`,
    ''
  ];

  downloadBrandedExcel({
    reportTitle: 'Central Stock & Inventory Audit Report',
    subtitle: `Real-time Warehouse Valuation & Inventory Status (Total Valuation: ₹${totalValuation.toFixed(2)})`,
    columns,
    data: products,
    totals: totalsRow,
    fileName: 'MediGlaxo_Stock_Inventory_Report',
    generatedBy: meta.userName || 'Super Admin'
  });
}

/**
 * 3. 3-Level Referral Commissions & Earnings Report Exporter
 */
export function exportCommissionsReport(commissions = [], meta = {}) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'Date & Time', accessor: (c) => c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : 'N/A' },
    { header: 'Commission ID', accessor: (c) => `COMM#${c.id}` },
    { header: 'Beneficiary Name', accessor: (c) => c.recipient?.name || c.user?.name || `Partner #${c.user_id}` },
    { header: 'Beneficiary Role', accessor: (c) => (c.recipient?.role || c.user?.role || 'Partner').replace('_', ' ').toUpperCase() },
    { header: 'Order ID', accessor: (c) => c.order?.order_number || `ORD#${c.order_id}` },
    { header: 'Purchased By', accessor: (c) => c.from_user?.name || c.fromUser?.name || 'Customer' },
    { header: 'Medicine / Product', accessor: (c) => c.product?.name || c.description || 'Order Items' },
    { header: 'Referral Level', accessor: (c) => `Level ${c.level || 1}` },
    { header: 'Commission %', accessor: (c) => `${Number(c.percentage || 0).toFixed(1)}%` },
    { header: 'Earned Amount (₹)', accessor: (c) => Number(c.commission_amount || c.amount || 0).toFixed(2) },
    { header: 'Status', accessor: (c) => (c.status || 'PAID').toUpperCase() }
  ];

  const totalCommissions = commissions.reduce((sum, c) => sum + (Number(c.commission_amount || c.amount) || 0), 0);

  const totalsRow = [
    'TOTALS',
    `Total Records: ${commissions.length}`,
    '', '', '', '', '', '', '', '',
    `₹${totalCommissions.toFixed(2)}`,
    ''
  ];

  downloadBrandedExcel({
    reportTitle: '3-Level Dynamic Referral Commissions Audit Report',
    subtitle: `Network Referral Payouts & Commission Distributions (Total Distributed: ₹${totalCommissions.toFixed(2)})`,
    columns,
    data: commissions,
    totals: totalsRow,
    fileName: 'MediGlaxo_Commissions_Report',
    generatedBy: meta.userName || 'Super Admin'
  });
}

/**
 * 4. Medicine Purchase Orders (PO) Report Exporter
 */
export function exportPurchaseOrdersReport(purchaseOrders = [], meta = {}) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'PO Number', accessor: (po) => po.po_number || `PO#${po.id}` },
    { header: 'Date', accessor: (po) => po.created_at ? new Date(po.created_at).toLocaleDateString('en-IN') : 'N/A' },
    { header: 'Ordering Partner', accessor: (po) => po.user?.name || 'Partner' },
    { header: 'Partner Role', accessor: (po) => (po.user?.role || 'Distributor').replace('_', ' ').toUpperCase() },
    { header: 'State / Region', accessor: (po) => po.user?.state || 'GUJARAT' },
    { header: 'Requested Boxes', accessor: (po) => po.total_boxes || po.items?.reduce((s, i) => s + (i.requested_quantity || 0), 0) || 0 },
    { header: 'Approved Boxes', accessor: (po) => po.items?.reduce((s, i) => s + (i.approved_quantity || 0), 0) || 0 },
    { header: 'Total Value (₹)', accessor: (po) => Number(po.total_amount || 0).toFixed(2) },
    { header: 'Approval Status', accessor: (po) => (po.status || 'Pending').toUpperCase() },
    { header: 'Admin Remarks', accessor: (po) => po.admin_notes || 'None' }
  ];

  const totalValue = purchaseOrders.reduce((sum, po) => sum + (Number(po.total_amount) || 0), 0);

  const totalsRow = [
    'TOTALS',
    `Total POs: ${purchaseOrders.length}`,
    '', '', '', '', '', '',
    `₹${totalValue.toFixed(2)}`,
    '', ''
  ];

  downloadBrandedExcel({
    reportTitle: 'B2B Medicine Purchase Orders (PO) Register',
    subtitle: `Bulk Stock Indents & Dispatch Register (Total PO Value: ₹${totalValue.toFixed(2)})`,
    columns,
    data: purchaseOrders,
    totals: totalsRow,
    fileName: 'MediGlaxo_Purchase_Orders_Report',
    generatedBy: meta.userName || 'Super Admin'
  });
}

/**
 * 5. Network Members & Partner Directory Exporter
 */
export function exportMembersReport(members = [], meta = {}) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'Referral Code', accessor: (m) => m.referral_code || `MG${m.id}` },
    { header: 'Member Name', accessor: (m) => m.name || m.business_name || 'Partner' },
    { header: 'Business / Firm', accessor: (m) => m.business_name || 'N/A' },
    { header: 'Role', accessor: (m) => (m.role || 'customer').replace('_', ' ').toUpperCase() },
    { header: 'Mobile Phone', accessor: (m) => m.phone || 'N/A' },
    { header: 'Email Address', accessor: (m) => m.email || 'N/A' },
    { header: 'Sponsor / Upline', accessor: (m) => m.sponsor ? `${m.sponsor.name} (${m.sponsor.referral_code})` : 'Company / Head Office' },
    { header: 'City', accessor: (m) => m.city || 'Surat' },
    { header: 'State', accessor: (m) => m.state || 'GUJARAT' },
    { header: 'Wallet Balance (₹)', accessor: (m) => Number(m.wallet_balance || 0).toFixed(2) },
    { header: 'Total Earned (₹)', accessor: (m) => Number(m.total_earned || 0).toFixed(2) },
    { header: 'Status', accessor: (m) => (m.status || 'active').toUpperCase() },
    { header: 'Joined Date', accessor: (m) => m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : 'N/A' }
  ];

  const totalWallet = members.reduce((sum, m) => sum + (Number(m.wallet_balance) || 0), 0);
  const totalEarned = members.reduce((sum, m) => sum + (Number(m.total_earned) || 0), 0);

  const totalsRow = [
    'TOTALS',
    `Total Members: ${members.length}`,
    '', '', '', '', '', '', '', '',
    `₹${totalWallet.toFixed(2)}`,
    `₹${totalEarned.toFixed(2)}`,
    '', ''
  ];

  downloadBrandedExcel({
    reportTitle: 'Network Members & Hierarchy Directory',
    subtitle: `Registered Distribution Network & Associated Downlines (Total Members: ${members.length})`,
    columns,
    data: members,
    totals: totalsRow,
    fileName: 'MediGlaxo_Network_Members_Report',
    generatedBy: meta.userName || 'Super Admin'
  });
}

/**
 * 6. Wallet Passbook & Transaction Ledger Exporter
 */
export function exportPassbookReport(transactions = [], balance = 0, user = null) {
  const columns = [
    { header: 'S.No', accessor: (_, idx) => idx + 1 },
    { header: 'Date & Time', accessor: (t) => t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : 'N/A' },
    { header: 'Transaction Description', accessor: 'description' },
    { header: 'Category', accessor: (t) => (t.category || t.type).replace('_', ' ').toUpperCase() },
    { header: 'Type', accessor: (t) => t.type === 'credit' ? 'CREDIT (+)' : 'DEBIT (-)' },
    { header: 'Amount (₹)', accessor: (t) => `${t.type === 'credit' ? '+' : '-'}₹${Number(t.amount || 0).toFixed(2)}` },
    { header: 'Running Balance (₹)', accessor: (t) => `₹${Number(t.balance_after || 0).toFixed(2)}` },
    { header: 'Status', accessor: (t) => (t.status || 'COMPLETED').toUpperCase() }
  ];

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalsRow = [
    'TOTALS',
    `Closing Balance: ₹${Number(balance).toFixed(2)}`,
    '', '', '',
    `Net In: ₹${(totalCredit - totalDebit).toFixed(2)}`,
    `₹${Number(balance).toFixed(2)}`,
    ''
  ];

  downloadBrandedExcel({
    reportTitle: 'Official Wallet Passbook & Ledger Statement',
    subtitle: `Account Statement for: ${user?.name || 'Partner'} (${user?.role?.replace('_', ' ')?.toUpperCase() || 'USER'}) | Available Balance: ₹${Number(balance).toFixed(2)}`,
    columns,
    data: transactions,
    totals: totalsRow,
    fileName: `MediGlaxo_Passbook_${user?.referral_code || 'Statement'}`,
    generatedBy: user?.name || 'Account Holder'
  });
}
