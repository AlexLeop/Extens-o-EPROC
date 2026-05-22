import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, RefreshCw, Check, Save, AlertCircle } from 'lucide-react';

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [feedback, setFeedback] = useState<{ id: string, type: 'success' | 'error', message: string } | null>(null);

  async function fetchPlans() {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
    setPlans(data || []);
    
    // Inicializa os rascunhos com os dados do banco
    if (data) {
      const initialDrafts: Record<string, any> = {};
      data.forEach(p => initialDrafts[p.id] = { ...p });
      setDrafts(initialDrafts);
    }
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  const handleDraftChange = (id: string, field: string, value: any) => {
    setDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleUpdatePlan = async (id: string) => {
    setSaving(id);
    setFeedback(null);
    try {
      let updates = { ...drafts[id] };
      if (typeof updates.features === 'string') {
        updates.features = updates.features.split('\n').filter((f: string) => f.trim() !== '');
      }
      const { error } = await supabase.from('plans').update(updates).eq('id', id);
      if (error) throw error;
      
      setFeedback({ id, type: 'success', message: 'Salvo com sucesso!' });
      // Atualiza o plano original com os dados do rascunho
      setPlans(plans.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (err: any) {
      console.error(err);
      setFeedback({ id, type: 'error', message: 'Erro ao salvar. Verifique a conexão.' });
    } finally {
      setSaving(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  if (loading) return <p style={{ padding: '40px' }}>Carregando planos...</p>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Produtos & Planos</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Gestão de ofertas e recursos comerciais</p>
        </div>
        <button onClick={fetchPlans} className="btn btn-ghost" style={{ gap: '8px' }}>
          <RefreshCw size={18} /> Sincronizar
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
        {plans.map(plan => (
          <div key={plan.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(29, 53, 87, 0.1)', padding: '12px', borderRadius: '12px' }}>
                <CreditCard color="var(--color-primary)" size={24} />
              </div>
              {saving === plan.id ? (
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>Processando...</span>
              ) : feedback?.id === plan.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: feedback?.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '12px', fontWeight: 600 }}>
                  {feedback?.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />} 
                  {feedback?.message}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600 }}>
                  <CreditCard size={14} /> {plan.id.slice(0, 8)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nome Comercial</label>
                <input 
                  type="text" 
                  value={drafts[plan.id]?.name || ''} 
                  onChange={(e) => handleDraftChange(plan.id, 'name', e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Valor Mensal (R$)</label>
                <input 
                  type="number" 
                  value={drafts[plan.id]?.price || 0} 
                  onChange={(e) => handleDraftChange(plan.id, 'price', parseFloat(e.target.value))}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Recursos (Um por linha)</label>
                <textarea 
                  rows={5}
                  value={Array.isArray(drafts[plan.id]?.features) ? drafts[plan.id].features.join('\n') : drafts[plan.id]?.features || ''}
                  onChange={(e) => handleDraftChange(plan.id, 'features', e.target.value)}
                  placeholder="Ex: Suporte VIP&#10;Consultas Ilimitadas"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={() => handleUpdatePlan(plan.id)} 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={saving === plan.id}
              >
                <Save size={16} /> Salvar Alterações
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
