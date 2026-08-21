import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  Home,
  ShieldCheck,
  X,
  AlertCircle,
  Camera,
  User as UserIcon,
  Check,
  Send,
  MailCheck,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Property, Tenant, Unit, WelcomeEmailRecord } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { WelcomeEmailModal } from './WelcomeEmailModal';
import { MockEmailService } from '../services/mockEmailService';

interface TenantsViewProps {
  tenants: Tenant[];
  units: Unit[];
  properties: Property[];
  onCreateTenant: (data: {
    unit_id: number;
    name: string;
    contact_info: string;
    email: string;
    lease_start: string;
    lease_end: string;
    national_id?: string;
    photo_url?: string | null;
  }) => Promise<Tenant | void>;
  onUpdateTenant: (id: number, data: Partial<Tenant>) => Promise<void>;
  onDeleteTenant: (id: number) => Promise<void>;
  onSendWelcomeEmail?: (tenantId: number) => Promise<WelcomeEmailRecord>;
}

export const TenantsView: React.FC<TenantsViewProps> = ({
  tenants,
  units,
  properties,
  onCreateTenant,
  onUpdateTenant,
  onDeleteTenant,
  onSendWelcomeEmail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [autoSendWelcomeEmail, setAutoSendWelcomeEmail] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);

  // Welcome Email Modal preview state
  const [activeEmailPreview, setActiveEmailPreview] = useState<{
    emailRecord: WelcomeEmailRecord;
    tenant: Tenant;
  } | null>(null);

  // Camera Snapshot Modal state
  const [cameraModalTarget, setCameraModalTarget] = useState<{
    tenantId?: number;
    tenantName?: string;
    currentPhoto?: string | null;
    isFormMode?: boolean;
  } | null>(null);

  // Available vacant units for new tenant assignment
  const vacantUnits = units.filter((u) => u.status === 'vacant' || (editingTenant && u.id === editingTenant.unit_id));

  const [formData, setFormData] = useState({
    unit_id: vacantUnits[0]?.id || units[0]?.id || 1,
    name: '',
    email: '',
    contact_info: '',
    national_id: '',
    photo_url: '',
    lease_start: new Date().toISOString().split('T')[0],
    lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
  });

  const filteredTenants = tenants.filter((t) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      t.contact_info.toLowerCase().includes(q) ||
      (t.unit_number && t.unit_number.toLowerCase().includes(q)) ||
      (t.property_name && t.property_name.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setAutoSendWelcomeEmail(true);
    setFormData({
      unit_id: vacantUnits[0]?.id || units[0]?.id || 1,
      name: '',
      email: '',
      contact_info: '',
      national_id: '',
      photo_url: '',
      lease_start: new Date().toISOString().split('T')[0],
      lease_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      unit_id: t.unit_id,
      name: t.name,
      email: t.email || '',
      contact_info: t.contact_info,
      national_id: t.national_id || '',
      photo_url: t.photo_url || '',
      lease_start: t.lease_start,
      lease_end: t.lease_end,
    });
    setIsModalOpen(true);
  };

  const handleSendEmail = async (tenant: Tenant) => {
    setSendingEmailId(tenant.id);
    try {
      let record: WelcomeEmailRecord;
      if (onSendWelcomeEmail) {
        record = await onSendWelcomeEmail(tenant.id);
      } else {
        record = await MockEmailService.sendTenantWelcomeEmail(tenant);
        await onUpdateTenant(tenant.id, {
          welcome_email_sent: true,
          welcome_email_sent_at: record.sent_at,
        });
      }
      setActiveEmailPreview({ emailRecord: record, tenant });
    } catch (err: any) {
      alert(err.message || 'Failed to send welcome email');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact_info) return;

    if (editingTenant) {
      await onUpdateTenant(editingTenant.id, {
        name: formData.name,
        contact_info: formData.contact_info,
        national_id: formData.national_id,
        photo_url: formData.photo_url || null,
        lease_start: formData.lease_start,
        lease_end: formData.lease_end,
        unit_id: formData.unit_id,
      });
      setIsModalOpen(false);
    } else {
      const createdTenant = await onCreateTenant(formData);
      setIsModalOpen(false);

      // Automated Welcome Email dispatch if enabled
      if (autoSendWelcomeEmail && createdTenant && createdTenant.email) {
        handleSendEmail(createdTenant);
      }
    }
  };

  const handleCameraCapture = async (photoDataUrl: string) => {
    if (!cameraModalTarget) return;

    if (cameraModalTarget.isFormMode) {
      setFormData((prev) => ({ ...prev, photo_url: photoDataUrl }));
    } else if (cameraModalTarget.tenantId) {
      await onUpdateTenant(cameraModalTarget.tenantId, { photo_url: photoDataUrl });
    }
    setCameraModalTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tenants & Leases</h2>
          <p className="text-sm text-gray-500">
            Registered occupants, lease terms, contact details, identity snapshots, and account balances.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Tenant Agreement</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="tenant-search-input"
            type="text"
            placeholder="Search by tenant name, unit number (e.g., A101), or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500 shrink-0">
          {searchTerm ? (
            <span className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-md border border-indigo-100">
              <span>
                Found <strong>{filteredTenants.length}</strong> of {tenants.length} tenants
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-indigo-900 font-bold ml-1"
                title="Reset filter"
              >
                ×
              </button>
            </span>
          ) : (
            <span className="text-gray-400 font-medium">
              Total <strong>{tenants.length}</strong> registered tenants
            </span>
          )}
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase font-bold text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Tenant Profile</th>
                <th className="px-6 py-3.5">Unit Assigned</th>
                <th className="px-6 py-3.5">Contact & Login</th>
                <th className="px-6 py-3.5">Lease Duration</th>
                <th className="px-6 py-3.5">Rent / Mo</th>
                <th className="px-6 py-3.5">Balance Due</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No matching tenants</p>
                      <p className="text-xs text-gray-400">
                        No tenants matched &ldquo;{searchTerm}&rdquo; by name or unit number.
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                      >
                        <span>Clear search filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        {/* Avatar / Photo */}
                        <div className="relative group">
                          {t.photo_url ? (
                            <img
                              src={t.photo_url}
                              alt={t.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                              {t.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                          )}
                          <button
                            onClick={() =>
                              setCameraModalTarget({
                                tenantId: t.id,
                                tenantName: t.name,
                                currentPhoto: t.photo_url,
                              })
                            }
                            className="absolute -bottom-1 -right-1 p-1 bg-white hover:bg-indigo-50 text-indigo-600 rounded-full border border-gray-200 shadow-xs transition"
                            title="Capture snapshot with browser camera"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div>
                          <div className="font-bold text-gray-900">{t.name}</div>
                          {t.national_id && (
                            <span className="text-[11px] text-gray-400 font-mono">
                              ID: {t.national_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-gray-900 flex items-center space-x-1.5">
                        <Home className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t.unit_number}</span>
                      </div>
                      <div className="text-xs text-gray-500">{t.property_name}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-xs text-gray-800 flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{t.contact_info}</span>
                      </div>
                      {t.email ? (
                        <div className="text-xs text-gray-500 flex items-center space-x-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="font-mono text-[11px] text-gray-600">{t.email}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-600 italic">No email set</span>
                      )}

                      {/* Welcome Email Status Tag */}
                      <div className="mt-1.5">
                        {t.welcome_email_sent ? (
                          <button
                            onClick={() => handleSendEmail(t)}
                            className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition"
                            title="Click to preview or re-send welcome credentials"
                          >
                            <MailCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Email Sent</span>
                            {t.welcome_email_sent_at && (
                              <span className="text-[9px] text-emerald-600 font-normal">
                                • {new Date(t.welcome_email_sent_at).toLocaleDateString()}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span>Credentials Not Sent</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>
                          {t.lease_start} &rarr; {t.lease_end}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900">
                      KES {(t.rent_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      {(t.balance_due || 0) > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700">
                          KES {t.balance_due?.toLocaleString()} Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700">
                          Paid Up
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Automated 'Send Welcome Email' Action Button */}
                        <button
                          onClick={() => handleSendEmail(t)}
                          disabled={sendingEmailId === t.id}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition shadow-2xs ${
                            t.welcome_email_sent
                              ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                              : 'text-white bg-indigo-600 hover:bg-indigo-700'
                          } disabled:opacity-50`}
                          title="Trigger mock email service to dispatch login credentials"
                        >
                          {sendingEmailId === t.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : t.welcome_email_sent ? (
                            <>
                              <MailCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden md:inline">Resend Welcome</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Welcome Email</span>
                            </>
                          )}
                        </button>

                        {/* Explicit Add Profile Photo Button */}
                        <button
                          onClick={() =>
                            setCameraModalTarget({
                              tenantId: t.id,
                              tenantName: t.name,
                              currentPhoto: t.photo_url,
                            })
                          }
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200 shadow-2xs"
                          title="Open browser camera to capture tenant photo"
                        >
                          <Camera className="w-3.5 h-3.5 text-gray-500" />
                          <span className="hidden lg:inline">
                            {t.photo_url ? 'Update Photo' : 'Add Photo'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                          title="Edit Tenant"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove tenant ${t.name}? This will free up unit ${t.unit_number}.`)) {
                              onDeleteTenant(t.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Terminate Lease"
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

      {/* Modal Dialog: New / Edit Tenant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">
                {editingTenant ? 'Edit Tenant Lease Agreement' : 'New Tenant Registration'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Profile Photo Snapshot Field */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Tenant Snapshot"
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Tenant Photo Snapshot</div>
                    <p className="text-[11px] text-gray-500">
                      {formData.photo_url
                        ? 'Profile photo captured for identity records'
                        : 'Capture photo with camera API or upload image'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCameraModalTarget({
                        tenantName: formData.name || (editingTenant ? editingTenant.name : 'New Tenant'),
                        currentPhoto: formData.photo_url,
                        isFormMode: true,
                      })
                    }
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.photo_url ? 'Retake' : 'Add Profile Photo'}</span>
                  </button>

                  {formData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photo_url: '' })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Kamau"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {!editingTenant && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Portal Login Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. tenant.john@mwenyenyumba.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Default password for tenant portal login: <code>tenant123</code>
                    </p>
                  </div>

                  {/* Automated Welcome Email toggle */}
                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="auto_send_welcome_email"
                      checked={autoSendWelcomeEmail}
                      onChange={(e) => setAutoSendWelcomeEmail(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="auto_send_welcome_email" className="text-xs text-gray-700 cursor-pointer">
                      <span className="font-semibold text-gray-900 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Automated Welcome Email Dispatch</span>
                      </span>
                      <span className="text-gray-500 block mt-0.5 text-[11px]">
                        Automatically trigger mock email service to send login credentials (<code>tenant123</code>) and tenancy guide immediately upon creation.
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone / Contact *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+254 7XX XXX XXX"
                    value={formData.contact_info}
                    onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    National ID / Passport #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29481726"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Assign Rental Unit *
                </label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {vacantUnits.length === 0 ? (
                    <option value="">No vacant units available</option>
                  ) : (
                    vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} - {u.property_name} (KES {u.rent_amount.toLocaleString()}/mo)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lease Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.lease_start}
                    onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Lease End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.lease_end}
                    onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
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
                  {editingTenant ? 'Save Changes' : 'Confirm Lease Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Browser Camera Snapshot Modal */}
      {cameraModalTarget && (
        <CameraCaptureModal
          isOpen={true}
          onClose={() => setCameraModalTarget(null)}
          onCapture={handleCameraCapture}
          tenantName={cameraModalTarget.tenantName}
          currentPhotoUrl={cameraModalTarget.currentPhoto}
        />
      )}

      {/* Welcome Email Dispatched Confirmation & Credentials Preview Modal */}
      {activeEmailPreview && (
        <WelcomeEmailModal
          isOpen={true}
          onClose={() => setActiveEmailPreview(null)}
          emailRecord={activeEmailPreview.emailRecord}
          tenant={activeEmailPreview.tenant}
          onResend={async (tenantId) => {
            await handleSendEmail(activeEmailPreview.tenant);
          }}
        />
      )}
    </div>
  );
};

