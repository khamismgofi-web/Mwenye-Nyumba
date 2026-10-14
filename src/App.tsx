import { AuthProvider, useAuth } from './auth';
import { ToastProvider } from './components/ui';
import { useRoute } from './lib/router';
import AdminApp from './pages/admin/AdminApp';
import AuthPage from './pages/AuthPage';
import Landing from './pages/Landing';
import TenantApp from './pages/tenant/TenantApp';

function Routes() {
  const { session } = useAuth();
  const { path, params } = useRoute();

  if (!session) {
    if (path === '/login') return <AuthPage mode="login" />;
    if (path === '/register') return <AuthPage mode="register" code={params.get('code') || ''} />;
    return <Landing />;
  }
  if (session.role === 'admin') return <AdminApp path={path} />;
  return <TenantApp path={path} />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </ToastProvider>
  );
}
