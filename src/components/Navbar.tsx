import React from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  LayoutDashboard,
  Home,
  LogOut,
  RotateCcw,
  BookOpen,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { AdminTab, TenantTab, User } from '../types';
import { DEMO_USERS } from '../services/api';

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  tenantTab: TenantTab;
  setTenantTab: (tab: TenantTab) => void;
  onResetDb: () => void;
  onOpenDocs: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  adminTab,
  setAdminTab,
  tenantTab,
  setTenantTab,
  onResetDb,
  onOpenDocs,
}) => {
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white text-gray-900 border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mode */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-indigo-600">Mwenye-Nyumba</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'bg-green-50 text-green-700 border border-green-100'
                  }`}
                >
                  {isAdmin ? 'Admin Panel' : 'Tenant Portal'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Family Rental Property Management</p>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <label htmlFor="user-select" className="text-xs text-gray-500 font-medium">
                Active User:
              </label>
              <select
                id="user-select"
                value={currentUser.id}
                onChange={(e) => {
                  const found = DEMO_USERS.find((u) => u.id === Number(e.target.value));
                  if (found) onSelectUser(found);
                }}
                className="bg-transparent text-xs text-gray-900 font-semibold focus:outline-none cursor-pointer pl-1"
              >
                {DEMO_USERS.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white text-gray-900">
                    {u.role === 'admin' ? '👑 ' : '🔑 '}
                    {u.email} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <button
              onClick={onOpenDocs}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition shadow-xs"
              title="FastAPI Backend & Setup Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">API & Setup</span>
            </button>

            <button
              onClick={onResetDb}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition shadow-xs"
              title="Reset to default seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Seed</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 sm:space-x-2 py-2 border-t border-gray-100 overflow-x-auto scrollbar-none">
          {isAdmin ? (
            <>
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setAdminTab('properties')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'properties'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Properties</span>
              </button>
              <button
                onClick={() => setAdminTab('units')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'units'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Units</span>
              </button>
              <button
                onClick={() => setAdminTab('tenants')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'tenants'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Tenants</span>
              </button>
              <button
                onClick={() => setAdminTab('payments')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'payments'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payments</span>
              </button>
              <button
                onClick={() => setAdminTab('maintenance')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  adminTab === 'maintenance'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Maintenance</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setTenantTab('my-unit')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  tenantTab === 'my-unit'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>My Unit & Lease</span>
              </button>
              <button
                onClick={() => setTenantTab('my-payments')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  tenantTab === 'my-payments'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Rent & Payments</span>
              </button>
              <button
                onClick={() => setTenantTab('my-maintenance')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  tenantTab === 'my-maintenance'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Repair Requests</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
