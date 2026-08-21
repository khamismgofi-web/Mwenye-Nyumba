import { Tenant, WelcomeEmailRecord } from '../types';

const EMAIL_STORAGE_KEY = 'mwenye_nyumba_sent_emails_v1';

export class MockEmailService {
  /**
   * Retrieves all historical sent emails from local storage.
   */
  static getSentEmails(): WelcomeEmailRecord[] {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Generates and dispatches a welcome email with tenant login credentials.
   * Simulates network transmission latency for realistic user feedback.
   */
  static async sendTenantWelcomeEmail(tenant: Tenant): Promise<WelcomeEmailRecord> {
    // Artificial latency (350ms) to simulate SMTP / API relay dispatch
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (!tenant.email) {
      throw new Error(`Cannot send welcome email: Tenant ${tenant.name} has no email address configured.`);
    }

    const defaultPassword = 'tenant123';
    const sentAt = new Date().toISOString();
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const propertyName = tenant.property_name || 'Mwenye-Nyumba Properties';
    const unitNumber = tenant.unit_number || 'Assigned Unit';
    const rentAmount = tenant.rent_amount || 0;

    const emailRecord: WelcomeEmailRecord = {
      id: emailId,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      to_email: tenant.email,
      subject: `Welcome to ${propertyName} – Your Tenant Portal Login & Tenancy Guide`,
      temp_password: defaultPassword,
      unit_number: unitNumber,
      property_name: propertyName,
      rent_amount: rentAmount,
      sent_at: sentAt,
      status: 'delivered',
      content_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Karibu, ${tenant.name}!</h2>
          <p style="font-size: 15px; color: #475569;">
            We are pleased to welcome you to <strong>${propertyName}</strong> (${unitNumber}). Your tenant account has been activated in the Mwenye-Nyumba management system.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; margin-top: 0;">
              Your Tenant Portal Credentials
            </h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">Portal Login URL:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">https://mwenyenyumba.app/portal</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Username / Email:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 600; color: #4f46e5;">${tenant.email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 600; color: #0f172a;">${defaultPassword}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Assigned Unit:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${unitNumber} (${propertyName})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Monthly Rent:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #16a34a;">KES ${rentAmount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
            Through your tenant portal, you can view your monthly statements, submit instant M-Pesa rent payments, and raise maintenance tickets directly with building management.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8;">
            Mwenye-Nyumba Property Management • Automated Tenancy Dispatch Service
          </div>
        </div>
      `,
    };

    // Save to local email dispatch log
    const existing = this.getSentEmails();
    const updated = [emailRecord, ...existing];
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));

    return emailRecord;
  }
}
