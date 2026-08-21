import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Send,
  Lock,
  User,
  Home,
} from 'lucide-react';
import { Tenant, WelcomeEmailRecord } from '../types';

interface WelcomeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailRecord: WelcomeEmailRecord | null;
  tenant: Tenant | null;
  onResend: (tenantId: number) => Promise<void>;
}

export const WelcomeEmailModal: React.FC<WelcomeEmailModalProps> = ({
  isOpen,
  onClose,
  emailRecord,
  tenant,
  onResend,
}) => {
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isOpen || !emailRecord || !tenant) return null;

  const handleCopyCredentials = () => {
    const textToCopy = `Mwenye-Nyumba Tenant Portal Login Credentials:
Portal URL: https://mwenyenyumba.app/portal
Username / Email: ${emailRecord.to_email}
Temporary Password: ${emailRecord.temp_password}
Unit: ${emailRecord.unit_number} (${emailRecord.property_name})
Monthly Rent: KES ${emailRecord.rent_amount.toLocaleString()}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend(tenant.id);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 relative my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2">
                <span>Welcome Email Dispatched</span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Delivered
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Mock Email Service transmission confirmation for {tenant.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Envelope Summary Metadata */}
        <div className="bg-gray-50/80 rounded-xl p-3.5 mt-4 border border-gray-200 text-xs space-y-1.5 font-sans">
          <div className="flex justify-between items-center text-gray-600">
            <span>
              <strong className="text-gray-900">To:</strong> {tenant.name} &lt;
              <span className="text-indigo-600 font-medium">{emailRecord.to_email}</span>&gt;
            </span>
            <span className="text-[11px] text-gray-400">
              {new Date(emailRecord.sent_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
          <div className="text-gray-600">
            <strong className="text-gray-900">From:</strong> Mwenye-Nyumba Dispatch &lt;
            <span className="text-gray-500">notifications@mwenyenyumba.com</span>&gt;
          </div>
          <div className="text-gray-800 font-medium pt-0.5">
            <strong className="text-gray-900">Subject:</strong> {emailRecord.subject}
          </div>
        </div>

        {/* Simulated Email Body Container */}
        <div className="mt-4 flex-1 overflow-y-auto border border-gray-200 rounded-xl p-5 bg-white shadow-2xs space-y-4 text-sm text-gray-700 leading-relaxed">
          <div className="border-b border-gray-100 pb-3">
            <h4 className="font-bold text-lg text-indigo-700">Karibu, {tenant.name}! 👋</h4>
            <p className="text-xs text-gray-500 mt-1">
              We are pleased to welcome you to <strong>{emailRecord.property_name}</strong> (
              {emailRecord.unit_number}). Your tenant account has been activated in the Mwenye-Nyumba
              management portal.
            </p>
          </div>

          {/* Credentials Card Callout */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 rounded-xl p-4 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Your Tenant Portal Login Credentials</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-indigo-600" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-gray-500 block text-[11px]">Portal Web Address</span>
                <span className="font-semibold text-gray-900 font-mono text-[11px]">
                  https://mwenyenyumba.app/portal
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-gray-500 block text-[11px]">Username / Email</span>
                <span className="font-bold text-indigo-700 font-mono text-[11px]">
                  {emailRecord.to_email}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-gray-500 block text-[11px]">Temporary Password</span>
                <span className="font-bold text-gray-900 font-mono text-[11px] bg-amber-50 text-amber-900 px-1 py-0.5 rounded">
                  {emailRecord.temp_password}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-50">
                <span className="text-gray-500 block text-[11px]">Monthly Rent Due</span>
                <span className="font-bold text-emerald-700">
                  KES {emailRecord.rent_amount.toLocaleString()} / month
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1.5">
            <p>
              💡 <strong>Next Steps for the Tenant:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Log in to verify your lease agreement and active tenancy dates.</li>
              <li>View upcoming monthly rent invoices and initiate instant M-Pesa payments.</li>
              <li>Submit maintenance requests and track repairs directly with building caretakers.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isResending ? 'Sending...' : 'Resend Welcome Email'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
