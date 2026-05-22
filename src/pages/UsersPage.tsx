import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Ban, CheckCircle, Clock, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;

  async function fetchUsers(currentPage = 0, reset = false, search = '') {
    if (reset) {
      setLoading(true);
    }
    
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    
    if (search.trim() !== '') {
      // Supabase text search on email or full_name
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (reset) {
      setUsers(data || []);
    } else {
      setUsers(prev => [...prev, ...(data || [])]);
    }

    setHasMore(count !== null && (from + (data?.length || 0)) < count);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers(0, true, searchTerm);
  }, [searchTerm]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, false, searchTerm);
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_disabled: !currentStatus }).eq('id', id);
    // Atualiza otimisticamente a UI
    setUsers(users.map(u => u.id === id ? { ...u, is_disabled: !currentStatus } : u));
  };

  if (loading && page === 0) return <p style={{ padding: '40px' }}>Carregando clientes...</p>;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>Gestão de Clientes</h1>
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
            {users.map(user => (
              <tr 
                key={user.id} 
                onClick={(e) => {
                  // Previne navegação se clicar em um botão dentro da linha
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/admin/users/${user.id}`);
                }}
                style={{ cursor: 'pointer' }}
                className="table-row-hover"
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                      {(user.full_name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.full_name || 'Usuário sem Nome'}</div>
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

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button onClick={loadMore} disabled={loading} className="btn btn-secondary">
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </button>
        </div>
      )}
    </div>
  );
}
