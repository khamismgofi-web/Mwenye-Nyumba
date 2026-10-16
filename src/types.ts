export type Role = 'admin' | 'tenant';
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'credit_card' | 'other';
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RepairPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Session {
  access_token: string;
  refresh_token: string;
  user_id: number;
  email: string;
  role: Role;
  tenant_id: number | null;
  unit_id: number | null;
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
  photo_url?: string | null;
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
  created_at: string;
  unit_number?: string | null;
  property_name?: string | null;
  property_id?: number | null;
  rent_amount?: number | null;
  balance_due?: number | null;
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

export interface Repair {
  id: number;
  tenant_id: number;
  unit_id: number;
  title: string;
  description: string;
  category?: string | null;
  priority: RepairPriority;
  status: RepairStatus;
  admin_notes?: string | null;
  created_at: string;
  tenant_name?: string | null;
  unit_number?: string | null;
  property_name?: string | null;
}

export interface InviteCode {
  id: number;
  code: string;
  unit_id: number;
  used: boolean;
  lease_start: string;
  lease_end: string;
  expires_at: string;
  created_at: string;
}

export type EntryKind = 'note' | 'plan' | 'expense';

export interface Entry {
  id: number;
  property_id: number;
  unit_id?: number | null;
  kind: EntryKind;
  title: string;
  body?: string | null;
  amount?: number | null;
  category?: string | null;
  entry_date: string;
  target_date?: string | null;
  done: boolean;
  created_at: string;
}

export interface Profile {
  id: number;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: Role;
}

export interface AuthConfig {
  landlord_signup_enabled: boolean;
  email_alerts: boolean;
  sms_alerts: boolean;
  photos: boolean;
}
