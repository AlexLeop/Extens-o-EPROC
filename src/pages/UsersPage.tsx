import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Ban, CheckCircle, Clock, Smartphone } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_disabled: !currentStatus }).eq('id', id);
    fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p style={{ padding: '40px' }}>Carregando clientes...</p>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Gestão de Clientes</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Base de dados unificada da EPROC Perito</p>
      </header>

      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} size={18} />
        <input 
          type="text" 
          placeholder="Filtrar por nome ou e-mail..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '48px', height: '54px', background: 'var(--color-surface)' }}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Assinatura</th>
              <th>Atividade</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                      {(user.full_name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{user.full_name || 'Usuário sem Nome'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{user.subscription_tier || 'Trial'}</span>
                    <span className={`badge ${user.subscription_status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ width: 'fit-content' }}>
                      {user.subscription_status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} /> {user.last_active_at ? new Date(user.last_active_at).toLocaleDateString() : 'Sem registro'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={12} /> v{user.extension_version || 'N/A'}</div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => toggleUserStatus(user.id, user.is_disabled)}
                    className="btn btn-ghost"
                    style={{ color: user.is_disabled ? 'var(--color-success)' : 'var(--color-danger)' }}
                  >
                    {user.is_disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                    <span style={{ marginLeft: '8px' }}>{user.is_disabled ? 'Ativar' : 'Suspender'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
