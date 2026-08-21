import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  User,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Home,
  Check,
  X,
} from 'lucide-react';
import { Property } from '../types';

interface PropertiesViewProps {
  properties: Property[];
  onCreateProperty: (data: { name: string; address: string; owner: string; description: string }) => Promise<void>;
  onUpdateProperty: (id: number, data: Partial<Property>) => Promise<void>;
  onDeleteProperty: (id: number) => Promise<void>;
  onSelectPropertyForUnits?: (propertyId: number) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onCreateProperty,
  onUpdateProperty,
  onDeleteProperty,
  onSelectPropertyForUnits,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner: 'Khamis Family Holdings',
    description: '',
  });

  const handleOpenCreate = () => {
    setEditingProperty(null);
    setFormData({
      name: '',
      address: '',
      owner: 'Khamis Family Holdings',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Property) => {
    setEditingProperty(p);
    setFormData({
      name: p.name,
      address: p.address,
      owner: p.owner,
      description: p.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;

    if (editingProperty) {
      await onUpdateProperty(editingProperty.id, formData);
    } else {
      await onCreateProperty(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Properties Portfolio</h2>
          <p className="text-sm text-gray-500">
            Real estate assets and rental buildings owned by the family business.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Properties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => {
          return (
            <div
              key={prop.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(prop)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      title="Edit Property"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${prop.name}"? This will delete all associated units.`)) {
                          onDeleteProperty(prop.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-3">{prop.name}</h3>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                  <span>{prop.address}</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center mt-1">
                  <User className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                  <span>Owner: {prop.owner}</span>
                </p>

                {prop.description && (
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {prop.description}
                  </p>
                )}

                {/* Property Stats */}
                <div className="grid grid-cols-3 gap-2 mt-5 py-3 border-y border-gray-100 text-center">
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase font-semibold">Units</div>
                    <div className="text-base font-bold text-gray-900">{prop.total_units}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase font-semibold">Occupied</div>
                    <div className="text-base font-bold text-indigo-600">{prop.occupied_units}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase font-semibold">Vacant</div>
                    <div className="text-base font-bold text-gray-600">{prop.vacant_units}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Monthly Gross:</span>
                  <span className="text-sm font-bold text-gray-900">
                    KES {prop.total_revenue_potential.toLocaleString()}
                  </span>
                </div>
              </div>

              {onSelectPropertyForUnits && (
                <div className="p-3.5 bg-gray-50/80 border-t border-gray-100">
                  <button
                    onClick={() => onSelectPropertyForUnits(prop.id)}
                    className="w-full py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition text-center flex items-center justify-center space-x-1.5"
                  >
                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Manage Units ({prop.total_units})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingProperty ? 'Edit Property Details' : 'Add New Property Listing'}
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
                  Property / Building Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kilimani Heights"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Physical Address / Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Argwings Kodhek Rd, Kilimani, Nairobi"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Owner / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description / Amenities Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding building security, backup generator, water supply..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
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
                  {editingProperty ? 'Save Changes' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
