import React, { useState } from 'react';
import {
  Home,
  CreditCard,
  Wrench,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  MaintenancePriority,
  MaintenanceRequest,
  Payment,
  Tenant,
  TenantTab,
  Unit,
  User,
} from '../types';

interface TenantPortalProps {
  currentUser: User;
  tenantProfile?: Tenant;
  unitProfile?: Unit;
  payments: Payment[];
  maintenance: MaintenanceRequest[];
  activeTab: TenantTab;
  setActiveTab: (tab: TenantTab) => void;
  onSubmitMaintenance: (data: {
    title: string;
    description: string;
    category: string;
    priority: MaintenancePriority;
  }) => Promise<void>;
  onMakePayment: (data: { amount: number; reference_code: string; notes?: string }) => Promise<void>;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  currentUser,
  tenantProfile,
  unitProfile,
  payments,
  maintenance,
  activeTab,
  setActiveTab,
  onSubmitMaintenance,
  onMakePayment,
}) => {
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // Repair Request Form State
  const [repairForm, setRepairForm] = useState({
    title: '',
    description: '',
    category: 'Plumbing',
    priority: 'medium' as MaintenancePriority,
  });

  // M-Pesa Payment Simulation State
  const [payAmount, setPayAmount] = useState(unitProfile?.rent_amount || 50000);
  const [mpesaCode, setMpesaCode] = useState(
    `QK${Math.floor(100000 + Math.random() * 900000)}LM`
  );
  const [phoneNumber, setPhoneNumber] = useState(tenantProfile?.contact_info || '+254 7XX XXX XXX');

  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  const outstandingBalance = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairForm.title || !repairForm.description) return;
    await onSubmitMaintenance(repairForm);
    setRepairForm({
      title: '',
      description: '',
      category: 'Plumbing',
      priority: 'medium',
    });
    setIsRepairModalOpen(false);
  };

  const handleConfirmMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    await onMakePayment({
      amount: payAmount,
      reference_code: mpesaCode,
      notes: `M-Pesa payment from ${tenantProfile?.name || 'Tenant'} (${phoneNumber})`,
    });
    setIsPayModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {tenantProfile?.photo_url ? (
            <img
              src={tenantProfile.photo_url}
              alt={tenantProfile.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100 shrink-0">
              {(tenantProfile?.name || currentUser.email)
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Tenant Member Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome, {tenantProfile?.name || currentUser.email}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Leasing <strong className="text-gray-900">{unitProfile?.unit_number || 'Your Unit'}</strong> at{' '}
              <strong className="text-gray-900">{tenantProfile?.property_name || 'Estate'}</strong>
            </p>
          </div>
        </div>

        {outstandingBalance > 0 ? (
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-center space-x-3">
            <div>
              <div className="text-[11px] text-red-600 uppercase font-semibold">Outstanding Rent Balance</div>
              <div className="text-xl font-bold text-red-900">KES {outstandingBalance.toLocaleString()}</div>
            </div>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition shadow-xs"
            >
              Pay via M-Pesa
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center space-x-2 text-green-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Rent Account Up to Date</span>
          </div>
        )}
      </div>

      {/* Tab 1: My Unit & Lease */}
      {activeTab === 'my-unit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">
                    {unitProfile?.unit_number || 'Apartment Unit'}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center mt-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    <span>{tenantProfile?.property_name || 'Kilimani Heights'}</span>
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full">
                Active Lease
              </span>
            </div>

            {/* Lease Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Monthly Agreed Rent</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  KES {(unitProfile?.rent_amount || tenantProfile?.rent_amount || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-500">Due before the 5th of each calendar month</span>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Lease Duration</span>
                <div className="text-sm font-bold text-gray-900 mt-1 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>
                    {tenantProfile?.lease_start} &rarr; {tenantProfile?.lease_end}
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">12-Month Renewable Tenancy Agreement</span>
              </div>
            </div>

            {/* Layout Specifications */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Unit Layout & Details
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400">Bedrooms</div>
                  <div className="text-lg font-bold text-gray-800">{unitProfile?.bedrooms || 2}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400">Bathrooms</div>
                  <div className="text-lg font-bold text-gray-800">{unitProfile?.bathrooms || 2}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-400">Floor Level</div>
                  <div className="text-lg font-bold text-gray-800">
                    Floor {unitProfile?.floor || 1}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Landlord Contact & Support Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Property Management Contact</h3>
            <p className="text-xs text-gray-500">
              For urgent matters, utility bill tokens, or security gate clearances.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-gray-50 rounded-xl flex items-center space-x-3">
                <Phone className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs text-gray-400">Caretaker / Office Hotline</div>
                  <div className="text-sm font-bold text-gray-800">+254 700 112 233</div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl flex items-center space-x-3">
                <Mail className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs text-gray-400">Admin Email</div>
                  <div className="text-sm font-bold text-gray-800">admin@mwenyenyumba.com</div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="text-xs font-bold text-indigo-900">M-Pesa Official Paybill</div>
                <div className="text-sm font-mono font-bold text-indigo-700 mt-0.5">Paybill: 400222</div>
                <div className="text-xs text-indigo-800">Account: {unitProfile?.unit_number?.replace(/\s+/g, '')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Payments */}
      {activeTab === 'my-payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Payment History & Rent Receipts</h2>
              <p className="text-xs text-gray-500">
                Your past transactions, settled invoices, and official M-Pesa reference codes.
              </p>
            </div>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simulate M-Pesa Payment</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-medium text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Invoice / Cycle</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Transaction Code</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Settled On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-xs">
                        No payment records found for your account.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {p.notes || 'Monthly Rent Payment'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-700">{p.due_date}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          KES {p.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs uppercase font-medium text-gray-800">
                          {p.payment_method?.replace('_', ' ') || 'M-PESA'}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-medium text-gray-600">
                          {p.reference_code || <span className="text-gray-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.status === 'paid'
                                ? 'bg-green-50 text-green-700'
                                : p.status === 'overdue'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {p.paid_date ? p.paid_date : <span className="text-gray-400 italic">Unpaid</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: My Maintenance */}
      {activeTab === 'my-maintenance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Repair & Maintenance Tickets</h2>
              <p className="text-xs text-gray-500">
                Submit plumbing, electrical, carpentry, or lock issues directly to property management.
              </p>
            </div>
            <button
              onClick={() => setIsRepairModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Repair Request</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenance.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl p-12 text-center text-gray-400 text-xs border border-gray-200">
                You haven't submitted any maintenance requests yet.
              </div>
            ) : (
              maintenance.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-indigo-200 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            m.priority === 'urgent'
                              ? 'bg-red-50 text-red-700'
                              : m.priority === 'high'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {m.priority} Priority
                        </span>
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {m.category}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          m.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : m.status === 'in_progress'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-base mt-3">{m.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{m.description}</p>

                    {m.admin_notes && (
                      <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-gray-700 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-900">Management Update: </span>
                          <span>{m.admin_notes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>Submitted on: {new Date(m.created_at).toLocaleDateString()}</span>
                    <span className="font-mono">Ticket #{m.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Submit Repair Request */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Submit New Maintenance Ticket</h3>
              <button
                onClick={() => setIsRepairModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRepair} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Issue Summary / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water heater leak, Door lock stuck"
                  value={repairForm.title}
                  onChange={(e) => setRepairForm({ ...repairForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={repairForm.category}
                    onChange={(e) => setRepairForm({ ...repairForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry & Locks</option>
                    <option value="HVAC / Fans">HVAC / Cooling</option>
                    <option value="Painting & Walls">Painting / Walls</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    value={repairForm.priority}
                    onChange={(e) =>
                      setRepairForm({ ...repairForm, priority: e.target.value as MaintenancePriority })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe what is happening, exact room location, and when the issue started..."
                  value={repairForm.description}
                  onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRepairModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interactive M-Pesa Rent Payment */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs">
                  M
                </div>
                <h3 className="font-bold text-base text-gray-900">M-Pesa Rent Settlement</h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMpesaPayment} className="space-y-4 mt-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs space-y-1">
                <div className="text-gray-600">Paybill Business Number: <strong className="text-gray-900 font-mono">400222</strong></div>
                <div className="text-gray-600">Account Reference: <strong className="text-gray-900 font-mono">{unitProfile?.unit_number || 'Apt101'}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Amount (KES) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  M-Pesa Registered Phone *
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  M-Pesa Confirmation Code (Simulated)
                </label>
                <input
                  type="text"
                  required
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
                >
                  Send & Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
