import type { ComponentType } from 'react';
import { useState } from 'react';
import { Building2, LayoutGrid, NotebookPen, Settings as SettingsIcon, Users, Wallet, Wrench } from 'lucide-react';
import { useAuth } from '../../auth';
import { Tour } from '../../components/Tour';
import { NavItem, Shell } from '../../components/Shell';
import { AdminDataProvider } from './data';
import NotebookPage from './NotebookPage';
import Settings from './Settings';
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
  { key: 'notebook', label: 'Notebook', to: '/admin/notebook', icon: <NotebookPen size={18} /> },
  { key: 'settings', label: 'Settings', to: '/admin/settings', icon: <SettingsIcon size={18} /> },
];

const pages: Record<string, ComponentType<{ onGuide: () => void }>> = {
  overview: Overview,
  properties: Properties,
  tenants: Tenants,
  rent: Rent,
  repairs: Repairs,
  notebook: NotebookPage,
  settings: Settings,
};

export default function AdminApp({ path }: { path: string }) {
  const segment = path.split('/')[2] || 'overview';
  const tab = pages[segment] ? segment : 'overview';
  const Page = pages[tab];
  const { session } = useAuth();
  const tourKey = `mn_tour_${session?.user_id}`;
  const [touring, setTouring] = useState(() => {
    try {
      return !localStorage.getItem(tourKey);
    } catch {
      return false;
    }
  });
  const openGuide = () => setTouring(true);
  const closeGuide = () => {
    try {
      localStorage.setItem(tourKey, '1');
    } catch {
      return;
    } finally {
      setTouring(false);
    }
  };
  return (
    <AdminDataProvider>
      <Shell items={items} current={tab} onGuide={openGuide}>
        <Page onGuide={openGuide} />
      </Shell>
      {touring && <Tour onClose={closeGuide} />}
    </AdminDataProvider>
  );
}
