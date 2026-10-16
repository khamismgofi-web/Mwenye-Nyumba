import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Entry, InviteCode, Payment, Property, Repair, Tenant, Unit } from '../../types';

interface Data {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  payments: Payment[];
  repairs: Repair[];
  invites: InviteCode[];
  entries: Entry[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<Data>(null as unknown as Data);
export const useData = () => useContext(DataContext);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    properties: [] as Property[],
    units: [] as Unit[],
    tenants: [] as Tenant[],
    payments: [] as Payment[],
    repairs: [] as Repair[],
    invites: [] as InviteCode[],
    entries: [] as Entry[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [properties, units, tenants, payments, repairs, invites, entries] = await Promise.all([
        api.properties(),
        api.units(),
        api.tenants(),
        api.payments(),
        api.repairs(),
        api.inviteCodes(),
        api.entries(),
      ]);
      setState({ properties, units, tenants, payments, repairs, invites, entries });
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Could not load your data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return <DataContext.Provider value={{ ...state, loading, error, reload }}>{children}</DataContext.Provider>;
}
