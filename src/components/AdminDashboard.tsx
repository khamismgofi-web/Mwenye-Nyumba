import React from 'react';
import {
  Building2,
  Home,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { AdminTab, MaintenanceRequest, Payment, Property, Tenant, Unit } from '../types';
import { MonthlyRevenueChart } from './MonthlyRevenueChart';

interface AdminDashboardProps {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  maintenance: MaintenanceRequest[];
  onNavigate: (tab: AdminTab) => void;
  onOpenAddPayment: () => void;
  onOpenAddTenant: () => void;
  onOpenAddProperty: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  units,
  tenants,
  payments,
  maintenance,
  onNavigate,
  onOpenAddPayment,
  onOpenAddTenant,
  onOpenAddProperty,
}) => {
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.status === 'occupied').length;
  const vacantUnits = units.filter((u) => u.status === 'vacant').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const totalMonthlyPotential = units.reduce((acc, u) => acc + u.rent_amount, 0);
  const collectedRent = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);
  const overdueRent = payments
    .filter((p) => p.status === 'overdue')
    .reduce((acc, p) => acc + p.amount, 0);
  const pendingRent = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingMaintenance = maintenance.filter((m) => m.status === 'pending' || m.status === 'in_progress');
  const urgentTickets = maintenance.filter((m) => m.priority === 'urgent' || m.priority === 'high');

  return (
    <div className="space-y-6">
      {/* Top Header / Welcome */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Landlord Executive Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Overview Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Managing <strong className="text-gray-900">{properties.length} properties</strong> across{' '}
            <strong className="text-gray-900">{totalUnits} rental units</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={onOpenAddProperty}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Property</span>
          </button>
          <button
            onClick={onOpenAddTenant}
            className="flex items-center space-x-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg transition"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Add Tenant</span>
          </button>
          <button
            onClick={onOpenAddPayment}
            className="flex items-center space-x-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg transition"
          >
            <CreditCard className="w-4 h-4 text-green-600" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Monthly Collections */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Collections</p>
          <h3 className="text-2xl font-bold text-gray-900">KES {collectedRent.toLocaleString()}</h3>
          <div className="mt-2 flex items-center text-green-600 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span className="text-gray-500">of KES {totalMonthlyPotential.toLocaleString()} potential</span>
          </div>
        </div>

        {/* Metric 2: Occupancy */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Occupancy Rate</p>
          <h3 className="text-2xl font-bold text-gray-900">{occupancyRate}%</h3>
          <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            {occupiedUnits} occupied &bull; {vacantUnits} vacant units
          </p>
        </div>

        {/* Metric 3: Arrears / Overdue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Outstanding Rent</p>
          <h3 className="text-2xl font-bold text-red-600">KES {overdueRent.toLocaleString()}</h3>
          <div className="mt-2 flex items-center text-orange-600 text-xs font-medium">
            <span>+ KES {pendingRent.toLocaleString()} pending</span>
          </div>
        </div>

        {/* Metric 4: Active Repairs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Maintenance Alerts</p>
          <h3 className="text-2xl font-bold text-gray-900">{pendingMaintenance.length} Pending</h3>
          <div className="mt-2 flex items-center text-orange-600 text-xs font-medium">
            <span>{urgentTickets.length} High / Urgent Priority</span>
          </div>
        </div>
      </div>

      {/* Monthly Rental Revenue Line Chart (Recharts) */}
      <MonthlyRevenueChart payments={payments} properties={properties} />

      {/* Two Column Section: Recent Ledger & Maintenance Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Recent Payments</h4>
              <span
                onClick={() => onNavigate('payments')}
                className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline"
              >
                View All
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-gray-400 tracking-wider font-bold border-b border-gray-50 bg-gray-50/40">
                    <th className="px-6 py-3">Tenant</th>
                    <th className="px-6 py-3">Unit</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {payments.slice(0, 4).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-6 py-3.5 font-medium text-gray-900">{p.tenant_name}</td>
                      <td className="px-6 py-3.5 text-xs text-gray-500">
                        {p.unit_number} &bull; {p.property_name}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-900">
                        KES {p.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                            p.status === 'paid'
                              ? 'bg-green-50 text-green-700'
                              : p.status === 'overdue'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-gray-50">
            <button
              onClick={onOpenAddPayment}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition text-center"
            >
              + Record New Rent Receipt / Invoice
            </button>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Maintenance Requests</h4>
              <span
                onClick={() => onNavigate('maintenance')}
                className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline"
              >
                View All
              </span>
            </div>

            <div className="p-4 space-y-3">
              {maintenance.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="flex space-x-3 p-3.5 border border-gray-100 rounded-lg bg-white hover:bg-gray-50/50 transition"
                >
                  <div
                    className={`w-1 rounded-full ${
                      m.priority === 'urgent'
                        ? 'bg-red-500'
                        : m.priority === 'high'
                        ? 'bg-orange-500'
                        : m.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-indigo-500'
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-semibold text-gray-900">{m.title}</h5>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {m.unit_number} &bull; {m.property_name} &bull;{' '}
                      <span className="capitalize font-medium text-gray-700">{m.priority} Priority</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-50">
            <button
              onClick={() => onNavigate('maintenance')}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition text-center"
            >
              Review & Assign Service Technicians
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
