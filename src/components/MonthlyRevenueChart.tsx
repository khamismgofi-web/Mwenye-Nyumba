import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Filter, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Payment, Property } from '../types';

interface MonthlyRevenueChartProps {
  payments: Payment[];
  properties: Property[];
}

interface MonthlyDataPoint {
  monthKey: string; // e.g. '2026-03'
  label: string; // e.g. "Mar '26"
  fullLabel: string; // e.g. "March 2026"
  collected: number;
  invoiced: number;
  overdue: number;
  pending: number;
  paidCount: number;
  totalCount: number;
  collectionRate: number;
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
  payments,
  properties,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [showInvoicedLine, setShowInvoicedLine] = useState<boolean>(true);
  const [showOverdueLine, setShowOverdueLine] = useState<boolean>(false);

  // Month names formatter helper
  const formatMonthKeyToLabels = (key: string) => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const shortMonth = date.toLocaleString('default', { month: 'short' });
    const fullMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const shortYear = String(year).slice(-2);
    return {
      label: `${shortMonth} '${shortYear}`,
      fullLabel: fullMonth,
    };
  };

  // Filter & aggregate payments by month in chronological order
  const chartData: MonthlyDataPoint[] = useMemo(() => {
    const filteredPayments = payments.filter((p) => {
      if (selectedPropertyId === 'all') return true;
      // Match by property name or tenant property
      const targetProp = properties.find((pr) => pr.id.toString() === selectedPropertyId);
      if (!targetProp) return true;
      return p.property_name === targetProp.name;
    });

    const monthMap = new Map<
      string,
      {
        collected: number;
        invoiced: number;
        overdue: number;
        pending: number;
        paidCount: number;
        totalCount: number;
      }
    >();

    filteredPayments.forEach((p) => {
      // Prefer paid_date for collected, fallback to due_date or created_at
      const dateStr = p.paid_date || p.due_date || p.created_at;
      if (!dateStr) return;

      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      const current = monthMap.get(monthKey) || {
        collected: 0,
        invoiced: 0,
        overdue: 0,
        pending: 0,
        paidCount: 0,
        totalCount: 0,
      };

      current.invoiced += p.amount;
      current.totalCount += 1;

      if (p.status === 'paid') {
        current.collected += p.amount;
        current.paidCount += 1;
      } else if (p.status === 'overdue') {
        current.overdue += p.amount;
      } else if (p.status === 'pending') {
        current.pending += p.amount;
      }

      monthMap.set(monthKey, current);
    });

    // Sort month keys in chronological ascending order
    const sortedKeys = Array.from(monthMap.keys()).sort();

    return sortedKeys.map((key) => {
      const data = monthMap.get(key)!;
      const { label, fullLabel } = formatMonthKeyToLabels(key);
      const collectionRate = data.invoiced > 0 ? Math.round((data.collected / data.invoiced) * 100) : 0;

      return {
        monthKey: key,
        label,
        fullLabel,
        collected: data.collected,
        invoiced: data.invoiced,
        overdue: data.overdue,
        pending: data.pending,
        paidCount: data.paidCount,
        totalCount: data.totalCount,
        collectionRate,
      };
    });
  }, [payments, properties, selectedPropertyId]);

  // Summary Metrics calculations
  const totalCollectedInPeriod = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.collected, 0);
  }, [chartData]);

  const totalInvoicedInPeriod = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.invoiced, 0);
  }, [chartData]);

  const averageMonthlyRevenue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(totalCollectedInPeriod / chartData.length);
  }, [chartData, totalCollectedInPeriod]);

  const peakMonth = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.collected - a.collected)[0];
  }, [chartData]);

  const overallCollectionEfficiency = useMemo(() => {
    if (totalInvoicedInPeriod === 0) return 0;
    return Math.round((totalCollectedInPeriod / totalInvoicedInPeriod) * 100);
  }, [totalCollectedInPeriod, totalInvoicedInPeriod]);

  // Formatter for Y-Axis numbers (e.g. KES 50k, KES 150k)
  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `KES ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `KES ${(val / 1000).toFixed(0)}k`;
    return `KES ${val}`;
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint: MonthlyDataPoint | undefined = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-xl border border-gray-200 text-xs font-sans space-y-2 min-w-[210px] z-50">
        <div className="border-b border-gray-100 pb-1.5 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{dataPoint.fullLabel}</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              dataPoint.collectionRate >= 80
                ? 'bg-emerald-100 text-emerald-800'
                : dataPoint.collectionRate >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {dataPoint.collectionRate}% Collected
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-gray-700">
            <span className="flex items-center space-x-1.5 text-indigo-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              <span>Collected Revenue:</span>
            </span>
            <strong className="font-bold text-gray-900">
              KES {dataPoint.collected.toLocaleString()}
            </strong>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center space-x-1.5 text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
              <span>Total Invoiced:</span>
            </span>
            <span className="font-medium text-gray-800">
              KES {dataPoint.invoiced.toLocaleString()}
            </span>
          </div>

          {dataPoint.overdue > 0 && (
            <div className="flex items-center justify-between text-rose-600">
              <span className="flex items-center space-x-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>Overdue Arrears:</span>
              </span>
              <strong className="font-semibold text-rose-700">
                KES {dataPoint.overdue.toLocaleString()}
              </strong>
            </div>
          )}

          {dataPoint.pending > 0 && (
            <div className="flex items-center justify-between text-amber-600">
              <span className="flex items-center space-x-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span>Pending Payment:</span>
              </span>
              <span className="font-medium text-amber-700">
                KES {dataPoint.pending.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-1.5 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
          <span>{dataPoint.paidCount} of {dataPoint.totalCount} invoices settled</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Financial Performance</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Monthly Rental Revenue
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated rental collections and invoicing trends across billing cycles
          </p>
        </div>

        {/* Filters and Line Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Dropdown Filter */}
          <div className="relative inline-flex items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id.toString()}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Invoiced Line */}
          <button
            type="button"
            onClick={() => setShowInvoicedLine(!showInvoicedLine)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition flex items-center space-x-1.5 ${
              showInvoicedLine
                ? 'bg-slate-100 border-slate-300 text-slate-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle Total Invoiced reference line"
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
            <span>Total Invoiced</span>
          </button>

          {/* Toggle Overdue Line */}
          <button
            type="button"
            onClick={() => setShowOverdueLine(!showOverdueLine)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition flex items-center space-x-1.5 ${
              showOverdueLine
                ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle Overdue Arrears reference line"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>Overdue Arrears</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100 text-xs">
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Total Collected
          </p>
          <p className="text-sm sm:text-base font-bold text-indigo-700 mt-0.5">
            KES {totalCollectedInPeriod.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{chartData.length} months tracked</p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Monthly Average
          </p>
          <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
            KES {averageMonthlyRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">per billing cycle</p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Peak Month
          </p>
          <p className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5 truncate">
            {peakMonth ? peakMonth.label : 'N/A'}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {peakMonth ? `KES ${peakMonth.collected.toLocaleString()}` : '—'}
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Collection Efficiency
          </p>
          <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
            {overallCollectionEfficiency}%
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">of total invoiced rent</p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs space-y-2">
            <DollarSign className="w-8 h-8 text-gray-300" />
            <p>No payment records available for the selected filter.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: '12px',
                  fontSize: '11px',
                }}
              />

              {/* Main Metric: Collected Rental Revenue */}
              <Line
                type="monotone"
                dataKey="collected"
                name="Collected Revenue"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#c7d2fe', strokeWidth: 3 }}
              />

              {/* Secondary Metric: Total Invoiced Due */}
              {showInvoicedLine && (
                <Line
                  type="monotone"
                  dataKey="invoiced"
                  name="Total Invoiced"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#94a3b8', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#64748b' }}
                />
              )}

              {/* Tertiary Metric: Overdue Arrears */}
              {showOverdueLine && (
                <Line
                  type="monotone"
                  dataKey="overdue"
                  name="Overdue Arrears"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#dc2626' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
