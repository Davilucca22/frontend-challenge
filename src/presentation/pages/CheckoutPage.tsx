import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { LockKeyhole, WalletCards } from 'lucide-react'
import type { CartLine, Quote } from '../../domain/entities/Cart'
import type { Wallet } from '../../domain/entities/User'
import { CreateOrder } from '../../application/use-cases/orders/CreateOrder'
import { HttpOrderRepository } from '../../infrastructure/repositories/HttpOrderRepository'
import { httpClient } from '../../infrastructure/http/axios-client'
import { useAuth } from '../providers/AuthProvider'
import { RequireAuth } from '../components/RequireAuth'
import { Feedback } from '../components/Feedback'
import { errorMessage, formatEth } from '../../shared/utils/format'

const orderRepository = new HttpOrderRepository()
const createOrder = new CreateOrder(orderRepository)
const quoteSignature = (quote: Quote) => [quote.subtotalEth, quote.discountEth, quote.networkFeeEth, quote.totalEth, quote.version].join('|')

function CheckoutContent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [connected, setConnected] = useState(true)
  const [acceptedQuote, setAcceptedQuote] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [customer, setCustomer] = useState({ name: user?.name ?? '', email: user?.email ?? '', ensName: user?.ensName ?? '' })
  const keyRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: async () => (await httpClient.get<{ items: CartLine[] }>('/cart')).data })
  const walletsQuery = useQuery({ queryKey: ['wallets', user?.id], queryFn: async () => (await httpClient.get<Wallet[]>('/wallets')).data })
  const coupon = sessionStorage.getItem('kurio.checkout.coupon') ?? ''
  const quoteQuery = useQuery({
    queryKey: ['quote', cartQuery.data?.items, coupon],
    queryFn: () => orderRepository.quote(cartQuery.data?.items ?? [], coupon || undefined),
    enabled: Boolean(cartQuery.data?.items.length),
    retry: false,
  })
  const quote = quoteQuery.data
  const wallets = walletsQuery.data ?? []
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets.find((wallet) => wallet.primary) ?? wallets[0]
  const activeProvider = selectedProvider || selectedWallet?.type || 'MetaMask'
  const currentSignature = quote ? quoteSignature(quote) : ''
  const selectedWalletKey = useMemo(() => selectedWallet?.id ?? '', [selectedWallet?.id])
  const submit = async () => {
    setError('')
    setFeedback('')
    if (!selectedWallet) {
      setError('Cadastre ou selecione uma carteira antes de continuar.')
      return
    }
    if (!customer.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      setError('Informe nome e e-mail válidos para o colecionador.')
      return
    }
    if (!connected) {
      setError('Conecte a carteira simulada antes de confirmar.')
      return
    }
    if (!quote || !cartQuery.data?.items.length) {
      setError('Não há itens disponíveis para finalizar.')
      return
    }
    if (acceptedQuote !== currentSignature) {
      setAcceptedQuote(currentSignature)
      setFeedback('Confira os valores atualizados e confirme novamente.')
      return
    }
    setProcessing(true)
    try {
      const freshQuote = await orderRepository.quote(cartQuery.data.items, coupon || undefined)
      if (quoteSignature(freshQuote) !== acceptedQuote) {
        queryClient.setQueryData(['quote', cartQuery.data.items, coupon], freshQuote)
        setAcceptedQuote(quoteSignature(freshQuote))
        setFeedback('O preço, disponibilidade ou taxas mudaram. Confira os novos valores e confirme novamente.')
        return
      }
      const cartFingerprint = JSON.stringify({ items: cartQuery.data.items, wallet: selectedWallet.id, coupon, customer })
      if (!keyRef.current || keyRef.current.fingerprint !== cartFingerprint) {
        const saved = sessionStorage.getItem('kurio.order.attempt')
        const parsed = saved ? JSON.parse(saved) as { fingerprint: string; key: string } : null
        keyRef.current = parsed?.fingerprint === cartFingerprint ? parsed : { fingerprint: cartFingerprint, key: crypto.randomUUID() }
        sessionStorage.setItem('kurio.order.attempt', JSON.stringify(keyRef.current))
      }
      const order = await createOrder.execute(cartQuery.data.items, selectedWallet, customer, freshQuote, coupon || undefined, keyRef.current.key)
      sessionStorage.removeItem('kurio.checkout.coupon')
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (reason) {
      setError(errorMessage(reason, 'Não foi possível criar o pedido. Seus itens continuam no carrinho.'))
    } finally {
      setProcessing(false)
    }
  }
  if (cartQuery.isPending || walletsQuery.isPending || quoteQuery.isPending) return <main className="page-shell"><p className="muted">Carregando pagamento...</p></main>
  if (!cartQuery.data?.items.length) return <main className="page-shell empty-state"><h1>Seu carrinho está vazio</h1><Link className="button" to="/">Explorar NFTs</Link></main>
  return (
    <main className="page-shell checkout-page">
      <div className="page-heading"><div><span className="eyebrow">Etapa 3 de 3</span><h1>Pagamento com carteira</h1></div><Link to="/cart" className="back-link">Voltar ao carrinho</Link></div>
      {quoteQuery.isError && <Feedback>{errorMessage(quoteQuery.error, 'Não foi possível obter a cotação atual.')}</Feedback>}
      <div className="checkout-layout">
        <section className="checkout-main">
          <section className="checkout-section"><div className="checkout-section-title"><span>01</span><div><h2>Perfil do colecionador</h2><p>Confirme seus dados antes de finalizar.</p></div></div><div className="form-grid"><label>Nome completo<input value={customer.name} autoComplete="name" required onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} /></label><label>E-mail<input value={customer.email} type="email" autoComplete="email" required onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} /></label><label>Nome ENS<input value={customer.ensName} placeholder="nome.kurio.eth" onChange={(event) => setCustomer((current) => ({ ...current, ensName: event.target.value }))} /></label><label>Rede de pagamento<select value={selectedWallet?.network ?? ''} onChange={(event) => { const wallet = wallets.find((item) => item.network === event.target.value); if (wallet) setSelectedWalletId(wallet.id) }}><option value="" disabled>Selecione a rede</option>{[...new Set(wallets.map((wallet) => wallet.network))].map((network) => <option key={network}>{network}</option>)}</select></label></div></section>
          <section className="checkout-section"><div className="checkout-section-title"><span>02</span><div><h2>Carteira conectada</h2><p>As carteiras são simuladas; nenhuma transação real será enviada.</p></div><Link to="/wallets">Trocar carteira</Link></div>
            {wallets.length === 0 ? <><Feedback tone="info">Você ainda não cadastrou uma carteira.</Feedback><Link to="/wallets">Cadastrar carteira</Link></> : <div className="wallet-options">{wallets.map((wallet) => <label className={`wallet-option ${selectedWallet?.id === wallet.id || selectedWalletId === wallet.id ? 'selected' : ''}`} key={wallet.id}><input type="radio" name="wallet" value={wallet.id} checked={selectedWalletId ? selectedWalletId === wallet.id : selectedWallet?.id === wallet.id} onChange={() => { setSelectedWalletId(wallet.id); setSelectedProvider(wallet.type); setConnected(false) }} /><WalletCards size={18} /><span><b>{wallet.alias || wallet.name}</b><small>{wallet.address}</small><small>Rede {wallet.network}</small></span>{wallet.primary && <em>Principal</em>}</label>)}</div>}
            <div className="checkout-providers"><h3>Carteira e rede</h3>{['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map((provider) => <button className={`checkout-provider ${activeProvider === provider ? 'selected' : ''}`} type="button" key={provider} onClick={() => { setSelectedProvider(provider); setConnected(true); setError('') }}><span className="provider-mark">{provider.slice(0, 1)}</span><span>{provider}</span><span className="provider-radio" aria-hidden="true" /></button>)}</div>
            <label className="terms-check"><input type="checkbox" checked={connected} onChange={(event) => { setConnected(event.target.checked); if (event.target.checked) setError('') }} /> Simular conexão da carteira e confirmar que revisei os dados</label>
            {connected && <button className="text-button" type="button" onClick={() => { setConnected(false); setFeedback('Conexão simulada encerrada.') }}>Desconectar carteira</button>}
          </section>
          <section className="checkout-section"><div className="checkout-section-title"><span>03</span><div><h2>Revisão e confirmação</h2><p>Preço e disponibilidade serão validados novamente.</p></div></div><div className="secure-note"><LockKeyhole size={17} /> Compra simulada e protegida. Seus dados não são enviados a uma blockchain.</div></section>
          {feedback && <Feedback tone="info">{feedback}</Feedback>}{error && <Feedback>{error}</Feedback>}
        </section>
        <aside className="summary-card checkout-summary"><h2>Resumo do pedido</h2>
          {cartQuery.data.items.map((line) => <div className="checkout-item" key={line.nftId}><span>{line.quantity}× NFT</span><b>{line.nftId.replaceAll('-', ' ')}</b></div>)}
          {quote && <><div className="summary-line"><span>Subtotal</span><b>{formatEth(quote.subtotalEth)}</b></div><div className="summary-line"><span>Desconto</span><b>− {formatEth(quote.discountEth)}</b></div><div className="summary-line"><span>Taxa de rede</span><b>{formatEth(quote.networkFeeEth)}</b></div><div className="summary-line total-line"><span>Total</span><b>{formatEth(quote.totalEth)}</b></div></>}
          <button className="button checkout-link" onClick={() => void submit()} disabled={processing || wallets.length === 0 || !quote}>{processing ? 'Validando...' : acceptedQuote === currentSignature ? 'Confirmar compra' : 'Revisar valores'}</button>
          <small className="fine-print">Carteira: {selectedWalletKey ? selectedWallet?.alias : 'não selecionada'}</small>
        </aside>
      </div>
    </main>
  )
}

export function CheckoutPage() {
  return <RequireAuth><CheckoutContent /></RequireAuth>
}
