import React, { useState } from 'react';
import {
  Home,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  X,
} from 'lucide-react';
import { Property, Unit, UnitStatus } from '../types';

interface UnitsViewProps {
  units: Unit[];
  properties: Property[];
  selectedPropertyId?: number;
  onCreateUnit: (data: {
    property_id: number;
    unit_number: string;
    rent_amount: number;
    status: UnitStatus;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
  }) => Promise<void>;
  onUpdateUnit: (id: number, data: Partial<Unit>) => Promise<void>;
  onDeleteUnit: (id: number) => Promise<void>;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  units,
  properties,
  selectedPropertyId,
  onCreateUnit,
  onUpdateUnit,
  onDeleteUnit,
}) => {
  const [propertyFilter, setPropertyFilter] = useState<string>(
    selectedPropertyId ? String(selectedPropertyId) : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [formData, setFormData] = useState({
    property_id: properties[0]?.id || 1,
    unit_number: '',
    rent_amount: 50000,
    status: 'vacant' as UnitStatus,
    floor: 1,
    bedrooms: 2,
    bathrooms: 1,
  });

  const filteredUnits = units.filter((u) => {
    if (propertyFilter !== 'all' && u.property_id !== Number(propertyFilter)) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingUnit(null);
    setFormData({
      property_id: propertyFilter !== 'all' ? Number(propertyFilter) : properties[0]?.id || 1,
      unit_number: '',
      rent_amount: 50000,
      status: 'vacant',
      floor: 1,
      bedrooms: 2,
      bathrooms: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      property_id: unit.property_id,
      unit_number: unit.unit_number,
      rent_amount: unit.rent_amount,
      status: unit.status,
      floor: unit.floor || 1,
      bedrooms: unit.bedrooms || 1,
      bathrooms: unit.bathrooms || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_number || formData.rent_amount <= 0) return;

    if (editingUnit) {
      await onUpdateUnit(editingUnit.id, formData);
    } else {
      await onCreateUnit(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Units Directory</h2>
          <p className="text-sm text-gray-500">
            Individual rental apartments, townhouses, and shops inventory.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Unit</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>

        {/* Property Filter */}
        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Properties ({units.length} units)</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="occupied">Occupied Only</option>
          <option value="vacant">Vacant Only</option>
          <option value="maintenance">Under Maintenance</option>
        </select>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Unit #</th>
                <th className="px-6 py-3.5">Property</th>
                <th className="px-6 py-3.5">Layout</th>
                <th className="px-6 py-3.5">Monthly Rent</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Current Tenant</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-xs">
                    No units match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center space-x-2">
                      <Home className="w-4 h-4 text-indigo-600" />
                      <span>{u.unit_number}</span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      {u.property_name || 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {u.bedrooms} Bed &bull; {u.bathrooms} Bath {u.floor ? `(Floor ${u.floor})` : ''}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900">
                      KES {u.rent_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.status === 'occupied'
                            ? 'bg-indigo-50 text-indigo-700'
                            : u.status === 'vacant'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {u.current_tenant_name ? (
                        <div className="flex items-center space-x-1.5 text-gray-800 font-medium text-xs">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{u.current_tenant_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Vacant (no tenant)</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete unit ${u.unit_number}?`)) {
                              onDeleteUnit(u.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingUnit ? 'Edit Rental Unit' : 'Add New Rental Unit'}
              </h3>
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
                  Belongs to Property *
                </label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unit Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apt 301, Unit B2, Villa 4"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Monthly Rent (KES) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
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
                  {editingUnit ? 'Save Unit' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
