import { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailsPage } from './pages/UserDetailsPage';
import { PlansPage } from './pages/PlansPage';
import { ErrorsPage } from './pages/ErrorsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  LogOut,
  ShieldAlert,
  Settings
} from 'lucide-react';

function DashboardLayout() {
  const { profile, signOut, isAdmin } = useAdminAuth();

  if (!isAdmin) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <ShieldAlert color="var(--color-danger)" size={64} style={{ marginBottom: '24px' }} />
          <h1 style={{ marginBottom: '12px', color: 'var(--color-text-primary)' }}>Acesso Restrito</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
            Este terminal é exclusivo para administradores da EPROC Perito.
          </p>
          <button onClick={signOut} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-title">
            <img
              src="/icons/icon16.png"
              alt="Logo EPROC Perito"
              style={{ width: '35px', height: '35px', objectFit: 'contain' }}
            />
            EPROC <span style={{ color: 'var(--color-text-secondary)', marginLeft: '2px' }}>PERITO</span>
          </div>
        </div>

        <nav className="nav-group">
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Visão Geral
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} /> Clientes
          </NavLink>
          <NavLink to="/admin/plans" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CreditCard size={18} /> Planos e Preços
          </NavLink>
          <NavLink to="/admin/errors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={18} /> Logs de Suporte
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={18} /> Configurações
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px', borderTop: '1px solid var(--color-border)' }}>
          <div className="nav-item" onClick={signOut} style={{ color: 'var(--color-danger)' }}>
            <LogOut size={18} /> Sair do Sistema
          </div>
        </div>
      </aside>

      <main className="main-wrapper">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{profile?.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Gestão Administrativa</div>
            </div>
            <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '14px' }}>
              {profile?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAdminAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Inicializar o tema dark se estiver salvo
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  if (showPrivacy) {
    return (
      <div className="login-screen" style={{ display: 'block', overflowY: 'auto', background: 'var(--color-bg)' }}>
        <PrivacyPage onBack={() => setShowPrivacy(false)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="login-screen">
        <p style={{ color: 'var(--color-text-secondary)' }}>Validando credenciais...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/admin" replace /> : <LoginPage onShowPrivacy={() => setShowPrivacy(true)} />} />
      <Route path="/admin" element={user ? <DashboardLayout /> : <Navigate to="/" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="errors" element={<ErrorsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
