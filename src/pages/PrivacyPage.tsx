import { Shield, ArrowLeft } from 'lucide-react';

export function PrivacyPage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', color: 'var(--color-text-primary)' }}>
      {onBack && (
        <button onClick={onBack} className="btn btn-ghost" style={{ marginBottom: '24px', paddingLeft: 0, color: 'var(--color-primary)' }}>
          <ArrowLeft size={18} /> Voltar para o Login
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--color-primary)', padding: '12px', borderRadius: '12px' }}>
          <Shield color="white" size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Política de Privacidade</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>EPROC Perito — Transparência e Segurança</p>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--color-surface)', lineHeight: '1.8', padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>Última atualização: 09 de Maio de 2026</p>
            <p>A <strong>EPROC Perito</strong> está comprometida com a transparência e a segurança dos dados de seus usuários. Esta Política descreve como coletamos, usamos e protegemos suas informações em conformidade com a LGPD e as políticas da Chrome Web Store.</p>
          </section>

          <section>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>1. Finalidade do Tratamento</h3>
            <p>O tratamento de dados realizado tem como base legal a Execução de Contrato, visando exclusivamente centralizar a gestão de prazos processuais e organizar o fluxo financeiro do perito judicial.</p>
          </section>

          <section>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>2. Dados Coletados</h3>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail e CPF/CNPJ (via Asaas).</li>
              <li><strong>Dados Processuais:</strong> Número do processo e status (metadados). Não coletamos conteúdo de autos protegidos.</li>
              <li><strong>Dados Técnicos:</strong> Versão da extensão e logs de erro para suporte.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>3. Sigilo Judicial</h3>
            <p>Reconhecemos o sigilo pericial. Os dados são criptografados e acessíveis apenas pelo titular da conta. A administração da plataforma não acessa o conteúdo dos processos gerenciados.</p>
          </section>

          <section>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>4. Parceiros (Operadores)</h3>
            <p>Utilizamos infraestrutura de ponta: Supabase Inc. (Banco de Dados) e Asaas Gestão Financeira S.A. (Pagamentos).</p>
          </section>

          <section>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>5. Seus Direitos</h3>
            <p>Você pode acessar, retificar ou excluir seus dados a qualquer momento através do painel ou e-mail de suporte.</p>
          </section>

          <section style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <p style={{ fontWeight: 600 }}>Contato para Privacidade:</p>
            <p style={{ color: 'var(--color-primary)' }}>eproc.perito@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
