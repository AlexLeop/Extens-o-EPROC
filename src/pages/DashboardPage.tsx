import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbandonedModal, setShowAbandonedModal] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data } = await supabase
          .from('admin_financial_metrics')
          .select('*')
          .single();
        
        let mrr = data?.mrr || 0;
        let arr = data?.arr || 0;
        let totalUsers = data?.total_users || 0;

        // Calcular Histórico de MRR Dinâmico e Métricas de Uso
        const { data: profiles } = await supabase.from('profiles').select('created_at, subscription_tier, is_disabled, subscription_status, last_active_at, asaas_customer_id, email');
        const { data: plans } = await supabase.from('plans').select('id, price');
        
        let trialUsers = 0;
        let activeUsers = 0;
        let overdueUsers = 0;
        let newUsersThisMonth = 0;
        
        // Abandonos
        let abandonedCarts = 0;
        let abandonedCartsList: any[] = [];
        
        // Frequência de acessos
        let activeDaily = 0;
        let activeWeekly = 0;
        let activeMonthly = 0;

        if (profiles && plans) {
          const pricesMap: Record<string, number> = {};
          plans.forEach(p => pricesMap[p.id] = p.price);

          const history = [];
          const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          profiles.forEach(p => {
            const created = new Date(p.created_at);
            if (created >= startOfMonth) newUsersThisMonth++;

            if (p.subscription_status === 'trial') trialUsers++;
            else if (p.subscription_status === 'active') activeUsers++;
            else if (p.subscription_status === 'overdue') overdueUsers++;

            // Abandoned carts: Has customer id but no active subscription (conta clientes únicos, não tentativas)
            if (p.asaas_customer_id && p.subscription_status !== 'active') {
              abandonedCarts++;
              abandonedCartsList.push({
                email: p.email || 'Email desconhecido',
                created_at: p.created_at,
                status: p.subscription_status
              });
            }

            // Acessos
            if (p.last_active_at) {
              const lastActive = new Date(p.last_active_at);
              if (lastActive >= oneDayAgo) activeDaily++;
              if (lastActive >= sevenDaysAgo) activeWeekly++;
              if (lastActive >= thirtyDaysAgo) activeMonthly++;
            }
          });

          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(28); 
            
            let monthMRR = 0;
            let monthUsers = 0;

            profiles.forEach(p => {
              const created = new Date(p.created_at);
              if (created <= date && !p.is_disabled && p.subscription_tier !== 'trial') {
                monthMRR += pricesMap[p.subscription_tier] || 0;
                monthUsers++;
              }
            });

            history.push({
              name: monthsNames[date.getMonth()],
              mrr: monthMRR,
              users: monthUsers
            });
          }
          setHistoricalData(history);
        }

        // Buscar Pagamentos do Asaas
        let asaasPending = 0;
        let asaasReceived = 0;
        try {
          const asaasKey = import.meta.env.VITE_API_ASAAS;
          if (asaasKey) {
            const res = await fetch('https://sandbox.asaas.com/api/v3/payments?status=PENDING,RECEIVED,CONFIRMED', {
              headers: {
                'access_token': asaasKey
              }
            });
            if (res.ok) {
              const asaasData = await res.json();
              const payments = asaasData.data || [];
              payments.forEach((payment: any) => {
                if (payment.status === 'PENDING') {
                  asaasPending++;
                } else if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
                  asaasReceived++;
                }
              });
            }
          }
        } catch (asaasErr) {
          console.error('Erro ao buscar Asaas:', asaasErr);
        }
        
        setMetrics({
          mrr,
          arr,
          total_users: totalUsers,
          active_last_24h: activeDaily, // Substitui a view para ter precisão em tempo real
          active_weekly: activeWeekly,
          active_monthly: activeMonthly,
          active_subscribers: activeUsers,
          trial_users: trialUsers,
          overdue_users: overdueUsers,
          new_this_month: newUsersThisMonth,
          abandoned_carts: abandonedCarts,
          abandoned_carts_list: abandonedCartsList,
          asaas_pending: asaasPending,
          asaas_received: asaasReceived
        });

        } catch (err) {
        console.error('Erro ao buscar métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) return <p>Carregando métricas...</p>;

  return (
    <div>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Visão Geral</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Métricas de performance e engajamento da EPROC Perito</p>
      </header>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Recorrência Mensal (MRR)</div>
          <div className="stat-value">R$ {metrics?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '8px', fontWeight: 600 }}>Recorrência Anual (ARR): R$ {metrics?.arr?.toLocaleString('pt-BR')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Frequência de Acesso (Ativos)</div>
          <div className="stat-value">{metrics?.active_last_24h || 0} <span style={{fontSize: '14px', fontWeight: 400}}>/dia</span></div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', display: 'flex', gap: '8px' }}>
            <span>Semanal: <strong>{metrics?.active_weekly || 0}</strong></span>
            <span>Mensal: <strong>{metrics?.active_monthly || 0}</strong></span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total de Clientes</div>
          <div className="stat-value">{metrics?.total_users || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Base acumulada</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Abandono de Checkout</div>
          <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{metrics?.abandoned_carts || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Iniciaram e não finalizaram</span>
            <button 
              onClick={() => setShowAbandonedModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              Ver Lista
            </button>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pagamentos Asaas</div>
          <div className="stat-value" style={{ fontSize: '24px' }}>
            <span style={{ color: 'var(--color-success)' }}>{metrics?.asaas_received || 0}</span> 
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 4px' }}>ok /</span> 
            <span style={{ color: 'var(--color-warning)' }}>{metrics?.asaas_pending || 0}</span> 
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 4px' }}>pend</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Status das cobranças ativas</div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="card" style={{ marginTop: '24px', padding: '24px', height: '400px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text-primary)' }}>Evolução de Receita (MRR Real)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historicalData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickMargin={12} padding={{ left: 20, right: 20 }} />
            <YAxis 
              stroke="var(--color-text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickMargin={12}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'MRR']}
            />
            <Area type="monotone" dataKey="mrr" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '12px' }}>
        <div className="table-container">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Distribuição de Assinaturas e Status
          </div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Usuários</th>
                <th>Receita/Impacto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-success">Ativos</span></td>
                <td>{metrics?.active_subscribers || 0}</td>
                <td style={{ fontWeight: 600 }}>R$ {metrics?.mrr?.toLocaleString('pt-BR')}</td>
              </tr>
              <tr>
                <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>Em Trial (Gratuito)</span></td>
                <td>{metrics?.trial_users || 0}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><span className="badge badge-danger">Inadimplentes / Atrasados</span></td>
                <td>{metrics?.overdue_users || 0}</td>
                <td style={{ color: 'var(--color-danger)' }}>Risco de Churn</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(29, 53, 87, 0.05)', borderColor: 'rgba(29, 53, 87, 0.2)' }}>
            <div className="card-title" style={{ marginBottom: 0, color: 'var(--color-primary)' }}>Ticket Médio (ARPU)</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              R$ {metrics?.active_subscribers > 0 ? (metrics.mrr / metrics.active_subscribers).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Com base nos assinantes ativos no mês.</div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(42, 157, 143, 0.05)', borderColor: 'rgba(42, 157, 143, 0.2)' }}>
            <div className="card-title" style={{ marginBottom: 0, color: 'var(--color-success)' }}>Aquisição Mensal</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              +{metrics?.new_this_month || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Novas contas criadas neste mês.</div>
          </div>
        </div>
      </div>

      {showAbandonedModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Clientes que Abandonaram o Checkout</h3>
              <button onClick={() => setShowAbandonedModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-muted)' }}>&times;</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>Estes usuários iniciaram o processo de compra (possuem ID Asaas) mas não possuem uma assinatura ativa atualmente.</p>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '8px' }}>Email</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.abandoned_carts_list?.length > 0 ? (
                    metrics.abandoned_carts_list.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{c.email}</td>
                        <td style={{ padding: '8px', fontSize: '14px' }}>{c.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum abandono registrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
