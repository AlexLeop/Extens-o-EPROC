import { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Zap, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onShowPrivacy: () => void;
}

export function LoginPage({ onShowPrivacy }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAdminAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError('Credenciais inválidas ou acesso não autorizado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen" style={{ flexDirection: 'column', gap: '20px' }}>
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ 
            background: 'var(--color-primary)', 
            padding: '16px', 
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)' 
          }}>
            <Zap color="white" size={32} fill="white" stroke="none" />
          </div>
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          marginBottom: '8px',
          textAlign: 'center',
          color: '#fff',
          letterSpacing: '-0.5px'
        }}>EPROC <span style={{ color: 'var(--color-primary)' }}>PERITO</span></h1>
        
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          textAlign: 'center', 
          marginBottom: '40px',
          fontSize: '14px' 
        }}>Portal Administrativo Oficial</p>

        {error && <div style={{ 
          color: 'var(--color-danger)', 
          marginBottom: '24px', 
          fontSize: '13px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          padding: '12px', 
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <ShieldAlert size={16} />
          {error}
        </div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>E-mail</label>
            <input 
              type="email" 
              placeholder="admin@eprocperito.com.br" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '12px', width: '100%', justifyContent: 'center', height: '48px' }}>
            {loading ? 'Autenticando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>

      <button 
        onClick={onShowPrivacy}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--color-text-secondary)', 
          fontSize: '12px', 
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        Política de Privacidade e LGPD
      </button>
    </div>
  );
}
