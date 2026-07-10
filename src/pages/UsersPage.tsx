import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Ban, CheckCircle, Smartphone, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (currentPage: number, search: string) => {
    setLoading(true);
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    
    if (search.trim() !== '') {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('Erro ao buscar usuários');
      console.error(error);
    } else {
      setUsers(data || []);
      if (count !== null) setTotalItems(count);
    }
    setLoading(false);
  }, [ITEMS_PER_PAGE]);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch, fetchUsers]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_disabled: !currentStatus }).eq('id', id);
    if (!error) {
      toast.success(`Usuário ${currentStatus ? 'ativado' : 'desativado'} com sucesso.`);
      setUsers(users.map(u => u.id === id ? { ...u, is_disabled: !currentStatus } : u));
    } else {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  const toggleAdminStatus = async (e: React.MouseEvent, id: string, currentAdminStatus: boolean) => {
    e.stopPropagation();
    
    if (!window.confirm(`Tem certeza que deseja ${currentAdminStatus ? 'remover' : 'conceder'} privilégios de administrador para este usuário?`)) return;

    const { error } = await supabase.from('profiles').update({ is_admin: !currentAdminStatus }).eq('id', id);
    
    if (!error) {
      toast.success('Privilégios atualizados com sucesso!');
      setUsers(users.map(u => u.id === id ? { ...u, is_admin: !currentAdminStatus } : u));
    } else {
      toast.error('Erro ao atualizar privilégios.');
      console.error(error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

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
        {loading && users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Carregando clientes...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Nenhum cliente encontrado.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano / Status</th>
                <th>Atividade</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = !u.is_disabled;
                const isTrial = u.subscription_tier === 'trial';
                
                return (
                  <tr key={u.id} onClick={() => navigate(`/admin/users/${u.id}`)} style={{ cursor: 'pointer' }} className="table-row-hover">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600 }}>
                          {u.full_name ? u.full_name[0].toUpperCase() : u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {u.full_name || 'Sem nome'}
                            {u.is_admin && <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '10px' }}>ADMIN</span>}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{isTrial ? 'Trial' : u.subscription_tier?.toUpperCase()}</span>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ width: 'fit-content' }}>
                          {isActive ? 'Ativo' : 'Desativado'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} /> {formatDate(u.last_active_at)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={12} /> {u.machine_count || 0} dispositivos</div>
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                      <button 
                        onClick={(e) => toggleAdminStatus(e, u.id, u.is_admin)}
                        className="btn btn-ghost"
                        style={{ color: 'var(--color-text-secondary)' }}
                        title={u.is_admin ? "Remover Admin" : "Promover a Admin"}
                      >
                        <span>{u.is_admin ? 'Revogar Admin' : 'Fazer Admin'}</span>
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(u.id, u.is_disabled)}
                        className="btn btn-ghost"
                        style={{ color: isActive ? 'var(--color-danger)' : 'var(--color-success)' }}
                      >
                        {isActive ? <Ban size={18} /> : <CheckCircle size={18} />}
                        <span style={{ marginLeft: '8px' }}>{isActive ? 'Suspender' : 'Ativar'}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Mostrando <b>{(page - 1) * ITEMS_PER_PAGE + 1}</b> a <b>{Math.min(page * ITEMS_PER_PAGE, totalItems)}</b> de <b>{totalItems}</b> registros
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              style={{ padding: '8px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontWeight: 600 }}>Página {page} de {totalPages}</span>
            <button 
              className="btn btn-secondary" 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              style={{ padding: '8px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
