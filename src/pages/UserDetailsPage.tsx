import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, ShieldAlert, Key, CreditCard, Save, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';

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
  const [newTrialDate, setNewTrialDate] = useState('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        setUser(data);
        setNewEmail(data.email || '');
        setNewPlan(data.subscription_tier || 'trial');
        setNewTrialDate(data.trial_ends_at ? new Date(data.trial_ends_at).toISOString().slice(0, 16) : '');
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Formato de e-mail inválido.');
      return;
    }
    
    setActionLoading(true);
    try {
      await callEdgeFunction('update_email', { targetEmail: newEmail });
      toast.success('E-mail atualizado com sucesso!');
      setUser({ ...user, email: newEmail });
      setIsEmailModalOpen(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setActionLoading(true);
    try {
      await callEdgeFunction('update_password', { targetPassword: newPassword });
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
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
      toast.success('Plano atualizado com sucesso!');
      setUser({ ...user, subscription_tier: newPlan });
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTrial = async () => {
    setActionLoading(true);
    try {
      const isoDate = newTrialDate ? new Date(newTrialDate).toISOString() : null;
      const { error } = await supabase.from('profiles').update({ trial_ends_at: isoDate }).eq('id', id);
      if (error) throw error;
      toast.success('Data de Trial atualizada com sucesso!');
      setUser({ ...user, trial_ends_at: isoDate });
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setNewTrialDate(d.toISOString().slice(0, 16));
  };
  
  const handleExpireTrial = () => {
    setNewTrialDate('');
  };

  const handleToggleBan = async () => {
    const isBanned = user.is_disabled;
    const action = isBanned ? 'unban_user' : 'ban_user';

    setActionLoading(true);
    try {
      await callEdgeFunction(action, {});
      await supabase.from('profiles').update({ is_disabled: !isBanned }).eq('id', id);
      toast.success(isBanned ? 'Conta Reativada!' : 'Conta Banida!');
      setUser({ ...user, is_disabled: !isBanned });
      setIsBanModalOpen(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    const isAdmin = user.is_admin;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: !isAdmin }).eq('id', id);
      if (error) throw error;
      toast.success(`Privilégios atualizados com sucesso!`);
      setUser({ ...user, is_admin: !isAdmin });
      setIsAdminModalOpen(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '200px', height: '30px', background: 'var(--color-border)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
      <div style={{ width: '100%', height: '300px', background: 'var(--color-surface)', borderRadius: '12px', animation: 'pulse 2s infinite' }}></div>
    </div>
  );
  
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
            ID: {user.id} 
            {user.is_admin && <span className="badge badge-success" style={{ marginLeft: '8px' }}>Admin</span>}
            {user.is_disabled && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>Banido</span>}
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
                disabled={actionLoading || newEmail === user.email || !newEmail}
                onClick={() => setIsEmailModalOpen(true)}
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
                disabled={actionLoading || newPassword.length < 6}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <ShieldAlert size={16} /> Aplicar
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>A senha deve ter pelo menos 6 caracteres.</p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
               Acesso atual: <strong style={{ color: user.is_admin ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{user.is_admin ? 'Administrador' : 'Cliente Padrão'}</strong>
             </p>
             <button 
                className="btn btn-ghost" 
                disabled={actionLoading}
                onClick={() => setIsAdminModalOpen(true)}
                style={{ color: user.is_admin ? 'var(--color-text-secondary)' : 'var(--color-primary)' }}
              >
                <ShieldAlert size={16} /> 
                {user.is_admin ? 'Revogar Admin' : 'Tornar Admin'}
              </button>
          </div>
        </div>

        {/* Painel de Assinatura e Gestão */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            Gestão Comercial
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Expiração do Trial</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input 
                type="datetime-local" 
                className="input" 
                style={{ flex: 1 }}
                value={newTrialDate}
                onChange={e => setNewTrialDate(e.target.value)}
              />
              <button 
                className="btn btn-primary" 
                disabled={actionLoading}
                onClick={handleUpdateTrial}
              >
                <Save size={16} /> Salvar
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={handleExtendTrial}>+ 15 Dias</button>
              <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--color-danger)' }} onClick={handleExpireTrial}>Expirar Agora</button>
            </div>
          </div>
          
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
                onClick={() => setIsBanModalOpen(true)}
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
                <span style={{ marginLeft: '8px' }}>{user.is_disabled ? 'Reativar Conta' : 'Banir Conta'}</span>
              </button>
          </div>
        </div>
      </div>

      {/* Modais de Confirmação */}
      <Modal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        title="Confirmar alteração de e-mail"
        footer={<><button className="btn btn-ghost" onClick={() => setIsEmailModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleUpdateEmail}>Confirmar Alteração</button></>}
      >
        <p>Tem certeza de que deseja alterar o e-mail deste usuário para <strong>{newEmail}</strong>?</p>
        <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Ele precisará usar o novo e-mail para fazer login no sistema.</p>
      </Modal>

      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        title="Forçar redefinição de senha"
        footer={<><button className="btn btn-ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</button><button className="btn btn-danger" onClick={handleUpdatePassword}>Redefinir Senha</button></>}
      >
        <p>Atenção! Você está forçando uma nova senha para o cliente.</p>
        <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>A senha antiga deixará de funcionar imediatamente.</p>
      </Modal>

      <Modal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        title={user?.is_admin ? "Revogar Privilégios" : "Conceder Privilégios"}
        footer={<><button className="btn btn-ghost" onClick={() => setIsAdminModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleToggleAdmin}>Confirmar</button></>}
      >
        <p>Tem certeza que deseja {user?.is_admin ? 'remover' : 'conceder'} acesso administrativo para este usuário?</p>
        {!user?.is_admin && <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-danger)' }}>Administradores têm acesso total a dados sensíveis de todos os clientes.</p>}
      </Modal>

      <Modal 
        isOpen={isBanModalOpen} 
        onClose={() => setIsBanModalOpen(false)} 
        title={user?.is_disabled ? "Reativar Cliente" : "Banir Cliente"}
        footer={<><button className="btn btn-ghost" onClick={() => setIsBanModalOpen(false)}>Cancelar</button><button className={user?.is_disabled ? "btn btn-primary" : "btn btn-danger"} onClick={handleToggleBan}>Confirmar Ação</button></>}
      >
        <p>Deseja {user?.is_disabled ? 'reativar' : 'banir'} este cliente do sistema?</p>
        {!user?.is_disabled && <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>Ele perderá imediatamente o acesso à extensão.</p>}
      </Modal>

    </div>
  );
}
