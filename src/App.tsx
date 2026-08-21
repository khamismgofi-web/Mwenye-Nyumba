import React, { useState, useEffect } from 'react';
import {
  AdminTab,
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Property,
  Tenant,
  TenantTab,
  Unit,
  UnitStatus,
  User,
} from './types';
import { apiService, DEMO_USERS } from './services/api';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { PropertiesView } from './components/PropertiesView';
import { UnitsView } from './components/UnitsView';
import { TenantsView } from './components/TenantsView';
import { PaymentsView } from './components/PaymentsView';
import { MaintenanceView } from './components/MaintenanceView';
import { TenantPortal } from './components/TenantPortal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Starts as Admin
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [tenantTab, setTenantTab] = useState<TenantTab>('my-unit');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Data Store
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Banner Toast Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch all app data
  const refreshData = async () => {
    try {
      setLoading(true);
      const [pData, uData, tData, payData, mData] = await Promise.all([
        apiService.getProperties(),
        apiService.getUnits(),
        apiService.getTenants(),
        apiService.getPayments(),
        apiService.getMaintenanceRequests(),
      ]);
      setProperties(pData);
      setUnits(uData);
      setTenants(tData);
      setPayments(payData);
      setMaintenance(mData);
    } catch (err) {
      console.error('Error loading data', err);
      showNotification('Failed to load records from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Handle switching active user (simulating switching JWT login)
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setAdminTab('dashboard');
    } else {
      setTenantTab('my-unit');
    }
    showNotification(`Switched role to: ${user.email} (${user.role.toUpperCase()})`);
  };

  const handleResetDb = () => {
    if (confirm('Reset entire system database to initial demo state?')) {
      apiService.resetDatabase();
      refreshData();
      showNotification('Database successfully reset to initial seed data.');
    }
  };

  // Property Handlers
  const handleCreateProperty = async (data: { name: string; address: string; owner: string; description: string }) => {
    await apiService.createProperty(data);
    await refreshData();
    showNotification(`Property "${data.name}" added successfully.`);
  };

  const handleUpdateProperty = async (id: number, data: Partial<Property>) => {
    await apiService.updateProperty(id, data);
    await refreshData();
    showNotification('Property updated successfully.');
  };

  const handleDeleteProperty = async (id: number) => {
    await apiService.deleteProperty(id);
    await refreshData();
    showNotification('Property deleted successfully.');
  };

  // Unit Handlers
  const handleCreateUnit = async (data: {
    property_id: number;
    unit_number: string;
    rent_amount: number;
    status: UnitStatus;
    floor?: number;
    bedrooms?: number;
    bathrooms?: number;
  }) => {
    await apiService.createUnit(data);
    await refreshData();
    showNotification(`Unit ${data.unit_number} created.`);
  };

  const handleUpdateUnit = async (id: number, data: Partial<Unit>) => {
    await apiService.updateUnit(id, data);
    await refreshData();
    showNotification('Unit updated.');
  };

  const handleDeleteUnit = async (id: number) => {
    await apiService.deleteUnit(id);
    await refreshData();
    showNotification('Unit removed.');
  };

  // Tenant Handlers
  const handleCreateTenant = async (data: {
    unit_id: number;
    name: string;
    contact_info: string;
    email: string;
    lease_start: string;
    lease_end: string;
    national_id?: string;
    photo_url?: string | null;
  }) => {
    const created = await apiService.createTenant(data);
    await refreshData();
    showNotification(`Lease created for ${data.name}.`);
    return created;
  };

  const handleSendWelcomeEmail = async (tenantId: number) => {
    const record = await apiService.sendTenantWelcomeEmail(tenantId);
    await refreshData();
    showNotification(`Welcome credentials email sent to ${record.to_email}.`);
    return record;
  };

  const handleUpdateTenant = async (id: number, data: Partial<Tenant>) => {
    await apiService.updateTenant(id, data);
    await refreshData();
    showNotification('Tenant details updated.');
  };

  const handleDeleteTenant = async (id: number) => {
    await apiService.deleteTenant(id);
    await refreshData();
    showNotification('Tenant lease ended and unit freed.');
  };

  // Payment Handlers
  const handleCreatePayment = async (data: {
    tenant_id: number;
    amount: number;
    due_date: string;
    paid_date?: string | null;
    status: PaymentStatus;
    payment_method: PaymentMethod;
    reference_code?: string;
    notes?: string;
  }) => {
    await apiService.createPayment(data);
    await refreshData();
    showNotification('Invoice / Payment recorded.');
  };

  const handleUpdatePayment = async (id: number, data: Partial<Payment>) => {
    await apiService.updatePayment(id, data);
    await refreshData();
    showNotification('Payment status updated.');
  };

  // Maintenance Handlers
  const handleUpdateMaintenance = async (id: number, data: Partial<MaintenanceRequest>) => {
    await apiService.updateMaintenance(id, data);
    await refreshData();
    showNotification('Maintenance ticket updated.');
  };

  // Tenant Actions (Scoped strictly to current tenant)
  const currentTenantProfile = tenants.find((t) => t.user_id === currentUser.id);
  const currentUnitProfile = currentTenantProfile ? units.find((u) => u.id === currentTenantProfile.unit_id) : undefined;
  const tenantScopedPayments = currentTenantProfile ? payments.filter((p) => p.tenant_id === currentTenantProfile.id) : [];
  const tenantScopedMaintenance = currentTenantProfile ? maintenance.filter((m) => m.tenant_id === currentTenantProfile.id) : [];

  const handleTenantSubmitMaintenance = async (data: {
    title: string;
    description: string;
    category: string;
    priority: MaintenancePriority;
  }) => {
    if (!currentTenantProfile) {
      showNotification('Tenant profile not found for active user', 'error');
      return;
    }
    await apiService.createMaintenance({
      tenant_id: currentTenantProfile.id,
      ...data,
    });
    await refreshData();
    showNotification('Maintenance request submitted to property management.');
  };

  const handleTenantMakePayment = async (data: { amount: number; reference_code: string; notes?: string }) => {
    if (!currentTenantProfile) {
      showNotification('Tenant profile not found for active user', 'error');
      return;
    }
    await apiService.createPayment({
      tenant_id: currentTenantProfile.id,
      amount: data.amount,
      due_date: new Date().toISOString().split('T')[0],
      paid_date: new Date().toISOString().split('T')[0],
      status: 'paid',
      payment_method: 'mpesa',
      reference_code: data.reference_code,
      notes: data.notes,
    });
    await refreshData();
    showNotification(`M-Pesa payment of KES ${data.amount.toLocaleString()} received and confirmed!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        tenantTab={tenantTab}
        setTenantTab={setTenantTab}
        onResetDb={handleResetDb}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2.5 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-gray-900 text-white border-gray-800'
                : 'bg-red-900 text-white border-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm font-medium">
            Loading property management records...
          </div>
        ) : currentUser.role === 'admin' ? (
          /* Admin (Landlord) Views */
          <div>
            {adminTab === 'dashboard' && (
              <AdminDashboard
                properties={properties}
                units={units}
                tenants={tenants}
                payments={payments}
                maintenance={maintenance}
                onNavigate={setAdminTab}
                onOpenAddProperty={() => setAdminTab('properties')}
                onOpenAddTenant={() => setAdminTab('tenants')}
                onOpenAddPayment={() => setAdminTab('payments')}
              />
            )}

            {adminTab === 'properties' && (
              <PropertiesView
                properties={properties}
                onCreateProperty={handleCreateProperty}
                onUpdateProperty={handleUpdateProperty}
                onDeleteProperty={handleDeleteProperty}
                onSelectPropertyForUnits={(propId) => {
                  setSelectedPropertyId(propId);
                  setAdminTab('units');
                }}
              />
            )}

            {adminTab === 'units' && (
              <UnitsView
                units={units}
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                onCreateUnit={handleCreateUnit}
                onUpdateUnit={handleUpdateUnit}
                onDeleteUnit={handleDeleteUnit}
              />
            )}

            {adminTab === 'tenants' && (
              <TenantsView
                tenants={tenants}
                units={units}
                properties={properties}
                onCreateTenant={handleCreateTenant}
                onUpdateTenant={handleUpdateTenant}
                onDeleteTenant={handleDeleteTenant}
                onSendWelcomeEmail={handleSendWelcomeEmail}
              />
            )}

            {adminTab === 'payments' && (
              <PaymentsView
                payments={payments}
                tenants={tenants}
                onCreatePayment={handleCreatePayment}
                onUpdatePayment={handleUpdatePayment}
              />
            )}

            {adminTab === 'maintenance' && (
              <MaintenanceView
                maintenance={maintenance}
                onUpdateMaintenance={handleUpdateMaintenance}
              />
            )}
          </div>
        ) : (
          /* Tenant Portal Views (Strictly Scoped) */
          <TenantPortal
            currentUser={currentUser}
            tenantProfile={currentTenantProfile}
            unitProfile={currentUnitProfile}
            payments={tenantScopedPayments}
            maintenance={tenantScopedMaintenance}
            activeTab={tenantTab}
            setActiveTab={setTenantTab}
            onSubmitMaintenance={handleTenantSubmitMaintenance}
            onMakePayment={handleTenantMakePayment}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-800">Mwenye-Nyumba Property Management</span>
            <span>&bull;</span>
            <span>FastAPI & PostgreSQL Backend + React Vite Client</span>
          </div>
          <button
            onClick={() => setIsDocsOpen(true)}
            className="text-indigo-600 hover:text-indigo-700 font-medium underline"
          >
            Backend Installation & API Specs
          </button>
        </div>
      </footer>

      {/* API Docs & Setup Guide Modal */}
      <ApiDocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
