import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, ShieldAlert, Key, CreditCard, Save, Ban, CheckCircle } from 'lucide-react';

export function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Drafts
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        setUser(data);
        setNewEmail(data.email || '');
        setNewPlan(data.subscription_tier || 'trial');
      }
      
      const { data: plansData } = await supabase.from('plans').select('id, name').order('price', { ascending: true });
      if (plansData) {
        setAvailablePlans([{ id: 'trial', name: 'Trial (Teste)' }, ...plansData]);
      }
      
      setLoading(false);
    }
    fetchUser();
  }, [id]);

  const callEdgeFunction = async (action: string, payload: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    
    if (!token) throw new Error('Não autenticado');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, userId: id, ...payload })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro na requisição');
    return result;
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user.email) return;
    if (!confirm(`Deseja realmente alterar o e-mail deste cliente para ${newEmail}?`)) return;
    
    setActionLoading(true);
    try {
      await callEdgeFunction('update_email', { targetEmail: newEmail });
      alert('E-mail atualizado com sucesso!');
      setUser({ ...user, email: newEmail });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!confirm('Tem certeza de que deseja forçar uma nova senha para este cliente?')) return;

    setActionLoading(true);
    try {
      await callEdgeFunction('update_password', { targetPassword: newPassword });
      alert('Senha atualizada com sucesso!');
      setNewPassword('');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (newPlan === user.subscription_tier) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ subscription_tier: newPlan }).eq('id', id);
      if (error) throw error;
      alert('Plano atualizado com sucesso!');
      setUser({ ...user, subscription_tier: newPlan });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBan = async () => {
    const isBanned = user.is_disabled;
    const action = isBanned ? 'unban_user' : 'ban_user';
    const confirmMsg = isBanned 
      ? 'Deseja reativar esta conta completamente?' 
      : 'ATENÇÃO: Deseja banir esta conta? O usuário não poderá fazer login na extensão.';

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await callEdgeFunction(action, {});
      await supabase.from('profiles').update({ is_disabled: !isBanned }).eq('id', id);
      alert(isBanned ? 'Conta Reativada!' : 'Conta Banida!');
      setUser({ ...user, is_disabled: !isBanned });
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p style={{ padding: '40px' }}>Carregando perfil do cliente...</p>;
  if (!user) return <p style={{ padding: '40px', color: 'var(--color-danger)' }}>Cliente não encontrado.</p>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => navigate('/admin/users')} className="btn btn-ghost" style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
            {user.full_name || 'Usuário Sem Nome'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            ID: {user.id} {user.is_disabled && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>Banido</span>}
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Painel de Identidade */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            Identidade e Acesso
          </h3>
          
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>E-mail de Login</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} size={16} />
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                disabled={actionLoading || newEmail === user.email}
                onClick={handleUpdateEmail}
              >
                <Save size={16} /> Salvar
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Forçar Nova Senha</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Key style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} size={16} />
                <input 
                  type="text" 
                  placeholder="Digite uma nova senha segura"
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  className="input"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
              <button 
                className="btn btn-secondary" 
                disabled={actionLoading || !newPassword}
                onClick={handleUpdatePassword}
              >
                <ShieldAlert size={16} /> Aplicar Senha
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>O cliente perderá o acesso com a senha antiga imediatamente.</p>
          </div>
        </div>

        {/* Painel de Assinatura e Gestão */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            Gestão Comercial
          </h3>
          
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nível de Assinatura (Plano)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <CreditCard style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} size={16} />
                <select 
                  className="input" 
                  style={{ 
                    width: '100%', 
                    paddingLeft: '36px', 
                    appearance: 'none', 
                    cursor: 'pointer',
                    background: 'var(--color-surface)',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                  value={newPlan}
                  onChange={e => setNewPlan(e.target.value)}
                >
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
              <button 
                className="btn btn-primary" 
                disabled={actionLoading || newPlan === user.subscription_tier}
                onClick={handleUpdatePlan}
              >
                <Save size={16} /> Alterar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
             <button 
                className={user.is_disabled ? "btn btn-primary" : "btn btn-danger"} 
                disabled={actionLoading}
                onClick={handleToggleBan}
                style={{
                  backgroundColor: user.is_disabled ? 'var(--color-success)' : 'var(--color-danger)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {user.is_disabled ? <CheckCircle size={16} /> : <Ban size={16} />} 
                {user.is_disabled ? 'Reativar Conta' : 'Banir Conta'}
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}
