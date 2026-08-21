import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  MessageSquare,
  Home,
  User,
  Filter,
  X,
  Edit3,
} from 'lucide-react';
import { MaintenancePriority, MaintenanceRequest, MaintenanceStatus } from '../types';

interface MaintenanceViewProps {
  maintenance: MaintenanceRequest[];
  onUpdateMaintenance: (id: number, data: Partial<MaintenanceRequest>) => Promise<void>;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  maintenance,
  onUpdateMaintenance,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    status: 'pending' as MaintenanceStatus,
    priority: 'medium' as MaintenancePriority,
    admin_notes: '',
  });

  const filtered = maintenance.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
    return true;
  });

  const handleOpenEdit = (m: MaintenanceRequest) => {
    setSelectedTicket(m);
    setFormData({
      status: m.status,
      priority: m.priority,
      admin_notes: m.admin_notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    await onUpdateMaintenance(selectedTicket.id, {
      status: formData.status,
      priority: formData.priority,
      admin_notes: formData.admin_notes,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Maintenance & Repairs</h2>
          <p className="text-sm text-gray-500">
            Tenant repair requests, job progress tracking, and technician assignments.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses ({maintenance.length})</option>
          <option value="pending">Pending Review</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Maintenance Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-12 text-center text-gray-400 text-xs border border-gray-200">
            No maintenance requests match this filter.
          </div>
        ) : (
          filtered.map((m) => (
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
                      <span className="font-bold text-indigo-900">Admin Notes: </span>
                      <span>{m.admin_notes}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <div className="font-medium text-gray-800 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{m.tenant_name}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-gray-400 mt-0.5">
                    <Home className="w-3 h-3 text-gray-400" />
                    <span>
                      {m.property_name} ({m.unit_number})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(m)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Update Ticket #{selectedTicket.id}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Issue Title:</div>
                <div className="font-bold text-gray-900 text-sm">{selectedTicket.title}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Progress Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="pending">Pending Review</option>
                  <option value="in_progress">In Progress / Assigned</option>
                  <option value="completed">Completed & Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as MaintenancePriority })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin & Technician Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Electrician scheduled for inspection on Thursday 10:00 AM..."
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
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
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
