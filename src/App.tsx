import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { PlansPage } from './pages/PlansPage';
import { ErrorsPage } from './pages/ErrorsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  LogOut,
  ShieldAlert,
  Zap
} from 'lucide-react';

function DashboardLayout() {
  const { profile, signOut, isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <ShieldAlert color="var(--color-danger)" size={64} style={{ marginBottom: '24px' }} />
          <h1 style={{ marginBottom: '12px', color: '#fff' }}>Acesso Restrito</h1>
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'users': return <UsersPage />;
      case 'plans': return <PlansPage />;
      case 'errors': return <ErrorsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-title">
            <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} fill="white" stroke="none" />
            </div>
            EPROC <span style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>PERITO</span>
          </div>
        </div>
        
        <nav className="nav-group">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Visão Geral
          </div>
          <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Clientes
          </div>
          <div className={`nav-item ${activeTab === 'plans' ? 'active' : ''}`} onClick={() => setActiveTab('plans')}>
            <CreditCard size={18} /> Planos e Preços
          </div>
          <div className={`nav-item ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
            <AlertTriangle size={18} /> Logs de Suporte
          </div>
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
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{profile?.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Gestão Administrativa</div>
            </div>
            <div style={{ width: '36px', height: '36px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '14px' }}>
              {profile?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAdminAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);

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

  return user ? <DashboardLayout /> : <LoginPage onShowPrivacy={() => setShowPrivacy(true)} />;
}

function App() {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  );
}

export default App;
