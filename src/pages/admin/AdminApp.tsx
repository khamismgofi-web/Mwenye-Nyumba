import type { ComponentType } from 'react';
import { Building2, LayoutGrid, Users, Wallet, Wrench } from 'lucide-react';
import { NavItem, Shell } from '../../components/Shell';
import { AdminDataProvider } from './data';
import Overview from './Overview';
import Properties from './Properties';
import Rent from './Rent';
import Repairs from './Repairs';
import Tenants from './Tenants';

const items: NavItem[] = [
  { key: 'overview', label: 'Overview', to: '/admin/overview', icon: <LayoutGrid size={18} /> },
  { key: 'properties', label: 'Properties', to: '/admin/properties', icon: <Building2 size={18} /> },
  { key: 'tenants', label: 'Tenants', to: '/admin/tenants', icon: <Users size={18} /> },
  { key: 'rent', label: 'Rent', to: '/admin/rent', icon: <Wallet size={18} /> },
  { key: 'repairs', label: 'Repairs', to: '/admin/repairs', icon: <Wrench size={18} /> },
];

const pages: Record<string, ComponentType> = {
  overview: Overview,
  properties: Properties,
  tenants: Tenants,
  rent: Rent,
  repairs: Repairs,
};

export default function AdminApp({ path }: { path: string }) {
  const segment = path.split('/')[2] || 'overview';
  const tab = pages[segment] ? segment : 'overview';
  const Page = pages[tab];
  return (
    <AdminDataProvider>
      <Shell items={items} current={tab}>
        <Page />
      </Shell>
    </AdminDataProvider>
  );
}
