export type UserRole = 'admin' | 'tenant';

export type UnitStatus = 'vacant' | 'occupied' | 'maintenance';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'credit_card' | 'other';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  tenant_id?: number | null;
  unit_id?: number | null;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  owner: string;
  description?: string;
  created_at: string;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  total_revenue_potential: number;
}

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  rent_amount: number;
  status: UnitStatus;
  floor?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  created_at: string;
  property_name?: string | null;
  current_tenant_name?: string | null;
  current_tenant_id?: number | null;
}

export interface Tenant {
  id: number;
  user_id: number;
  unit_id: number;
  name: string;
  contact_info: string;
  lease_start: string;
  lease_end: string;
  national_id?: string | null;
  email?: string | null;
  photo_url?: string | null;
  welcome_email_sent?: boolean;
  welcome_email_sent_at?: string | null;
  created_at: string;
  unit_number?: string | null;
  property_name?: string | null;
  property_id?: number | null;
  rent_amount?: number | null;
  balance_due?: number;
}

export interface WelcomeEmailRecord {
  id: string;
  tenant_id: number;
  tenant_name: string;
  to_email: string;
  subject: string;
  temp_password: string;
  unit_number: string;
  property_name: string;
  rent_amount: number;
  sent_at: string;
  status: 'delivered' | 'failed';
  content_html?: string;
}

export interface Payment {
  id: number;
  tenant_id: number;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  status: PaymentStatus;
  payment_method?: PaymentMethod | null;
  reference_code?: string | null;
  notes?: string | null;
  created_at: string;
  tenant_name?: string | null;
  unit_number?: string | null;
  property_name?: string | null;
}

export interface MaintenanceRequest {
  id: number;
  tenant_id: number;
  unit_id: number;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  admin_notes?: string | null;
  created_at: string;
  tenant_name?: string | null;
  unit_number?: string | null;
  property_name?: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export type AdminTab = 'dashboard' | 'properties' | 'units' | 'tenants' | 'payments' | 'maintenance';
export type TenantTab = 'my-unit' | 'my-payments' | 'my-maintenance';
