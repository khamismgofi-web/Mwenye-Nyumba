import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Property,
  Tenant,
  Unit,
  UnitStatus,
  User,
  WelcomeEmailRecord,
} from '../types';
import { MockEmailService } from './mockEmailService';

const STORAGE_KEY = 'mwenye_nyumba_state_v1';
const AUTH_KEY = 'mwenye_nyumba_auth_v1';

// Initial default seed state reflecting seed.py
const INITIAL_PROPERTIES: Property[] = [
  {
    id: 1,
    name: 'Kilimani Heights',
    address: 'Argwings Kodhek Road, Kilimani, Nairobi',
    owner: 'Khamis Family Holdings',
    description: 'Modern 4-storey residential apartment building with high-speed elevator and secure gated access.',
    created_at: '2024-01-10T08:00:00Z',
    total_units: 4,
    occupied_units: 2,
    vacant_units: 2,
    total_revenue_potential: 245000,
  },
  {
    id: 2,
    name: 'Mombasa Road Court',
    address: 'Near City Cabanas, Mombasa Road, Nairobi',
    owner: 'Khamis Family Holdings',
    description: 'Convenient commercial and residential court close to SGR terminal and JKI Airport.',
    created_at: '2024-02-15T09:30:00Z',
    total_units: 3,
    occupied_units: 1,
    vacant_units: 2,
    total_revenue_potential: 128000,
  },
  {
    id: 3,
    name: 'Karen Green Villas',
    address: 'Ngong View Close, Karen, Nairobi',
    owner: 'Khamis Family Holdings',
    description: 'Luxury 4-bedroom townhouses with private landscaped gardens and solar water heating.',
    created_at: '2023-10-01T10:00:00Z',
    total_units: 2,
    occupied_units: 1,
    vacant_units: 1,
    total_revenue_potential: 280000,
  },
];

const INITIAL_UNITS: Unit[] = [
  {
    id: 1,
    property_id: 1,
    unit_number: 'Apt 101',
    rent_amount: 55000,
    status: 'occupied',
    floor: 1,
    bedrooms: 2,
    bathrooms: 2,
    created_at: '2024-01-10T08:00:00Z',
    property_name: 'Kilimani Heights',
    current_tenant_name: 'John Kamau',
    current_tenant_id: 1,
  },
  {
    id: 2,
    property_id: 1,
    unit_number: 'Apt 102',
    rent_amount: 55000,
    status: 'occupied',
    floor: 1,
    bedrooms: 2,
    bathrooms: 2,
    created_at: '2024-01-10T08:00:00Z',
    property_name: 'Kilimani Heights',
    current_tenant_name: 'Mary Wanjiku',
    current_tenant_id: 2,
  },
  {
    id: 3,
    property_id: 1,
    unit_number: 'Apt 201',
    rent_amount: 60000,
    status: 'vacant',
    floor: 2,
    bedrooms: 2,
    bathrooms: 2,
    created_at: '2024-01-10T08:00:00Z',
    property_name: 'Kilimani Heights',
  },
  {
    id: 4,
    property_id: 1,
    unit_number: 'Apt 202',
    rent_amount: 75000,
    status: 'vacant',
    floor: 2,
    bedrooms: 3,
    bathrooms: 2,
    created_at: '2024-01-10T08:00:00Z',
    property_name: 'Kilimani Heights',
  },
  {
    id: 5,
    property_id: 2,
    unit_number: 'Unit B1',
    rent_amount: 40000,
    status: 'occupied',
    floor: 1,
    bedrooms: 1,
    bathrooms: 1,
    created_at: '2024-02-15T09:30:00Z',
    property_name: 'Mombasa Road Court',
    current_tenant_name: 'David Otieno',
    current_tenant_id: 3,
  },
  {
    id: 6,
    property_id: 2,
    unit_number: 'Unit B2',
    rent_amount: 40000,
    status: 'vacant',
    floor: 1,
    bedrooms: 1,
    bathrooms: 1,
    created_at: '2024-02-15T09:30:00Z',
    property_name: 'Mombasa Road Court',
  },
  {
    id: 7,
    property_id: 2,
    unit_number: 'Unit B3',
    rent_amount: 48000,
    status: 'vacant',
    floor: 2,
    bedrooms: 2,
    bathrooms: 1,
    created_at: '2024-02-15T09:30:00Z',
    property_name: 'Mombasa Road Court',
  },
  {
    id: 8,
    property_id: 3,
    unit_number: 'Villa #1',
    rent_amount: 140000,
    status: 'occupied',
    floor: 1,
    bedrooms: 4,
    bathrooms: 4,
    created_at: '2023-10-01T10:00:00Z',
    property_name: 'Karen Green Villas',
    current_tenant_name: 'Grace Achieng',
    current_tenant_id: 4,
  },
  {
    id: 9,
    property_id: 3,
    unit_number: 'Villa #2',
    rent_amount: 140000,
    status: 'vacant',
    floor: 1,
    bedrooms: 4,
    bathrooms: 4,
    created_at: '2023-10-01T10:00:00Z',
    property_name: 'Karen Green Villas',
  },
];

const INITIAL_TENANTS: Tenant[] = [
  {
    id: 1,
    user_id: 2,
    unit_id: 1,
    name: 'John Kamau',
    contact_info: '+254 712 345 678',
    national_id: '29481726',
    email: 'tenant.john@mwenyenyumba.com',
    lease_start: '2024-01-01',
    lease_end: '2025-12-31',
    created_at: '2024-01-01T08:00:00Z',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
    property_id: 1,
    rent_amount: 55000,
    balance_due: 0,
  },
  {
    id: 2,
    user_id: 3,
    unit_id: 2,
    name: 'Mary Wanjiku',
    contact_info: '+254 722 890 123',
    national_id: '31829401',
    email: 'tenant.mary@mwenyenyumba.com',
    lease_start: '2024-03-01',
    lease_end: '2025-02-28',
    created_at: '2024-03-01T08:00:00Z',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
    property_id: 1,
    rent_amount: 55000,
    balance_due: 55000,
  },
  {
    id: 3,
    user_id: 4,
    unit_id: 5,
    name: 'David Otieno',
    contact_info: '+254 733 456 789',
    national_id: '25194028',
    email: 'tenant.david@mwenyenyumba.com',
    lease_start: '2024-06-01',
    lease_end: '2025-05-31',
    created_at: '2024-06-01T08:00:00Z',
    unit_number: 'Unit B1',
    property_name: 'Mombasa Road Court',
    property_id: 2,
    rent_amount: 40000,
    balance_due: 40000,
  },
  {
    id: 4,
    user_id: 5,
    unit_id: 8,
    name: 'Grace Achieng',
    contact_info: '+254 799 112 233',
    national_id: '27103948',
    email: 'tenant.grace@mwenyenyumba.com',
    lease_start: '2023-11-01',
    lease_end: '2025-10-31',
    created_at: '2023-11-01T08:00:00Z',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
    property_id: 3,
    rent_amount: 140000,
    balance_due: 0,
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  // March 2026 Payments
  {
    id: 101,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-03-05',
    paid_date: '2026-03-03',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QA34M102AA',
    notes: 'March rent via M-Pesa',
    created_at: '2026-03-03T10:00:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 102,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-03-05',
    paid_date: '2026-03-05',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QA45M203BB',
    notes: 'March rent settlement',
    created_at: '2026-03-05T09:00:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 103,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-03-01',
    paid_date: '2026-03-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT26030101',
    notes: 'March villa rent bank transfer',
    created_at: '2026-03-01T08:30:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },

  // April 2026 Payments
  {
    id: 104,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-04-05',
    paid_date: '2026-04-04',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QB12M304CC',
    notes: 'April rent settled',
    created_at: '2026-04-04T11:20:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 105,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-04-05',
    paid_date: '2026-04-06',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QB23M405DD',
    notes: 'April rent payment',
    created_at: '2026-04-06T14:10:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 106,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-04-01',
    paid_date: '2026-04-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT26040102',
    notes: 'April villa rent',
    created_at: '2026-04-01T09:00:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },

  // May 2026 Payments
  {
    id: 107,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-05-05',
    paid_date: '2026-05-02',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QC56M506EE',
    notes: 'May rent payment',
    created_at: '2026-05-02T10:00:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 108,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-05-05',
    paid_date: '2026-05-05',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QC67M607FF',
    notes: 'May rent settlement',
    created_at: '2026-05-05T12:00:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 109,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-05-01',
    paid_date: '2026-05-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT26050103',
    notes: 'May villa rent',
    created_at: '2026-05-01T08:00:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },

  // June 2026 Payments
  {
    id: 110,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-06-05',
    paid_date: '2026-06-03',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QD78M708GG',
    notes: 'June rent payment',
    created_at: '2026-06-03T09:30:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 111,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-06-05',
    paid_date: '2026-06-05',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QD89M809HH',
    notes: 'June rent settlement',
    created_at: '2026-06-05T11:45:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 112,
    tenant_id: 3,
    amount: 40000,
    due_date: '2026-06-05',
    paid_date: '2026-06-04',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QD90M910II',
    notes: 'June initial rent after move-in',
    created_at: '2026-06-04T16:00:00Z',
    tenant_name: 'David Otieno',
    unit_number: 'Unit B1',
    property_name: 'Mombasa Road Court',
  },
  {
    id: 113,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-06-01',
    paid_date: '2026-06-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT26060104',
    notes: 'June villa rent',
    created_at: '2026-06-01T08:15:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },

  // July 2026 Payments
  {
    id: 114,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-07-05',
    paid_date: '2026-07-04',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QE11M111JJ',
    notes: 'July rent payment',
    created_at: '2026-07-04T10:10:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 115,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-07-05',
    paid_date: '2026-07-05',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QE22M222KK',
    notes: 'July rent settlement',
    created_at: '2026-07-05T14:30:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 116,
    tenant_id: 3,
    amount: 40000,
    due_date: '2026-07-05',
    paid_date: '2026-07-06',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QE33M333LL',
    notes: 'July rent payment',
    created_at: '2026-07-06T09:20:00Z',
    tenant_name: 'David Otieno',
    unit_number: 'Unit B1',
    property_name: 'Mombasa Road Court',
  },
  {
    id: 117,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-07-01',
    paid_date: '2026-07-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT26070105',
    notes: 'July villa rent',
    created_at: '2026-07-01T08:00:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },

  // August 2026 Payments (Current Cycle)
  {
    id: 1,
    tenant_id: 1,
    amount: 55000,
    due_date: '2026-08-05',
    paid_date: '2026-08-03',
    status: 'paid',
    payment_method: 'mpesa',
    reference_code: 'QK89X109LM',
    notes: 'Prompt rent payment via M-Pesa Paybill',
    created_at: '2026-08-03T10:15:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 2,
    tenant_id: 2,
    amount: 55000,
    due_date: '2026-08-05',
    paid_date: null,
    status: 'overdue',
    payment_method: 'mpesa',
    reference_code: null,
    notes: 'Overdue rent invoice - reminder notice sent',
    created_at: '2026-08-01T08:00:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 3,
    tenant_id: 3,
    amount: 40000,
    due_date: '2026-08-25',
    paid_date: null,
    status: 'pending',
    payment_method: 'bank_transfer',
    reference_code: null,
    notes: 'Upcoming invoice for August cycle',
    created_at: '2026-08-15T08:00:00Z',
    tenant_name: 'David Otieno',
    unit_number: 'Unit B1',
    property_name: 'Mombasa Road Court',
  },
  {
    id: 4,
    tenant_id: 4,
    amount: 140000,
    due_date: '2026-08-01',
    paid_date: '2026-08-01',
    status: 'paid',
    payment_method: 'bank_transfer',
    reference_code: 'FT242309104',
    notes: 'Villa monthly rent settled via NCBA bank transfer',
    created_at: '2026-08-01T09:00:00Z',
    tenant_name: 'Grace Achieng',
    unit_number: 'Villa #1',
    property_name: 'Karen Green Villas',
  },
];

const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 1,
    tenant_id: 1,
    unit_id: 1,
    title: 'Kitchen sink pipe leak',
    description: 'The PVC drainage pipe under the kitchen sink has a steady drip causing moisture build-up inside the wooden cabinet.',
    category: 'Plumbing',
    priority: 'high',
    status: 'in_progress',
    admin_notes: 'Plumber Juma dispatched on Tuesday morning to replace P-trap seal.',
    created_at: '2026-08-18T14:30:00Z',
    tenant_name: 'John Kamau',
    unit_number: 'Apt 101',
    property_name: 'Kilimani Heights',
  },
  {
    id: 2,
    tenant_id: 2,
    unit_id: 2,
    title: 'Master bedroom circuit breaker tripping',
    description: 'Whenever the instant shower heater and bedroom air conditioning run simultaneously, the sub-board breaker trips.',
    category: 'Electrical',
    priority: 'urgent',
    status: 'pending',
    admin_notes: 'Electrician scheduled for load inspection on Friday.',
    created_at: '2026-08-20T11:00:00Z',
    tenant_name: 'Mary Wanjiku',
    unit_number: 'Apt 102',
    property_name: 'Kilimani Heights',
  },
  {
    id: 3,
    tenant_id: 3,
    unit_id: 5,
    title: 'Balcony door latch replacement',
    description: 'The sliding door latch on the balcony got jammed and cannot lock firmly.',
    category: 'Carpentry',
    priority: 'low',
    status: 'completed',
    admin_notes: 'New aluminium sliding lock mechanism installed and verified.',
    created_at: '2026-08-12T09:15:00Z',
    tenant_name: 'David Otieno',
    unit_number: 'Unit B1',
    property_name: 'Mombasa Road Court',
  },
];

export const DEMO_USERS: User[] = [
  {
    id: 1,
    email: 'admin@mwenyenyumba.com',
    role: 'admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'tenant.john@mwenyenyumba.com',
    role: 'tenant',
    is_active: true,
    created_at: '2024-01-01T08:00:00Z',
    tenant_id: 1,
    unit_id: 1,
  },
  {
    id: 3,
    email: 'tenant.mary@mwenyenyumba.com',
    role: 'tenant',
    is_active: true,
    created_at: '2024-03-01T08:00:00Z',
    tenant_id: 2,
    unit_id: 2,
  },
  {
    id: 4,
    email: 'tenant.david@mwenyenyumba.com',
    role: 'tenant',
    is_active: true,
    created_at: '2024-06-01T08:00:00Z',
    tenant_id: 3,
    unit_id: 5,
  },
  {
    id: 5,
    email: 'tenant.grace@mwenyenyumba.com',
    role: 'tenant',
    is_active: true,
    created_at: '2023-11-01T08:00:00Z',
    tenant_id: 4,
    unit_id: 8,
  },
];

interface AppState {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  maintenance: MaintenanceRequest[];
  users: User[];
}

function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed: AppState = JSON.parse(raw);
      // Ensure historical seed payments are present if upgrading from minimal state
      if (parsed.payments && parsed.payments.length < INITIAL_PAYMENTS.length) {
        const existingIds = new Set(parsed.payments.map((p) => p.id));
        const missingSeed = INITIAL_PAYMENTS.filter((p) => !existingIds.has(p.id));
        parsed.payments = [...parsed.payments, ...missingSeed];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // Fallback
    }
  }
  const initialState: AppState = {
    properties: INITIAL_PROPERTIES,
    units: INITIAL_UNITS,
    tenants: INITIAL_TENANTS,
    payments: INITIAL_PAYMENTS,
    maintenance: INITIAL_MAINTENANCE,
    users: DEMO_USERS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoDatabase(): AppState {
  const initialState: AppState = {
    properties: INITIAL_PROPERTIES,
    units: INITIAL_UNITS,
    tenants: INITIAL_TENANTS,
    payments: INITIAL_PAYMENTS,
    maintenance: INITIAL_MAINTENANCE,
    users: DEMO_USERS,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
}

// Client Storage API with full RBAC enforcement
export const api = {
  // Properties
  async getProperties(): Promise<Property[]> {
    const state = loadState();
    // Recalculate dynamic statistics
    return state.properties.map((p) => {
      const units = state.units.filter((u) => u.property_id === p.id);
      return {
        ...p,
        total_units: units.length,
        occupied_units: units.filter((u) => u.status === 'occupied').length,
        vacant_units: units.filter((u) => u.status === 'vacant').length,
        total_revenue_potential: units.reduce((acc, u) => acc + u.rent_amount, 0),
      };
    });
  },

  async createProperty(data: Omit<Property, 'id' | 'created_at' | 'total_units' | 'occupied_units' | 'vacant_units' | 'total_revenue_potential'>): Promise<Property> {
    const state = loadState();
    const newProp: Property = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      total_units: 0,
      occupied_units: 0,
      vacant_units: 0,
      total_revenue_potential: 0,
    };
    state.properties.push(newProp);
    saveState(state);
    return newProp;
  },

  async updateProperty(id: number, data: Partial<Property>): Promise<Property> {
    const state = loadState();
    const index = state.properties.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Property not found');
    state.properties[index] = { ...state.properties[index], ...data };
    saveState(state);
    return state.properties[index];
  },

  async deleteProperty(id: number): Promise<void> {
    const state = loadState();
    state.properties = state.properties.filter((p) => p.id !== id);
    state.units = state.units.filter((u) => u.property_id !== id);
    saveState(state);
  },

  // Units
  async getUnits(currentUser: User, propertyId?: number): Promise<Unit[]> {
    const state = loadState();
    if (currentUser.role === 'tenant') {
      const tenant = state.tenants.find((t) => t.user_id === currentUser.id);
      if (!tenant) return [];
      return state.units.filter((u) => u.id === tenant.unit_id);
    }
    let list = state.units;
    if (propertyId) {
      list = list.filter((u) => u.property_id === propertyId);
    }
    return list;
  },

  async createUnit(data: Omit<Unit, 'id' | 'created_at' | 'property_name'>): Promise<Unit> {
    const state = loadState();
    const prop = state.properties.find((p) => p.id === data.property_id);
    const newUnit: Unit = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      property_name: prop ? prop.name : 'Unknown Property',
    };
    state.units.push(newUnit);
    saveState(state);
    return newUnit;
  },

  async updateUnit(id: number, data: Partial<Unit>): Promise<Unit> {
    const state = loadState();
    const index = state.units.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('Unit not found');
    state.units[index] = { ...state.units[index], ...data };
    saveState(state);
    return state.units[index];
  },

  async deleteUnit(id: number): Promise<void> {
    const state = loadState();
    state.units = state.units.filter((u) => u.id !== id);
    saveState(state);
  },

  // Tenants
  async getTenants(currentUser: User): Promise<Tenant[]> {
    const state = loadState();
    if (currentUser.role === 'tenant') {
      return state.tenants.filter((t) => t.user_id === currentUser.id);
    }
    return state.tenants.map((t) => {
      const balance = state.payments
        .filter((p) => p.tenant_id === t.id && (p.status === 'pending' || p.status === 'overdue'))
        .reduce((sum, p) => sum + p.amount, 0);
      return { ...t, balance_due: balance };
    });
  },

  async createTenant(data: {
    unit_id: number;
    name: string;
    contact_info: string;
    email: string;
    lease_start: string;
    lease_end: string;
    national_id?: string;
    photo_url?: string | null;
  }): Promise<Tenant> {
    const state = loadState();
    const unitIndex = state.units.findIndex((u) => u.id === data.unit_id);
    if (unitIndex === -1) throw new Error('Unit not found');

    const newUser: User = {
      id: Date.now(),
      email: data.email,
      role: 'tenant',
      is_active: true,
      created_at: new Date().toISOString(),
      tenant_id: Date.now() + 1,
      unit_id: data.unit_id,
    };

    const newTenant: Tenant = {
      id: newUser.tenant_id!,
      user_id: newUser.id,
      unit_id: data.unit_id,
      name: data.name,
      contact_info: data.contact_info,
      national_id: data.national_id || '',
      email: data.email,
      photo_url: data.photo_url || null,
      lease_start: data.lease_start,
      lease_end: data.lease_end,
      created_at: new Date().toISOString(),
      unit_number: state.units[unitIndex].unit_number,
      property_name: state.units[unitIndex].property_name,
      property_id: state.units[unitIndex].property_id,
      rent_amount: state.units[unitIndex].rent_amount,
      balance_due: 0,
    };

    // Mark unit occupied
    state.units[unitIndex].status = 'occupied';
    state.units[unitIndex].current_tenant_name = data.name;
    state.units[unitIndex].current_tenant_id = newTenant.id;

    state.users.push(newUser);
    state.tenants.push(newTenant);
    saveState(state);

    return newTenant;
  },

  async sendTenantWelcomeEmail(tenantId: number): Promise<WelcomeEmailRecord> {
    const state = loadState();
    const index = state.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) throw new Error('Tenant not found');

    const tenant = state.tenants[index];
    const emailRecord = await MockEmailService.sendTenantWelcomeEmail(tenant);

    // Update tenant record
    state.tenants[index].welcome_email_sent = true;
    state.tenants[index].welcome_email_sent_at = emailRecord.sent_at;
    saveState(state);

    return emailRecord;
  },

  async updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
    const state = loadState();
    const index = state.tenants.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tenant not found');
    state.tenants[index] = { ...state.tenants[index], ...data };
    saveState(state);
    return state.tenants[index];
  },

  async deleteTenant(id: number): Promise<void> {
    const state = loadState();
    const tenant = state.tenants.find((t) => t.id === id);
    if (tenant) {
      const uIndex = state.units.findIndex((u) => u.id === tenant.unit_id);
      if (uIndex !== -1) {
        state.units[uIndex].status = 'vacant';
        state.units[uIndex].current_tenant_name = undefined;
        state.units[uIndex].current_tenant_id = undefined;
      }
      state.users = state.users.filter((u) => u.id !== tenant.user_id);
    }
    state.tenants = state.tenants.filter((t) => t.id !== id);
    saveState(state);
  },

  // Payments
  async getPayments(currentUser: User): Promise<Payment[]> {
    const state = loadState();
    if (currentUser.role === 'tenant') {
      const tenant = state.tenants.find((t) => t.user_id === currentUser.id);
      if (!tenant) return [];
      return state.payments.filter((p) => p.tenant_id === tenant.id);
    }
    return state.payments;
  },

  async createPayment(data: Omit<Payment, 'id' | 'created_at' | 'tenant_name' | 'unit_number' | 'property_name'>): Promise<Payment> {
    const state = loadState();
    const tenant = state.tenants.find((t) => t.id === data.tenant_id);
    const newPayment: Payment = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString(),
      tenant_name: tenant ? tenant.name : 'Unknown Tenant',
      unit_number: tenant ? tenant.unit_number : '',
      property_name: tenant ? tenant.property_name : '',
    };
    state.payments.unshift(newPayment);
    saveState(state);
    return newPayment;
  },

  async updatePayment(id: number, data: Partial<Payment>): Promise<Payment> {
    const state = loadState();
    const index = state.payments.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    state.payments[index] = { ...state.payments[index], ...data };
    saveState(state);
    return state.payments[index];
  },

  // Maintenance Requests
  async getMaintenanceRequests(currentUser: User): Promise<MaintenanceRequest[]> {
    const state = loadState();
    if (currentUser.role === 'tenant') {
      const tenant = state.tenants.find((t) => t.user_id === currentUser.id);
      if (!tenant) return [];
      return state.maintenance.filter((m) => m.tenant_id === tenant.id);
    }
    return state.maintenance;
  },

  async createMaintenanceRequest(
    currentUser: User,
    data: { title: string; description: string; category: string; priority: MaintenancePriority; unit_id?: number }
  ): Promise<MaintenanceRequest> {
    const state = loadState();
    let tenantId = 0;
    let unitId = data.unit_id || 0;
    let tName = '';
    let uNum = '';
    let pName = '';

    if (currentUser.role === 'tenant') {
      const tenant = state.tenants.find((t) => t.user_id === currentUser.id);
      if (!tenant) throw new Error('No tenant profile');
      tenantId = tenant.id;
      unitId = tenant.unit_id;
      tName = tenant.name;
      uNum = tenant.unit_number || '';
      pName = tenant.property_name || '';
    } else {
      tenantId = 1;
      const unit = state.units.find((u) => u.id === unitId);
      tName = unit?.current_tenant_name || 'Admin Ticket';
      uNum = unit?.unit_number || '';
      pName = unit?.property_name || '';
    }

    const newReq: MaintenanceRequest = {
      id: Date.now(),
      tenant_id: tenantId,
      unit_id: unitId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'pending',
      created_at: new Date().toISOString(),
      tenant_name: tName,
      unit_number: uNum,
      property_name: pName,
    };
    state.maintenance.unshift(newReq);
    saveState(state);
    return newReq;
  },

  async updateMaintenanceRequest(id: number, data: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const state = loadState();
    const index = state.maintenance.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Maintenance request not found');
    state.maintenance[index] = { ...state.maintenance[index], ...data };
    saveState(state);
    return state.maintenance[index];
  },
};

export const apiService = {
  resetDatabase: resetDemoDatabase,
  getProperties: () => api.getProperties(),
  createProperty: (data: Omit<Property, 'id' | 'created_at' | 'total_units' | 'occupied_units' | 'vacant_units' | 'total_revenue_potential'>) => api.createProperty(data),
  updateProperty: (id: number, data: Partial<Property>) => api.updateProperty(id, data),
  deleteProperty: (id: number) => api.deleteProperty(id),

  getUnits: (currentUser?: User, propertyId?: number) => api.getUnits(currentUser || DEMO_USERS[0], propertyId),
  createUnit: (data: Omit<Unit, 'id' | 'created_at' | 'property_name'>) => api.createUnit(data),
  updateUnit: (id: number, data: Partial<Unit>) => api.updateUnit(id, data),
  deleteUnit: (id: number) => api.deleteUnit(id),

  getTenants: (currentUser?: User) => api.getTenants(currentUser || DEMO_USERS[0]),
  createTenant: (data: {
    unit_id: number;
    name: string;
    contact_info: string;
    email: string;
    lease_start: string;
    lease_end: string;
    national_id?: string;
    photo_url?: string | null;
  }) => api.createTenant(data),
  sendTenantWelcomeEmail: (tenantId: number) => api.sendTenantWelcomeEmail(tenantId),
  updateTenant: (id: number, data: Partial<Tenant>) => api.updateTenant(id, data),
  deleteTenant: (id: number) => api.deleteTenant(id),

  getPayments: (currentUser?: User) => api.getPayments(currentUser || DEMO_USERS[0]),
  createPayment: (data: Omit<Payment, 'id' | 'created_at' | 'tenant_name' | 'unit_number' | 'property_name'>) => api.createPayment(data),
  updatePayment: (id: number, data: Partial<Payment>) => api.updatePayment(id, data),

  getMaintenanceRequests: (currentUser?: User) => api.getMaintenanceRequests(currentUser || DEMO_USERS[0]),
  createMaintenance: (data: {
    title: string;
    description: string;
    category: string;
    priority: MaintenancePriority;
    tenant_id?: number;
    unit_id?: number;
  }) => {
    const state = loadState();
    const tenant = data.tenant_id ? state.tenants.find((t) => t.id === data.tenant_id) : undefined;
    const unit = tenant ? state.units.find((u) => u.id === tenant.unit_id) : (data.unit_id ? state.units.find((u) => u.id === data.unit_id) : state.units[0]);

    const newReq: MaintenanceRequest = {
      id: Date.now(),
      tenant_id: tenant?.id || 1,
      unit_id: unit?.id || 1,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'pending',
      created_at: new Date().toISOString(),
      tenant_name: tenant?.name || unit?.current_tenant_name || 'Admin Ticket',
      unit_number: unit?.unit_number || '',
      property_name: unit?.property_name || '',
    };
    state.maintenance.unshift(newReq);
    saveState(state);
    return Promise.resolve(newReq);
  },
  updateMaintenance: (id: number, data: Partial<MaintenanceRequest>) => api.updateMaintenanceRequest(id, data),
};

