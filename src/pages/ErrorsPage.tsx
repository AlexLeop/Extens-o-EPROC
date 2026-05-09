import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Clock, Terminal } from 'lucide-react';

export function ErrorsPage() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchErrors() {
      const { data } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setErrors(data || []);
      setLoading(false);
    }
    fetchErrors();
  }, []);

  if (loading) return <p>Carregando logs...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs de Erros</h1>
          <p className="page-subtitle">Monitore falhas técnicas reportadas pela extensão</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {errors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Terminal size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Nenhum erro registrado nas últimas 24 horas.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Erro</th>
                  <th>Contexto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {errors.map(err => (
                  <tr key={err.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="var(--color-text-muted)" />
                        {new Date(err.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#ef4444', fontWeight: 600 }}>
                        {err.error_message}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#000', padding: '4px 8px', borderRadius: '4px' }}>
                        {JSON.stringify(err.context)}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-error">Crítico</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
