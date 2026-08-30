import React, { useState, useMemo } from 'react';
import { TrendingUp, Package, IndianRupee, ShoppingBag, AlertTriangle, CheckCircle2, Download, Calendar, BarChart3, PieChart } from 'lucide-react';
import { exportSalesReport, exportStockReport } from '../../utils/excelExport';

/**
 * 1. Earnings & Sales Performance Chart (Interactive SVG Area + Bar Chart)
 */
export function EarningsSalesChart({ orders = [], user = null }) {
  const [timeframe, setTimeframe] = useState('7days'); // '7days' | '30days' | 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Group orders by date based on selected timeframe
  const chartData = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : (orders?.data || []);
    const daysCount = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 12;
    const now = new Date();

    if (timeframe === 'all') {
      // Group by months for current year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, mIdx) => {
        const monthOrders = safeOrders.filter(o => {
          if (!o.created_at) return false;
          const d = new Date(o.created_at);
          return d.getMonth() === mIdx && d.getFullYear() === now.getFullYear();
        });
        const sales = monthOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        return { label: month, sales, ordersCount: monthOrders.length };
      });
    }

    // Daily buckets for 7 or 30 days
    const buckets = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      const dayOrders = safeOrders.filter(o => o.created_at && o.created_at.slice(0, 10) === dateStr);
      const sales = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      buckets.push({ label, dateStr, sales, ordersCount: dayOrders.length });
    }
    return buckets;
  }, [orders, timeframe]);

  const maxSales = Math.max(...chartData.map(d => d.sales), 1000);
  const totalSales = chartData.reduce((s, d) => s + d.sales, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.ordersCount, 0);
  const avgOrderValue = totalOrders > 0 ? (totalSales / totalOrders) : 0;

  // SVG Chart Dimensions
  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Build SVG Path points
  const points = chartData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(chartData.length - 1, 1)) * chartWidth;
    const y = height - paddingY - (d.sales / maxSales) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.reduce((path, pt, i) => (
    i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`
  ), '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 animate-card-in-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">Sales &amp; Earnings Performance</h3>
            <p className="text-xs text-slate-400">Live order revenue and earnings trend analysis</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === '7days' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'}`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30days')}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === '30days' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'}`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'}`}
            >
              This Year
            </button>
          </div>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={() => exportSalesReport(orders, { userName: user?.name })}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download Official MediGlaxo Branded Sales Report in Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3">
          <span className="text-[11px] font-bold text-orange-800 block">Total Period Revenue</span>
          <div className="text-xl font-black text-orange-950 mt-0.5">₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <span className="text-[10px] text-orange-700 font-semibold">{timeframe === '7days' ? 'Last 7 Days' : timeframe === '30days' ? 'Last 30 Days' : 'Year to Date'}</span>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
          <span className="text-[11px] font-bold text-blue-800 block">Period Orders</span>
          <div className="text-xl font-black text-blue-950 mt-0.5">{totalOrders} Orders</div>
          <span className="text-[10px] text-blue-700 font-semibold">Fulfilled &amp; In-transit</span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3">
          <span className="text-[11px] font-bold text-emerald-800 block">Avg. Order Value (AOV)</span>
          <div className="text-xl font-black text-emerald-950 mt-0.5">₹{avgOrderValue.toFixed(2)}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Per Customer Basket</span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f15a24" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f15a24" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f15a24" />
              <stop offset="100%" stopColor="#ff7849" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + ratio * chartHeight;
            const val = maxSales * (1 - ratio);
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x={paddingX - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                  ₹{Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#salesGrad)" />
          )}

          {/* Smooth Stroke Line */}
          {linePath && (
            <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Interactive Data Point Dots */}
          {points.map((pt, idx) => (
            <g key={idx} className="cursor-pointer group" onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.label === pt.label ? "6" : "3.5"}
                fill="#ffffff"
                stroke="#f15a24"
                strokeWidth={hoveredPoint?.label === pt.label ? "3" : "2"}
                className="transition-all duration-150"
              />
              {/* X Axis Label */}
              {(idx % (timeframe === '30days' ? 4 : 1) === 0 || idx === points.length - 1) && (
                <text
                  x={pt.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {pt.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Live Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 pointer-events-none z-10"
          >
            <span className="font-bold text-orange-400">{hoveredPoint.label}:</span>
            <span className="font-black">₹{hoveredPoint.sales.toFixed(2)}</span>
            <span className="text-slate-400">({hoveredPoint.ordersCount} orders)</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Central Stock & Inventory Status Chart (Breakdown & Valuation)
 */
export function StockInventoryChart({ products = [], user = null }) {
  const safeProducts = Array.isArray(products) ? products : (products?.data || []);

  const stockSummary = useMemo(() => {
    let healthyCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalUnits = 0;
    let totalValuation = 0;

    const categoryMap = {};

    safeProducts.forEach(p => {
      const stock = Number(p.stock) || 0;
      const basePrice = Number(p.base_price || p.price || 0);
      const catName = p.category?.name || p.category_name || 'General';

      totalUnits += stock;
      totalValuation += (stock * basePrice);

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= 25) {
        lowStockCount++;
      } else {
        healthyCount++;
      }

      categoryMap[catName] = (categoryMap[catName] || 0) + stock;
    });

    const totalProducts = safeProducts.length || 1;
    return {
      healthyCount,
      lowStockCount,
      outOfStockCount,
      totalUnits,
      totalValuation,
      healthyPct: Math.round((healthyCount / totalProducts) * 100),
      lowStockPct: Math.round((lowStockCount / totalProducts) * 100),
      outOfStockPct: Math.round((outOfStockCount / totalProducts) * 100),
      categoryDistribution: Object.entries(categoryMap).slice(0, 5)
    };
  }, [safeProducts]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 animate-card-in-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">Warehouse Stock &amp; Inventory Status</h3>
            <p className="text-xs text-slate-400">Stock health, valuation, and SKU alerts</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => exportStockReport(safeProducts, { userName: user?.name })}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
          title="Download Official MediGlaxo Branded Stock Report in Excel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Stock Excel</span>
        </button>
      </div>

      {/* Top 3 Visual KPI Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Healthy Stock</span>
            <div className="text-lg font-black text-emerald-950">{stockSummary.healthyCount} SKUs</div>
            <span className="text-[10px] text-emerald-700 font-semibold">{stockSummary.healthyPct}% of inventory</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">Low Stock (≤ 25)</span>
            <div className="text-lg font-black text-amber-950">{stockSummary.lowStockCount} SKUs</div>
            <span className="text-[10px] text-amber-700 font-semibold">{stockSummary.lowStockPct}% requires refill</span>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">Out of Stock</span>
            <div className="text-lg font-black text-rose-950">{stockSummary.outOfStockCount} SKUs</div>
            <span className="text-[10px] text-rose-700 font-semibold">{stockSummary.outOfStockPct}% unavailable</span>
          </div>
        </div>
      </div>

      {/* Progress Breakdown Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Overall Inventory Distribution</span>
          <span className="text-slate-400 font-mono text-[11px]">{safeProducts.length} Total SKUs</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div style={{ width: `${stockSummary.healthyPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Healthy: ${stockSummary.healthyCount}`} />
          <div style={{ width: `${stockSummary.lowStockPct}%` }} className="bg-amber-500 h-full transition-all" title={`Low Stock: ${stockSummary.lowStockCount}`} />
          <div style={{ width: `${stockSummary.outOfStockPct}%` }} className="bg-rose-500 h-full transition-all" title={`Out of Stock: ${stockSummary.outOfStockCount}`} />
        </div>
      </div>

      {/* Valuation Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Estimated Inventory Valuation</span>
          <div className="text-xl font-black text-emerald-400">
            ₹{stockSummary.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Available Physical Stock</span>
          <div className="text-lg font-black text-white font-mono">{stockSummary.totalUnits.toLocaleString('en-IN')} Units</div>
        </div>
      </div>
    </div>
  );
}
