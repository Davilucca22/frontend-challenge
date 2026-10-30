import { useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartLine, Quote } from '../../domain/entities/Cart'
import type { NFT } from '../../domain/entities/NFT'
import { HttpOrderRepository } from '../../infrastructure/repositories/HttpOrderRepository'
import { httpClient } from '../../infrastructure/http/axios-client'
import { formatEth, errorMessage, multiplyEth } from '../../shared/utils/format'
import { useRealtime } from '../providers/RealtimeProvider'
import { Feedback } from '../components/Feedback'
import { Skeleton } from '../components/Loading'

const orderRepository = new HttpOrderRepository()

function CartContent() {
  const queryClient = useQueryClient()
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState('')
  const { triggerPriceChange } = useRealtime()
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: async () => (await httpClient.get<{ items: CartLine[] }>('/cart')).data })
  const items = cartQuery.data?.items ?? []
  const nftQueries = useQueries({
    queries: items.map((item) => ({ queryKey: ['nft', item.nftId], queryFn: async () => (await httpClient.get<NFT>(`/nfts/${item.nftId}`)).data })),
  })
  const quoteQuery = useQuery({
    queryKey: ['quote', items, coupon],
    queryFn: () => orderRepository.quote(items, coupon || undefined),
    enabled: items.length > 0,
    retry: false,
  })
  const cartMutation = useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) => httpClient.put(`/cart/items/${nftId}`, { quantity }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })
  const removeMutation = useMutation({
    mutationFn: (id: string) => httpClient.delete(`/cart/items/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })
  const quote = quoteQuery.data as Quote | undefined
  return (
    <main className="page-shell cart-page">
      <div className="page-heading"><div><span className="eyebrow">Sua seleção</span><h1>Carrinho de NFTs</h1></div><Link to="/" className="back-link">Continuar explorando</Link></div>
      {cartQuery.isPending ? <div className="cart-skeleton"><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" /></div> : cartQuery.isError ? <Feedback>{errorMessage(cartQuery.error)}</Feedback> : items.length === 0 ? <section className="empty-state"><h2>Seu carrinho está vazio</h2><p>Encontre seu próximo colecionável no mercado.</p><Link className="button" to="/">Explorar NFTs</Link></section> : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Itens do carrinho">
            {items.map((item, index) => {
              const nft = nftQueries[index]?.data
              if (!nft) return <article className="cart-row" key={item.nftId}><Skeleton className="cart-row-skeleton" /></article>
              return <article className="cart-row" key={item.nftId}>
                <Link to="/nft/$nftId" params={{ nftId: nft.id }}><img src={nft.image} alt={nft.name} /></Link>
                <div className="cart-item-name"><Link to="/nft/$nftId" params={{ nftId: nft.id }}>{nft.name}</Link><span>Edição: 1/{nft.available + item.quantity}</span><span className="price">{formatEth(nft.priceEth)}</span></div>
                <div className="quantity-control"><button aria-label={`Diminuir quantidade de ${nft.name}`} disabled={item.quantity <= 1 || cartMutation.isPending} onClick={() => cartMutation.mutate({ nftId: item.nftId, quantity: item.quantity - 1 })}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label={`Aumentar quantidade de ${nft.name}`} disabled={item.quantity >= nft.available || cartMutation.isPending} onClick={() => cartMutation.mutate({ nftId: item.nftId, quantity: item.quantity + 1 })}><Plus size={13} /></button></div>
                <strong>{formatEth(multiplyEth(nft.priceEth, item.quantity))}</strong><button className="icon-button remove-button" aria-label={`Remover ${nft.name}`} onClick={() => removeMutation.mutate(item.nftId)}><Trash2 size={16} /></button>
              </article>
            })}
            <button className="text-button simulate-button" onClick={() => triggerPriceChange(items[0].nftId)}>Simular atualização de preço via Socket.IO</button>
            {cartMutation.isError && <Feedback>{errorMessage(cartMutation.error)}</Feedback>}{removeMutation.isError && <Feedback>{errorMessage(removeMutation.error)}</Feedback>}
          </section>
          <aside className="summary-card">
            <h2>Resumo da carteira</h2>
            <form className="coupon-form" onSubmit={(event) => { event.preventDefault(); const value = couponInput.trim(); setCoupon(value); sessionStorage.setItem('kurio.checkout.coupon', value) }}><label className="sr-only" htmlFor="coupon">Cupom promocional</label><input id="coupon" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Cupom promocional..." /><button className="button button-small">Aplicar</button></form>
            {quoteQuery.isPending ? <Skeleton className="summary-skeleton" /> : quoteQuery.isError ? <Feedback>{errorMessage(quoteQuery.error, 'Cupom inválido ou cotação indisponível.')}</Feedback> : quote && <>
              {coupon && <button className="text-button remove-coupon" onClick={() => { setCoupon(''); setCouponInput(''); sessionStorage.removeItem('kurio.checkout.coupon') }}>Remover cupom {coupon} ×</button>}
              <div className="summary-line"><span>Subtotal</span><b>{formatEth(quote.subtotalEth)}</b></div><div className="summary-line"><span>Desconto</span><b>− {formatEth(quote.discountEth)}</b></div><div className="summary-line"><span>Taxa de rede <small>Taxa estimada</small></span><b>{formatEth(quote.networkFeeEth)}</b></div><div className="summary-line total-line"><span>Total</span><b>{formatEth(quote.totalEth)}</b></div>
            </>}
            <Link className={`button checkout-link ${!items.length || quoteQuery.isError ? 'disabled' : ''}`} to="/checkout" aria-label="Continuar para pagamento" aria-disabled={!items.length || quoteQuery.isError}><span className="checkout-link-desktop">Continuar para pagamento</span><span className="checkout-link-mobile">Conectar e finalizar</span></Link>
            <p className="fine-print">A cotação será validada novamente antes da compra.</p>
          </aside>
        </div>
      )}
    </main>
  )
}

export function CartPage() {
  return <CartContent />
}
