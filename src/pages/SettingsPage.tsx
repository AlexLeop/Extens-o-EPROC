import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { User, Moon, Sun, Save, AlertCircle, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAdminAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [trialDays, setTrialDays] = useState<number>(15);
  const [savingTrial, setSavingTrial] = useState(false);
  const [planLimits, setPlanLimits] = useState<Record<string, number | null>>({
    'trial': 30,
    '5_processos': 5,
    '10_processos': 10,
    '20_processos': 20,
    'ilimitado': null
  });
  const [savingLimits, setSavingLimits] = useState(false);

  useEffect(() => {
    // Carregar tema atual
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(currentTheme);

    async function fetchData() {
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setFullName(data.full_name || '');
        }
      }
      
      // Carregar configurações gerais
      const { data: settingsData } = await supabase.from('settings').select('*').in('id', ['trial_days', 'plan_limits']);
      if (settingsData) {
        settingsData.forEach(s => {
          if (s.id === 'trial_days' && s.value) setTrialDays(parseInt(s.value, 10));
          if (s.id === 'plan_limits' && s.value) {
            try {
               setPlanLimits(JSON.parse(s.value));
            } catch(e) {}
          }
        });
      }

      setLoading(false);
    }
    fetchData();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('admin_theme', newTheme);
  };

  const handleUpdateTrial = async () => {
    setSavingTrial(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'trial_days', value: trialDays.toString() });
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Tempo de trial atualizado com sucesso!' });
    } catch (err: any) {
      if (err.code === 'PGRST205') {
        setFeedback({ type: 'error', message: 'Tabela settings não encontrada. Execute a migration.' });
      } else {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setSavingTrial(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleUpdateLimits = async () => {
    setSavingLimits(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'plan_limits', value: JSON.stringify(planLimits) });
      if (error) throw error;
      setFeedback({ type: 'success', message: 'Limites de planos atualizados com sucesso!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingLimits(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile || fullName === profile.full_name) return;
    
    setSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
      if (error) throw error;
      setProfile({ ...profile, full_name: fullName });
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) return <p style={{ padding: '40px' }}>Carregando configurações...</p>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Configurações</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Preferências do painel e configurações do sistema</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Configurações do Sistema */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Save size={20} /> 
             Configurações Comerciais
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ flex: 1, paddingRight: '20px' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Período de Teste (Trial)</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Defina a quantidade de dias do período de teste gratuito para novos usuários que se cadastrarem.
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <input 
                  type="number" 
                  value={trialDays} 
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 1)}
                  style={{ width: '80px', textAlign: 'center' }}
                  min="1"
                  max="90"
                />
              </div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>dias</span>
              <button 
                onClick={handleUpdateTrial}
                className="btn btn-primary"
                disabled={savingTrial}
              >
                {savingTrial ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          {/* Limite do Trial */}
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Limite de Extração (Trial)</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Defina a quantidade máxima de processos que um usuário pode extrair enquanto estiver no período de teste gratuito.
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ilimitado"
                    className="input-field"
                    style={{ width: '100px', textAlign: 'center' }}
                    value={planLimits['trial'] === null ? '' : planLimits['trial'] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlanLimits(prev => ({
                        ...prev,
                        trial: val === '' ? null : parseInt(val)
                      }));
                    }}
                  />
                </div>
                <button 
                  onClick={handleUpdateLimits}
                  className="btn btn-primary"
                  disabled={savingLimits}
                >
                  {savingLimits ? 'Salvando...' : 'Salvar Limite'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Aparência */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />} 
             Aparência e Tema
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Modo Noturno (Dark Mode)</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Ative o tema escuro para proteger os olhos durante a noite e ter um visual premium.
              </div>
            </div>
            
            <button 
              onClick={toggleTheme}
              className="btn" 
              style={{ 
                background: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: theme === 'dark' ? '#fff' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                width: '120px',
                justifyContent: 'center'
              }}
            >
              {theme === 'dark' ? 'Ativado' : 'Desativado'}
            </button>
          </div>
        </div>

        {/* Perfil */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <User size={20} /> 
             Meu Perfil Administrativo
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>E-mail de Acesso</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="input" 
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'var(--color-bg)' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Seu e-mail de administrador não pode ser alterado por aqui.</p>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nome Completo</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="input" 
                placeholder="Seu nome"
              />
            </div>
            
            <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {feedback && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '13px', fontWeight: 600 }}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {feedback.message}
                  </div>
                )}
              </div>
              <button 
                onClick={handleUpdateProfile} 
                disabled={saving || fullName === profile?.full_name} 
                className="btn btn-primary"
              >
                <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
