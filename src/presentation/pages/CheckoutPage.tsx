import { tw } from '../../shared/tw'
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
// Compara os campos relevantes da cotação para detectar alterações de preço/estoque.
const quoteSignature = (quote: Quote) => [quote.subtotalEth, quote.discountEth, quote.networkFeeEth, quote.totalEth, quote.version].join('|')

// Coleta dados do comprador e confirma a compra após validar carteira e cotação.
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
  // Escolhe a carteira explicitamente selecionada, a principal ou a primeira disponível.
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
    // Busca novamente o preço antes de criar o pedido para evitar confirmar valores vencidos.
    setProcessing(true)
    try {
      const freshQuote = await orderRepository.quote(cartQuery.data.items, coupon || undefined)
      if (quoteSignature(freshQuote) !== acceptedQuote) {
        queryClient.setQueryData(['quote', cartQuery.data.items, coupon], freshQuote)
        setAcceptedQuote(quoteSignature(freshQuote))
        setFeedback('O preço, disponibilidade ou taxas mudaram. Confira os novos valores e confirme novamente.')
        return
      }
      // Reutiliza a chave em tentativas iguais para que uma repetição não duplique o pedido.
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
  if (cartQuery.isPending || walletsQuery.isPending || quoteQuery.isPending) return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] page-shell"}><p className={"[color:var(--muted)] muted"}>Carregando pagamento...</p></main>
  if (!cartQuery.data?.items.length) return <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [min-height:280px] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [padding:40px_20px] [text-align:center] [&_p]:[color:var(--muted)] page-shell empty-state"}><h1>Seu carrinho está vazio</h1><Link className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:15px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] button"} to="/">Explorar NFTs</Link></main>
  return (
    <main className={"[width:min(var(--content),_calc(100%_-_64px))] [margin-inline:auto] max-[900px]:[width:calc(100%_-_42px)] max-[640px]:[width:calc(100%_-_36px)] [min-height:56vh] [padding-top:45px] [padding-bottom:70px] max-[640px]:[&_>_.page-heading]:[position:absolute] max-[640px]:[&_>_.page-heading]:[width:1px] max-[640px]:[&_>_.page-heading]:[height:1px] max-[640px]:[&_>_.page-heading]:[padding:0] max-[640px]:[&_>_.page-heading]:[margin:-1px] max-[640px]:[&_>_.page-heading]:[overflow:hidden] max-[640px]:[&_>_.page-heading]:[clip:rect(0,_0,_0,_0)] max-[640px]:[&_>_.page-heading]:[white-space:nowrap] max-[640px]:[&_>_.page-heading]:[border:0] max-[640px]:[width:calc(100%_-_16px)] max-[640px]:[min-height:calc(100dvh_-_60px)] max-[640px]:[padding-top:0] max-[640px]:[padding-bottom:24px] max-[640px]:[padding-top:10px] max-[640px]:[padding-bottom:150px] max-[640px]:[&_.terms-check]:[display:none] page-shell checkout-page"}>
      <div className={"[display:flex] [align-items:end] [justify-content:space-between] [gap:20px] [margin-bottom:25px] [&_h1]:[margin:5px_0_0] [align-items:center] [margin-bottom:28px] [&_.back-link]:[margin:0] max-[640px]:[&_h1]:[font-size:21px] max-[640px]:[&_.back-link]:[font-size:14px] page-heading"}><div><span className={"[color:var(--accent-light)] [font-size:10px] [letter-spacing:.17em] [text-transform:uppercase] eyebrow"}>Etapa 3 de 3</span><h1>Pagamento com carteira</h1></div><Link to="/cart" className={"[display:inline-flex] [align-items:center] [gap:7px] [margin-bottom:20px] [color:var(--muted)] [font-size:15px] back-link"}>Voltar ao carrinho</Link></div>
      {quoteQuery.isError && <Feedback>{errorMessage(quoteQuery.error, 'Não foi possível obter a cotação atual.')}</Feedback>}
      <div className={"[display:grid] [grid-template-columns:minmax(0,_1.45fr)_minmax(280px,_.7fr)] [gap:30px] [align-items:start] max-[900px]:[gap:16px] max-[640px]:[display:flex] max-[640px]:[flex-direction:column] checkout-layout"}>
        <section className={"[display:grid] [gap:16px] max-[640px]:[display:flex] max-[640px]:[flex-direction:column] max-[640px]:[gap:9px] max-[640px]:[&_>_.checkout-section:first-child]:[order:2] max-[640px]:[&_>_.checkout-section:first-child]:[margin-top:220px] max-[640px]:[&_>_.checkout-section:nth-child(2)]:[order:1] max-[640px]:[&_>_.checkout-section:nth-child(3)]:[order:3] max-[640px]:[&_>_.checkout-section:nth-child(2)_.checkout-section-title_p]:[display:none] max-[640px]:[&_>_.checkout-section:nth-child(2)_>_.text-button]:[display:none] checkout-main"}>
          <section className={"[padding:22px] [border:1px_solid_#3e291b] [border-radius:6px] [background:#1f140e] max-[640px]:[padding:14px] max-[640px]:[border-radius:14px] max-[640px]:[&_+_.checkout-section]:[margin-top:0] checkout-section"}><div className={"[display:flex] [align-items:center] [gap:12px] [margin-bottom:18px] [&_>_span]:[width:31px] [&_>_span]:[height:31px] [&_>_span]:[display:grid] [&_>_span]:[place-items:center] [&_>_span]:[flex:0_0_auto] [&_>_span]:[border-radius:50%] [&_>_span]:[color:#1b1009] [&_>_span]:[background:var(--accent)] [&_>_span]:[font-size:14px] [&_>_span]:[font-weight:700] [&_h2]:[margin:0_0_3px] [&_h2]:[font-size:15px] [&_p]:[margin:0] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_>_a]:[margin-left:auto] [&_>_a]:[color:var(--accent-light)] [&_>_a]:[font-size:15px] max-[640px]:[align-items:center] max-[640px]:[gap:10px] max-[640px]:[margin-bottom:12px] max-[640px]:[&_>_span]:[display:none] max-[640px]:[&_h2]:[font-size:12px] max-[640px]:[&_p]:[font-size:14px] max-[640px]:[&_>_a]:[margin-left:auto] max-[640px]:[&_>_a]:[color:var(--accent-light)] max-[640px]:[&_>_a]:[font-size:15px] max-[640px]:[&_>_a]:[white-space:nowrap] checkout-section-title"}><span>01</span><div><h2>Perfil do colecionador</h2><p>Confirme seus dados antes de finalizar.</p></div></div><div className={"[&_label]:[display:grid] [&_label]:[gap:6px] [&_label]:[color:#dfd1c1] [&_label]:[font-size:14px] [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:14px] max-[640px]:[grid-template-columns:1fr] max-[640px]:[gap:12px] form-grid"}><label>Nome completo<input value={customer.name} autoComplete="name" required onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} /></label><label>E-mail<input value={customer.email} type="email" autoComplete="email" required onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} /></label><label>Nome ENS<input value={customer.ensName} placeholder="nome.kurio.eth" onChange={(event) => setCustomer((current) => ({ ...current, ensName: event.target.value }))} /></label><label>Rede de pagamento<select value={selectedWallet?.network ?? ''} onChange={(event) => { const wallet = wallets.find((item) => item.network === event.target.value); if (wallet) setSelectedWalletId(wallet.id) }}><option value="" disabled>Selecione a rede</option>{[...new Set(wallets.map((wallet) => wallet.network))].map((network) => <option key={network}>{network}</option>)}</select></label></div></section>
          <section className={"[padding:22px] [border:1px_solid_#3e291b] [border-radius:6px] [background:#1f140e] max-[640px]:[padding:14px] max-[640px]:[border-radius:14px] max-[640px]:[&_+_.checkout-section]:[margin-top:0] checkout-section"}><div className={"[display:flex] [align-items:center] [gap:12px] [margin-bottom:18px] [&_>_span]:[width:31px] [&_>_span]:[height:31px] [&_>_span]:[display:grid] [&_>_span]:[place-items:center] [&_>_span]:[flex:0_0_auto] [&_>_span]:[border-radius:50%] [&_>_span]:[color:#1b1009] [&_>_span]:[background:var(--accent)] [&_>_span]:[font-size:14px] [&_>_span]:[font-weight:700] [&_h2]:[margin:0_0_3px] [&_h2]:[font-size:15px] [&_p]:[margin:0] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_>_a]:[margin-left:auto] [&_>_a]:[color:var(--accent-light)] [&_>_a]:[font-size:15px] max-[640px]:[align-items:center] max-[640px]:[gap:10px] max-[640px]:[margin-bottom:12px] max-[640px]:[&_>_span]:[display:none] max-[640px]:[&_h2]:[font-size:12px] max-[640px]:[&_p]:[font-size:14px] max-[640px]:[&_>_a]:[margin-left:auto] max-[640px]:[&_>_a]:[color:var(--accent-light)] max-[640px]:[&_>_a]:[font-size:15px] max-[640px]:[&_>_a]:[white-space:nowrap] checkout-section-title"}><span>02</span><div><h2>Carteira conectada</h2><p>As carteiras são simuladas; nenhuma transação real será enviada.</p></div><Link to="/wallets">Trocar carteira</Link></div>
            {wallets.length === 0 ? <><Feedback tone="info">Você ainda não cadastrou uma carteira.</Feedback><Link to="/wallets">Cadastrar carteira</Link></> : <div className={"[display:grid] [gap:8px] max-[640px]:[display:grid] max-[640px]:[gap:9px] wallet-options"}>{wallets.map((wallet) => <label className={tw(`wallet-option ${selectedWallet?.id === wallet.id || selectedWalletId === wallet.id ? 'selected' : ''}`)} key={wallet.id}><input type="radio" name="wallet" value={wallet.id} checked={selectedWalletId ? selectedWalletId === wallet.id : selectedWallet?.id === wallet.id} onChange={() => { setSelectedWalletId(wallet.id); setSelectedProvider(wallet.type); setConnected(false) }} /><WalletCards size={18} /><span><b>{wallet.alias || wallet.name}</b><small>{wallet.address}</small><small>Rede {wallet.network}</small></span>{wallet.primary && <em>Principal</em>}</label>)}</div>}
            <div className={"[display:grid] [gap:8px] [margin-top:16px] [&_h3]:[margin:0_0_2px] [&_h3]:[font-size:12px] max-[640px]:[gap:8px] max-[640px]:[margin-top:13px] max-[640px]:[&_h3]:[margin-bottom:1px] checkout-providers"}><h3>Carteira e rede</h3>{['WalletConnect', 'MetaMask', 'Coinbase Wallet'].map((provider) => <button className={tw(`checkout-provider ${activeProvider === provider ? 'selected' : ''}`)} type="button" key={provider} onClick={() => { setSelectedProvider(provider); setConnected(true); setError('') }}><span className={"[width:30px] [height:30px] [display:grid] [place-items:center] [border-radius:50%] [color:var(--accent-light)] [background:#342217] [font-weight:700] provider-mark"}>{provider.slice(0, 1)}</span><span>{provider}</span><span className={"[width:13px] [height:13px] [border:1px_solid_var(--border)] [border-radius:50%] provider-radio"} aria-hidden="true" /></button>)}</div>
            <label className={"[&_input]:[width:15px] [&_input]:[min-height:15px] [&_input]:[accent-color:var(--accent)] [display:flex] [align-items:center] [gap:9px] [margin-top:15px] [color:var(--muted)] [font-size:14px] max-[640px]:[margin-top:10px] max-[640px]:[font-size:14px] terms-check"}><input type="checkbox" checked={connected} onChange={(event) => { setConnected(event.target.checked); if (event.target.checked) setError('') }} /> Simular conexão da carteira e confirmar que revisei os dados</label>
            {connected && <button className={"[padding:4px] [background:transparent] [border:0] [color:var(--accent-light)] [cursor:pointer] [display:inline-flex] [align-items:center] [gap:6px] [font-size:14px] [&:hover]:[color:#ffd39e] [&:hover]:[text-decoration:underline] text-button"} type="button" onClick={() => { setConnected(false); setFeedback('Conexão simulada encerrada.') }}>Desconectar carteira</button>}
          </section>
          <section className={"[padding:22px] [border:1px_solid_#3e291b] [border-radius:6px] [background:#1f140e] max-[640px]:[padding:14px] max-[640px]:[border-radius:14px] max-[640px]:[&_+_.checkout-section]:[margin-top:0] checkout-section"}><div className={"[display:flex] [align-items:center] [gap:12px] [margin-bottom:18px] [&_>_span]:[width:31px] [&_>_span]:[height:31px] [&_>_span]:[display:grid] [&_>_span]:[place-items:center] [&_>_span]:[flex:0_0_auto] [&_>_span]:[border-radius:50%] [&_>_span]:[color:#1b1009] [&_>_span]:[background:var(--accent)] [&_>_span]:[font-size:14px] [&_>_span]:[font-weight:700] [&_h2]:[margin:0_0_3px] [&_h2]:[font-size:15px] [&_p]:[margin:0] [&_p]:[color:var(--muted)] [&_p]:[font-size:14px] [&_>_a]:[margin-left:auto] [&_>_a]:[color:var(--accent-light)] [&_>_a]:[font-size:15px] max-[640px]:[align-items:center] max-[640px]:[gap:10px] max-[640px]:[margin-bottom:12px] max-[640px]:[&_>_span]:[display:none] max-[640px]:[&_h2]:[font-size:12px] max-[640px]:[&_p]:[font-size:14px] max-[640px]:[&_>_a]:[margin-left:auto] max-[640px]:[&_>_a]:[color:var(--accent-light)] max-[640px]:[&_>_a]:[font-size:15px] max-[640px]:[&_>_a]:[white-space:nowrap] checkout-section-title"}><span>03</span><div><h2>Revisão e confirmação</h2><p>Preço e disponibilidade serão validados novamente.</p></div></div><div className={"[display:flex] [align-items:center] [gap:9px] [color:var(--muted)] [font-size:14px] secure-note"}><LockKeyhole size={17} /> Compra simulada e protegida. Seus dados não são enviados a uma blockchain.</div></section>
          {feedback && <Feedback tone="info">{feedback}</Feedback>}{error && <Feedback>{error}</Feedback>}
        </section>
        <aside className={"[padding:23px] [background:var(--panel)] [border:1px_solid_#392519] [border-radius:7px] [&_h2]:[margin-bottom:20px] [&_h2]:[font-size:16px] max-[640px]:[position:fixed] max-[640px]:[z-index:18] max-[640px]:[right:30px] max-[640px]:[bottom:41px] max-[640px]:[left:30px] max-[640px]:[order:2] max-[640px]:[padding:0] max-[640px]:[border:0] max-[640px]:[background:transparent] max-[640px]:[box-shadow:none] max-[640px]:[&_>_h2]:[display:none] max-[640px]:[&_.checkout-item]:[display:none] max-[640px]:[&_.summary-line:not(.total-line)]:[display:none] max-[640px]:[&_.fine-print]:[display:none] max-[640px]:[&_.total-line]:[position:fixed] max-[640px]:[&_.total-line]:[right:30px] max-[640px]:[&_.total-line]:[bottom:218px] max-[640px]:[&_.total-line]:[left:30px] max-[640px]:[&_.total-line]:[justify-content:flex-end] max-[640px]:[&_.total-line]:[gap:15px] max-[640px]:[&_.total-line]:[margin:0] max-[640px]:[&_.total-line]:[padding:0] max-[640px]:[&_.total-line]:[border:0] max-[640px]:[&_.total-line]:[font-size:14px] max-[640px]:[&_.total-line_b]:[font-size:14px] max-[640px]:[&_.checkout-link]:[min-height:47px] max-[640px]:[&_.checkout-link]:[margin:0] max-[640px]:[&_.checkout-link]:[border-radius:25px] summary-card checkout-summary"}><h2>Resumo do pedido</h2>
          {cartQuery.data.items.map((line) => <div className={"[display:flex] [justify-content:space-between] [gap:8px] [padding:8px_0] [border-bottom:1px_solid_#3e291b] [font-size:14px] [&_span]:[color:var(--muted)] [&_span]:[white-space:nowrap] [&_b]:[overflow:hidden] [&_b]:[text-align:right] [&_b]:[text-overflow:ellipsis] [&_b]:[text-transform:capitalize] checkout-item"} key={line.nftId}><span>{line.quantity}× NFT</span><b>{line.nftId.replaceAll('-', ' ')}</b></div>)}
          {quote && <><div className={"[display:flex] [justify-content:space-between] [gap:12px] [padding:8px_0] [font-size:14px] [&_>_span]:[color:#d7c7b5] [&_small]:[display:block] [&_small]:[color:var(--muted)] [&_small]:[font-size:14px] [&_b]:[text-align:right] [&_b]:[white-space:nowrap] max-[640px]:[padding:4px_0] max-[640px]:[font-size:14px] max-[640px]:[&_small]:[display:inline] max-[640px]:[&_small]:[margin-left:4px] max-[640px]:[&_small]:[font-size:14px] summary-line"}><span>Subtotal</span><b>{formatEth(quote.subtotalEth)}</b></div><div className={"[display:flex] [justify-content:space-between] [gap:12px] [padding:8px_0] [font-size:14px] [&_>_span]:[color:#d7c7b5] [&_small]:[display:block] [&_small]:[color:var(--muted)] [&_small]:[font-size:14px] [&_b]:[text-align:right] [&_b]:[white-space:nowrap] max-[640px]:[padding:4px_0] max-[640px]:[font-size:14px] max-[640px]:[&_small]:[display:inline] max-[640px]:[&_small]:[margin-left:4px] max-[640px]:[&_small]:[font-size:14px] summary-line"}><span>Desconto</span><b>− {formatEth(quote.discountEth)}</b></div><div className={"[display:flex] [justify-content:space-between] [gap:12px] [padding:8px_0] [font-size:14px] [&_>_span]:[color:#d7c7b5] [&_small]:[display:block] [&_small]:[color:var(--muted)] [&_small]:[font-size:14px] [&_b]:[text-align:right] [&_b]:[white-space:nowrap] max-[640px]:[padding:4px_0] max-[640px]:[font-size:14px] max-[640px]:[&_small]:[display:inline] max-[640px]:[&_small]:[margin-left:4px] max-[640px]:[&_small]:[font-size:14px] summary-line"}><span>Taxa de rede</span><b>{formatEth(quote.networkFeeEth)}</b></div><div className={"[display:flex] [justify-content:space-between] [gap:12px] [padding:8px_0] [font-size:14px] [&_>_span]:[color:#d7c7b5] [&_small]:[display:block] [&_small]:[color:var(--muted)] [&_small]:[font-size:14px] [&_b]:[text-align:right] [&_b]:[white-space:nowrap] max-[640px]:[padding:4px_0] max-[640px]:[font-size:14px] max-[640px]:[&_small]:[display:inline] max-[640px]:[&_small]:[margin-left:4px] max-[640px]:[&_small]:[font-size:14px] [margin-top:7px] [padding-top:14px] [border-top:1px_solid_#664126] [font-size:14px] [font-weight:700] [&_b]:[color:var(--accent-light)] [&_b]:[font-size:14px] max-[640px]:[margin-top:4px] max-[640px]:[padding-top:9px] max-[640px]:[font-size:14px] max-[640px]:[&_b]:[font-size:14px] summary-line total-line"}><span>Total</span><b>{formatEth(quote.totalEth)}</b></div></>}
          <button className={"[min-height:42px] [padding:0_20px] [display:inline-flex] [justify-content:center] [align-items:center] [gap:9px] [border:1px_solid_var(--accent)] [border-radius:6px] [color:#1b1009] [background:var(--accent)] [font-weight:700] [font-size:14px] [cursor:pointer] [transition:background_.15s,_transform_.15s] [&:hover]:[color:#1b1009] [&:hover]:[background:var(--accent-light)] [&:hover]:[transform:translateY(-1px)] [&:disabled]:[transform:none] [&:disabled]:[cursor:not-allowed] [&:disabled]:[opacity:.52] [&.disabled]:[transform:none] [&.disabled]:[cursor:not-allowed] [&.disabled]:[opacity:.52] [width:100%] [margin-top:18px] max-[640px]:[margin-top:10px] max-[640px]:[border-radius:24px] button checkout-link"} onClick={() => void submit()} disabled={processing || wallets.length === 0 || !quote}>{processing ? 'Validando...' : acceptedQuote === currentSignature ? 'Confirmar compra' : 'Revisar valores'}</button>
          <small className={"[color:var(--muted)] [display:block] [margin:12px_0_0] [font-size:14px] [text-align:center] max-[640px]:[margin-top:7px] fine-print"}>Carteira: {selectedWalletKey ? selectedWallet?.alias : 'não selecionada'}</small>
        </aside>
      </div>
    </main>
  )
}

export function CheckoutPage() {
  return <RequireAuth><CheckoutContent /></RequireAuth>
}
