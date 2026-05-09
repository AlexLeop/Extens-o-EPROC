import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CreditCard, RefreshCw, Check } from 'lucide-react';

export function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchPlans() {
    setLoading(true);
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
    setPlans(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchPlans(); }, []);

  const handleUpdatePlan = async (id: string, updates: any) => {
    setSaving(id);
    if (typeof updates.features === 'string') {
      updates.features = updates.features.split('\n').filter((f: string) => f.trim() !== '');
    }
    await supabase.from('plans').update(updates).eq('id', id);
    setTimeout(() => setSaving(null), 1000);
  };

  if (loading) return <p style={{ padding: '40px' }}>Carregando planos...</p>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Produtos & Planos</h1>
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
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px' }}>
                <CreditCard color="var(--color-primary)" size={24} />
              </div>
              {saving === plan.id ? (
                <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>Salvando...</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                  <Check size={14} /> Ativo
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nome Comercial</label>
                <input 
                  type="text" 
                  defaultValue={plan.name} 
                  onBlur={(e) => handleUpdatePlan(plan.id, { name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Valor Mensal (R$)</label>
                <input 
                  type="number" 
                  defaultValue={plan.price} 
                  onBlur={(e) => handleUpdatePlan(plan.id, { price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Recursos (Um por linha)</label>
                <textarea 
                  rows={5}
                  defaultValue={Array.isArray(plan.features) ? plan.features.join('\n') : ''}
                  onBlur={(e) => handleUpdatePlan(plan.id, { features: e.target.value })}
                  placeholder="Ex: Suporte VIP&#10;Consultas Ilimitadas"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
