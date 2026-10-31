import { tw } from '../../shared/tw'
import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { httpClient } from '../../infrastructure/http/axios-client'
import { Feedback } from '../components/Feedback'
import type { MockScenario } from '../../infrastructure/mocks/database/scenarios'

export function Footer() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const transactionalPage = pathname === '/cart' || pathname === '/checkout'
  const [scenario, setScenario] = useState<MockScenario>('standard')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const updateScenario = async (value: MockScenario) => {
    setScenario(value)
    setError('')
    try {
      await httpClient.put('/mock/scenario', { scenario: value })
      setNotice(value === 'standard' ? 'Cenário padrão ativo.' : `Cenário "${value}" ativado.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao alterar o cenário.')
    }
  }
  const reset = async () => {
    try {
      await httpClient.post('/mock/reset')
      setScenario('standard')
      setNotice('Dados simulados restaurados. Atualize a página para recarregar a sessão.')
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha ao restaurar os dados.')
    }
  }
  return (
    <footer className={tw(`site-footer page-shell ${pathname === '/login' || pathname === '/register' ? 'auth-footer' : ''} ${transactionalPage ? 'transaction-footer' : ''}`)}>
      <section className={"[display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:12px] [padding:22px] [background:#21150f] [border-radius:6px_6px_0_0] [&_article]:[padding:7px_12px] [&_article_>_span]:[width:33px] [&_article_>_span]:[height:33px] [&_article_>_span]:[display:grid] [&_article_>_span]:[place-items:center] [&_article_>_span]:[margin-bottom:10px] [&_article_>_span]:[color:var(--bg)] [&_article_>_span]:[background:var(--accent)] [&_article_>_span]:[border-radius:50%] [&_h3]:[margin:0_0_5px] [&_h3]:[font-size:14px] [&_p]:[margin:0] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_p]:[font-weight:500] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:5px] max-[640px]:[padding:13px] max-[640px]:[&_article]:[display:grid] max-[640px]:[&_article]:[grid-template-columns:35px_1fr] max-[640px]:[&_article]:[column-gap:10px] max-[640px]:[&_article]:[align-items:center] max-[640px]:[&_article]:[padding:5px] max-[640px]:[&_article_>_span]:[grid-row:span_2] max-[640px]:[&_article_>_span]:[margin:0] max-[640px]:[&_h3]:[margin:0] footer-benefits"}><article><span>◆</span><h3 className=''>Segurança de carteira</h3><p>Suas compras são simuladas e protegidas.</p></article><article><span>◉</span><h3>Criadores em destaque</h3><p>Descubra artistas e coleções independentes.</p></article><article><span>✦</span><h3>Arte digital</h3><p>Encontre peças únicas para sua coleção.</p></article></section>
      <section className={"[display:grid] [grid-template-columns:repeat(3,_minmax(110px,_1fr))_minmax(200px,_1.5fr)] [gap:20px] [padding:24px] [background:#291a12] [&_>_div:not(.demo-controls)]:[display:flex] [&_>_div:not(.demo-controls)]:[flex-direction:column] [&_>_div:not(.demo-controls)]:[gap:6px] [&_b]:[margin-bottom:5px] [&_b]:[color:var(--text)] [&_b]:[font-size:14px] [&_a]:[color:var(--muted)] [&_a]:[font-size:15px] max-[640px]:[grid-template-columns:1fr_1fr] max-[640px]:[gap:17px] max-[640px]:[padding:15px] footer-links"}><div><b>Minha conta</b><Link to="/profile">Meu perfil</Link><Link to="/wallets">Carteiras</Link><Link to="/cart">Carrinho</Link></div><div><b>Mercado</b><Link to="/">Coleções</Link><Link to="/">Lançamentos</Link><Link to="/">NFTs em alta</Link></div><div><b>Kurio</b><a href="#about">Sobre a Kurio</a><a href="#creators">Criadores</a><a href="#about">Como funciona</a></div>
        <div className={"[display:grid] [align-content:start] [gap:7px] [&_label]:[display:grid] [&_label]:[gap:4px] [&_label]:[color:var(--muted)] [&_label]:[font-size:14px] [&_select]:[min-height:31px] [&_.feedback]:[margin:0] [&_.feedback]:[padding:6px] [&_.feedback]:[font-size:14px] max-[640px]:[grid-column:1_/_-1] demo-controls"}><b>Ambiente de demonstração</b><label>Simular cenário<select value={scenario} onChange={(event) => void updateScenario(event.target.value as MockScenario)}><option value="standard">Padrão</option><option value="empty">Catálogo vazio</option><option value="out-of-order">Respostas fora de ordem</option><option value="slow">Rede lenta</option><option value="failure">Falha de serviço</option><option value="session-expired">Sessão expirada</option><option value="payment-pending">Pagamento pendente</option><option value="payment-declined">Pagamento recusado</option><option value="timeout-after-order">Timeout após criar pedido</option></select></label><button className={"[padding:4px] [background:transparent] [border:0] [color:var(--accent-light)] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:6px] [font-size:14px] [&:hover]:[color:#ffd39e] [&:hover]:[text-decoration:underline] text-button"} onClick={() => void reset()}>Restaurar dados de demonstração</button>{notice && <Feedback tone="success">{notice}</Feedback>}{error && <Feedback>{error}</Feedback>}</div>
      </section><div className={"[display:flex] [justify-content:space-between] [gap:15px] [padding:14px_6px] [color:var(--muted)] [border-top:1px_solid_#422a1b] [font-size:14px] max-[640px]:[flex-direction:column] max-[640px]:[gap:3px] max-[640px]:[font-size:14px] footer-bottom"}><span>© 2026 Kurio NFT Marketplace</span><span>Projeto de demonstração · sem transações reais</span></div>
    </footer>
  )
}
