import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  Building,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';
import { Payment, PaymentMethod, PaymentStatus, Tenant } from '../types';

interface PaymentsViewProps {
  payments: Payment[];
  tenants: Tenant[];
  onCreatePayment: (data: {
    tenant_id: number;
    amount: number;
    due_date: string;
    paid_date?: string | null;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    reference_code?: string;
    notes?: string;
  }) => Promise<void>;
  onUpdatePayment: (id: number, data: Partial<Payment>) => Promise<void>;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  tenants,
  onCreatePayment,
  onUpdatePayment,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMarkPaidModalOpen, setIsMarkPaidModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Mark as paid state
  const [markPaidCode, setMarkPaidCode] = useState('QK89X109LM');
  const [markPaidMethod, setMarkPaidMethod] = useState<PaymentMethod>('mpesa');

  const [formData, setFormData] = useState({
    tenant_id: tenants[0]?.id || 1,
    amount: 55000,
    due_date: new Date().toISOString().split('T')[0],
    paid_date: '',
    status: 'pending' as PaymentStatus,
    payment_method: 'mpesa' as PaymentMethod,
    reference_code: '',
    notes: '',
  });

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const totalCollected = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount, 0);
  const totalOverdue = payments
    .filter((p) => p.status === 'overdue')
    .reduce((acc, p) => acc + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const handleOpenCreate = () => {
    const defaultTenant = tenants[0];
    setFormData({
      tenant_id: defaultTenant?.id || 1,
      amount: defaultTenant?.rent_amount || 50000,
      due_date: new Date().toISOString().split('T')[0],
      paid_date: '',
      status: 'pending',
      payment_method: 'mpesa',
      reference_code: '',
      notes: 'Monthly rent billing invoice',
    });
    setIsModalOpen(true);
  };

  const handleOpenMarkPaid = (p: Payment) => {
    setSelectedPayment(p);
    setMarkPaidCode(
      `MP${Math.floor(100000 + Math.random() * 900000)}KES`
    );
    setMarkPaidMethod('mpesa');
    setIsMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    await onUpdatePayment(selectedPayment.id, {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      reference_code: markPaidCode,
      payment_method: markPaidMethod,
    });
    setIsMarkPaidModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id || formData.amount <= 0) return;

    await onCreatePayment({
      tenant_id: formData.tenant_id,
      amount: formData.amount,
      due_date: formData.due_date,
      paid_date: formData.status === 'paid' ? formData.paid_date || new Date().toISOString().split('T')[0] : null,
      status: formData.status,
      payment_method: formData.payment_method,
      reference_code: formData.reference_code || undefined,
      notes: formData.notes || undefined,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Ledger</h2>
          <p className="text-sm text-gray-500">
            Rent collection history, invoices, M-Pesa receipts, and arrears tracking.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Invoice / Payment</span>
        </button>
      </div>

      {/* Summary Stat Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total Settled</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">KES {totalCollected.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Pending Invoices</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">KES {totalPending.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Overdue Arrears</span>
            <div className="text-2xl font-bold text-red-600 mt-1">KES {totalOverdue.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Records ({payments.length})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'paid'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Paid ({payments.filter((p) => p.status === 'paid').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'pending'
              ? 'bg-orange-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pending ({payments.filter((p) => p.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('overdue')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'overdue'
              ? 'bg-red-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Overdue ({payments.filter((p) => p.status === 'overdue').length})
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Tenant / Property</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Method & Reference</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Paid On</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-xs">
                    No payment records match this filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-gray-900">{p.tenant_name}</div>
                      <div className="text-xs text-gray-500">
                        {p.property_name} &bull; {p.unit_number}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-gray-700">
                      {p.due_date}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-gray-900">
                      KES {p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <div className="flex items-center space-x-1 font-semibold text-gray-800 uppercase">
                        {p.payment_method === 'mpesa' ? (
                          <Smartphone className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>{p.payment_method?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                      {p.reference_code && (
                        <div className="text-[11px] font-mono text-gray-500 mt-0.5">
                          Ref: {p.reference_code}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {p.paid_date ? p.paid_date : <span className="italic text-gray-400">Unsettled</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {p.status !== 'paid' ? (
                        <button
                          onClick={() => handleOpenMarkPaid(p)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition shadow-xs"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-green-600 font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Mark as Paid */}
      {isMarkPaidModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Record Rent Receipt Confirmation</h3>
              <button
                onClick={() => setIsMarkPaidModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkPaid} className="space-y-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="text-gray-500">Tenant: <strong className="text-gray-900">{selectedPayment.tenant_name}</strong></div>
                <div className="text-gray-500">Amount Due: <strong className="text-indigo-600 font-bold">KES {selectedPayment.amount.toLocaleString()}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={markPaidMethod}
                  onChange={(e) => setMarkPaidMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="mpesa">M-Pesa Paybill / Till</option>
                  <option value="bank_transfer">Bank Wire / RTGS</option>
                  <option value="cash">Direct Cash Receipt</option>
                  <option value="credit_card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transaction Code / Receipt Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QK89X109LM"
                  value={markPaidCode}
                  onChange={(e) => setMarkPaidCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMarkPaidModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Record Rent Invoice / Payment</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tenant *
                </label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => {
                    const tid = Number(e.target.value);
                    const t = tenants.find((item) => item.id === tid);
                    setFormData({
                      ...formData,
                      tenant_id: tid,
                      amount: t?.rent_amount || formData.amount,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit_number} - {t.property_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Amount (KES) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ref Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="M-Pesa Ref / Receipt"
                    value={formData.reference_code}
                    onChange={(e) => setFormData({ ...formData, reference_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. August rent cycle"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
