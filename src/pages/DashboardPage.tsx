import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockHistoricalData = [
  { name: 'Jan', mrr: 1200, users: 15 },
  { name: 'Fev', mrr: 2100, users: 28 },
  { name: 'Mar', mrr: 3800, users: 45 },
  { name: 'Abr', mrr: 4500, users: 55 },
  { name: 'Mai', mrr: 6200, users: 78 },
  { name: 'Jun', mrr: 8900, users: 110 },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data, error } = await supabase
          .from('admin_financial_metrics')
          .select('*')
          .single();
        
        if (error) throw error;
        setMetrics(data);
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

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Receita Mensal (MRR)</div>
          <div className="stat-value">R$ {metrics?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '8px', fontWeight: 600 }}>Previsão Anual: R$ {metrics?.arr?.toLocaleString('pt-BR')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Usuários Ativos (24h)</div>
          <div className="stat-value">{metrics?.active_last_24h || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Engajamento real</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total de Clientes</div>
          <div className="stat-value">{metrics?.total_users || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Base acumulada</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Taxa de Conversão</div>
          <div className="stat-value">
            {metrics?.total_users > 0 ? ((metrics.active_subscribers / metrics.total_users) * 100).toFixed(1) : 0}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '8px', fontWeight: 600 }}>Trial para Pago</div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="card" style={{ marginTop: '24px', padding: '24px', height: '400px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text-primary)' }}>Evolução de Receita (MRR)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockHistoricalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
              stroke="var(--color-text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
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
            Distribuição de Assinaturas
          </div>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Usuários</th>
                <th>Receita</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-success">Ativos</span></td>
                <td>{metrics?.active_subscribers || 0}</td>
                <td style={{ fontWeight: 600 }}>R$ {metrics?.mrr?.toLocaleString('pt-BR')}</td>
              </tr>
              <tr>
                <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)' }}>Em Trial</span></td>
                <td>{metrics?.trial_users || 0}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><span className="badge badge-danger">Inativos / Churn</span></td>
                <td>{metrics?.registered_not_using || 0}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(29, 53, 87, 0.05)', borderColor: 'rgba(29, 53, 87, 0.2)' }}>
          <div className="card-title" style={{ marginBottom: 0, color: 'var(--color-primary)' }}>Ticket Médio (ARPU)</div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            R$ {metrics?.arpu?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Valor médio gerado por cada usuário ativo na plataforma mensalmente.
          </p>
          <div style={{ marginTop: 'auto', padding: '20px', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Saúde da Conversão</div>
            <div style={{ width: '100%', height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(metrics?.active_subscribers / (metrics?.total_users || 1)) * 100}%`, height: '100%', background: 'var(--color-primary)' }}></div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '8px', textAlign: 'right', fontWeight: 600 }}>
               {((metrics?.active_subscribers / (metrics?.total_users || 1)) * 100).toFixed(0)}% da base
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
