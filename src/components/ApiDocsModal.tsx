import React from 'react';
import { BookOpen, X, Terminal, Server, ShieldCheck, Database, Key } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-xl max-w-3xl w-full p-6 sm:p-8 shadow-xl border border-gray-100 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-gray-900">
              FastAPI & PostgreSQL Backend Architecture Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-6 text-sm text-gray-600">
          {/* Section 1: Quickstart Commands */}
          <div>
            <h4 className="font-bold text-gray-900 flex items-center space-x-2 text-base">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>1. Running the FastAPI Backend Locally</span>
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              The project includes production-ready Python FastAPI, SQLAlchemy 2.0 async, and Alembic migrations.
            </p>

            <div className="bg-gray-900 p-4 rounded-xl font-mono text-xs text-indigo-300 mt-2 space-y-1.5 border border-gray-800">
              <div className="text-gray-400"># 1. Create and activate virtualenv</div>
              <div className="text-white">python -m venv venv && source venv/bin/activate</div>
              <div className="pt-1 text-gray-400"># 2. Install requirements</div>
              <div className="text-white">pip install -r requirements.txt</div>
              <div className="pt-1 text-gray-400"># 3. Run database migrations</div>
              <div className="text-white">alembic upgrade head</div>
              <div className="pt-1 text-gray-400"># 4. Seed database with properties, units, tenants</div>
              <div className="text-white">python seed.py</div>
              <div className="pt-1 text-gray-400"># 5. Start ASGI server with interactive Swagger UI</div>
              <div className="text-green-400">uvicorn app.main:app --reload --port 8000</div>
            </div>
          </div>

          {/* Section 2: RBAC Security Enforcement */}
          <div>
            <h4 className="font-bold text-gray-900 flex items-center space-x-2 text-base">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>2. Server-Side RBAC & Authorization Rules</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-indigo-700 text-xs uppercase tracking-wider">
                  Admin (Landlord) Role
                </div>
                <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
                  <li>Full CRUD on Properties, Units, Tenants, Leases.</li>
                  <li>View & record all tenant payments & invoices.</li>
                  <li>Update maintenance ticket statuses & admin notes.</li>
                  <li>Enforced via FastAPI dependency: <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-[11px]">get_current_admin</code>.</li>
                </ul>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-indigo-700 text-xs uppercase tracking-wider">
                  Tenant Role
                </div>
                <ul className="text-xs text-gray-600 mt-1.5 space-y-1 list-disc list-inside">
                  <li>Can ONLY access own unit info (<code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-[11px]">/api/tenants/me/unit</code>).</li>
                  <li>Can ONLY view own payments & submit own maintenance tickets.</li>
                  <li>Strict 403 Forbidden thrown if trying to query another tenant's ID.</li>
                  <li>Enforced via: <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-[11px]">get_current_tenant_profile</code>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Seed Credentials */}
          <div>
            <h4 className="font-bold text-gray-900 flex items-center space-x-2 text-base">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>3. Seed Demo Credentials</span>
            </h4>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2 mt-2">
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <div>
                  <strong className="text-gray-900">Admin:</strong> <code className="text-indigo-600">admin@mwenyenyumba.com</code>
                </div>
                <div className="text-gray-500">Password: <code className="text-gray-800 font-medium">admin123</code></div>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <div>
                  <strong className="text-gray-900">Tenant 1:</strong> <code className="text-indigo-600">tenant.john@mwenyenyumba.com</code>
                </div>
                <div className="text-gray-500">Password: <code className="text-gray-800 font-medium">tenant123</code></div>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1.5">
                <div>
                  <strong className="text-gray-900">Tenant 2:</strong> <code className="text-indigo-600">tenant.mary@mwenyenyumba.com</code>
                </div>
                <div className="text-gray-500">Password: <code className="text-gray-800 font-medium">tenant123</code></div>
              </div>
              <div className="flex justify-between">
                <div>
                  <strong className="text-gray-900">Tenant 3:</strong> <code className="text-indigo-600">tenant.david@mwenyenyumba.com</code>
                </div>
                <div className="text-gray-500">Password: <code className="text-gray-800 font-medium">tenant123</code></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
