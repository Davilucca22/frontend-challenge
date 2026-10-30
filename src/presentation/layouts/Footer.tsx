import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { httpClient } from '../../infrastructure/http/axios-client'
import { Feedback } from '../components/Feedback'

type MockScenario = 'standard' | 'payment-declined' | 'timeout-after-order' | 'session-expired' | 'slow' | 'failure'

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
    <footer className={`site-footer page-shell ${pathname === '/login' || pathname === '/register' ? 'auth-footer' : ''} ${transactionalPage ? 'transaction-footer' : ''}`}>
      <section className="footer-benefits"><article><span>◆</span><h3>Segurança de carteira</h3><p>Suas compras são simuladas e protegidas.</p></article><article><span>◉</span><h3>Criadores em destaque</h3><p>Descubra artistas e coleções independentes.</p></article><article><span>✦</span><h3>Arte digital</h3><p>Encontre peças únicas para sua coleção.</p></article></section>
      <section className="footer-links"><div><b>Minha conta</b><Link to="/profile">Meu perfil</Link><Link to="/wallets">Carteiras</Link><Link to="/cart">Carrinho</Link></div><div><b>Mercado</b><Link to="/">Coleções</Link><Link to="/">Lançamentos</Link><Link to="/">NFTs em alta</Link></div><div><b>Kurio</b><a href="#about">Sobre a Kurio</a><a href="#creators">Criadores</a><a href="#about">Como funciona</a></div>
        <div className="demo-controls"><b>Ambiente de demonstração</b><label>Simular cenário<select value={scenario} onChange={(event) => void updateScenario(event.target.value as MockScenario)}><option value="standard">Padrão</option><option value="payment-declined">Pagamento recusado</option><option value="timeout-after-order">Timeout após criar pedido</option><option value="session-expired">Sessão expirada</option><option value="slow">Rede lenta</option><option value="failure">Falha de serviço</option></select></label><button className="text-button" onClick={() => void reset()}>Restaurar dados de demonstração</button>{notice && <Feedback tone="success">{notice}</Feedback>}{error && <Feedback>{error}</Feedback>}</div>
      </section><div className="footer-bottom"><span>© 2026 Kurio NFT Marketplace</span><span>Projeto de demonstração · sem transações reais</span></div>
    </footer>
  )
}
