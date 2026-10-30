import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { Check, Clock3, Copy, ExternalLink, X } from 'lucide-react'
import type { Order } from '../../domain/entities/Order'
import { httpClient } from '../../infrastructure/http/axios-client'
import { createMarketplaceSocket } from '../../infrastructure/realtime/socket-client'
import { formatDate, formatEth, errorMessage, multiplyEth } from '../../shared/utils/format'
import { Feedback } from '../components/Feedback'
import { RequireAuth } from '../components/RequireAuth'
import { useAuth } from '../providers/AuthProvider'

function OrderContent() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const eventVersion = useRef(0)
  const orderQuery = useQuery({ queryKey: ['order', user?.id, orderId], queryFn: async () => (await httpClient.get<Order>(`/orders/${orderId}`)).data, refetchInterval: (query) => query.state.data?.status === 'pending' ? 3_000 : false })
  useEffect(() => {
    const socket = createMarketplaceSocket()
    const subscribe = () => socket.emit('subscribe', 'order', orderId)
    const update = (event: { resourceId: string; version: number }) => {
      if (event.resourceId !== orderId) return
      const existing = queryClient.getQueryData<Order>(['order', user?.id, orderId])
      if (event.version <= Math.max(eventVersion.current, existing?.version ?? 0)) return
      eventVersion.current = event.version
      void queryClient.invalidateQueries({ queryKey: ['order', user?.id, orderId] })
    }
    socket.on('connect', subscribe)
    socket.on('order.updated', update)
    return () => { socket.off('connect', subscribe); socket.off('order.updated', update); socket.disconnect() }
  }, [orderId, queryClient, user?.id])
  if (orderQuery.isPending) return <main className="page-shell"><p>Recuperando pedido...</p></main>
  if (orderQuery.isError) return <main className="page-shell"><Feedback>{errorMessage(orderQuery.error, 'Não foi possível recuperar esse pedido.')}</Feedback><Link to="/cart">Voltar ao carrinho</Link></main>
  const order = orderQuery.data
  if (order.status === 'pending') return <main className="page-shell order-status-page"><div className="status-icon pending"><Clock3 size={27} /></div><span className="eyebrow">Pedido {order.id}</span><h1>Pagamento em processamento</h1><p>Estamos aguardando a resposta da carteira simulada. Você pode atualizar a página sem iniciar outra compra.</p><div className="order-progress"><span className="complete">Pedido criado</span><span className="current">Aguardando confirmação</span></div><Link className="button button-outline" to="/">Voltar ao mercado</Link></main>
  if (order.status === 'declined') return <main className="page-shell order-status-page"><div className="status-icon declined"><X size={28} /></div><span className="eyebrow">Pedido {order.id}</span><h1>Pagamento recusado</h1><p>O pedido não foi confirmado e seus NFTs permanecem no carrinho.</p><Link className="button" to="/cart">Tentar novamente</Link></main>
  return <main className="page-shell receipt-page">
    <section className="receipt-card"><div className="receipt-success"><Check size={26} /></div><span className="eyebrow">Compra concluída</span><h1>Seu pedido foi confirmado!</h1><p>Obrigado por colecionar com a Kurio.</p><div className="receipt-id"><span>Identificação do pedido</span><b>{order.id}</b></div><div className="receipt-id"><span>Data</span><b>{formatDate(order.createdAt)}</b></div><div className="receipt-id"><span>Transação simulada</span><b>{order.transactionId}</b></div><button className="text-button" onClick={() => void navigator.clipboard?.writeText(order.transactionId)}><Copy size={14} /> Copiar identificação</button>
      <h2>Itens adquiridos</h2>{order.items.map((line) => <div className="receipt-item" key={line.nftId}><img src={line.nft.image} alt="" /><span>{line.nft.name}<small>{line.quantity} × {formatEth(line.unitPriceEth)}</small></span><b>{formatEth(multiplyEth(line.unitPriceEth, line.quantity))}</b></div>)}
      <div className="summary-line"><span>Taxa de rede</span><b>{formatEth(order.quote.networkFeeEth)}</b></div><div className="summary-line total-line"><span>Total pago</span><b>{formatEth(order.quote.totalEth)}</b></div><a className="receipt-explorer" href="#transaction" onClick={(event) => event.preventDefault()}>Explorador simulado <ExternalLink size={14} /></a><Link className="button" to="/">Continuar explorando</Link>
    </section>
  </main>
}

export function OrderPage() {
  return <RequireAuth><OrderContent /></RequireAuth>
}
