import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react'
import { HttpNFTRepository } from '../../infrastructure/repositories/HttpNFTRepository'
import { httpClient } from '../../infrastructure/http/axios-client'
import { formatEth, errorMessage, multiplyEth } from '../../shared/utils/format'
import { useAuth } from '../providers/AuthProvider'
import { Feedback } from '../components/Feedback'
import { Skeleton } from '../components/Loading'

const repository = new HttpNFTRepository()

export function NFTPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const nftQuery = useQuery({ queryKey: ['nft', nftId], queryFn: ({ signal }) => repository.getById(nftId, signal) })
  const favoriteQuery = useQuery({ queryKey: ['favorites', user?.id], queryFn: () => repository.getFavorites(), enabled: Boolean(user), retry: false })
  const favoriteMutation = useMutation({
    mutationFn: () => repository.setFavorite(nftId, !favoriteQuery.data?.includes(nftId)),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] })
      const previous = queryClient.getQueryData<string[]>(['favorites', user?.id]) ?? []
      queryClient.setQueryData<string[]>(['favorites', user?.id], previous.includes(nftId) ? previous.filter((id) => id !== nftId) : [...previous, nftId])
      return { previous }
    },
    onError: (_error, _variables, context) => { if (context) queryClient.setQueryData(['favorites', user?.id], context.previous) },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })
  const toggleFavorite = favoriteMutation.mutate
  useEffect(() => {
    const handleFavoriteToggle = () => {
      if (user) toggleFavorite()
    }
    window.addEventListener('kurio:toggle-favorite', handleFavoriteToggle)
    return () => window.removeEventListener('kurio:toggle-favorite', handleFavoriteToggle)
  }, [toggleFavorite, user])
  const cartMutation = useMutation({
    mutationFn: () => httpClient.put(`/cart/items/${nftId}`, { quantity }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      setMessage(`${quantity} unidade(s) adicionada(s) ao carrinho.`)
    },
  })
  if (nftQuery.isPending) return <main className="page-shell"><div className="detail-skeleton"><Skeleton className="detail-skeleton-art" /><div><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line short" /></div></div></main>
  if (nftQuery.isError) return <main className="page-shell"><Feedback>{errorMessage(nftQuery.error, 'NFT não encontrado.')}</Feedback><Link className="button button-outline" to="/">Voltar ao catálogo</Link></main>
  const nft = nftQuery.data
  const isFavorite = favoriteQuery.data?.includes(nft.id) ?? false
  return (
    <main className="page-shell detail-page">
      <Link to="/" className="back-link"><ArrowLeft size={16} />Voltar ao mercado</Link>
      <section className="detail-layout">
        <div className="detail-gallery"><div className="detail-thumbnails">{[0, 1, 2, 3].map((item) => <button className={item === 0 ? 'selected' : ''} key={item} aria-label={`Ver imagem ${item + 1}`}><img src={nft.image} alt="" /></button>)}</div><img className="detail-main-image" src={nft.image} alt={`${nft.name}, arte digital da coleção ${nft.collection}`} /></div>
        <div className="detail-information">
          <div className="detail-title"><div><span className="eyebrow">{nft.collection}</span><h1>{nft.name}</h1></div><button className={`icon-button large ${isFavorite ? 'is-favorite' : ''}`} onClick={() => user ? favoriteMutation.mutate() : void navigate({ to: '/login', search: { redirect: `/nft/${nft.id}` } })} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}><Heart fill={isFavorite ? 'currentColor' : 'none'} /></button></div>
          <p className="muted">Criado por <b>{nft.creator}</b> <span className="verified">✓ verificado</span></p>
          <p className="detail-description">{nft.description}</p>
          <div className="detail-price"><span>Preço atual</span><strong>{formatEth(nft.priceEth)}</strong>{nft.previousPriceEth && <small>Preço atualizado de {formatEth(nft.previousPriceEth)}</small>}</div>
          <div className="detail-stats"><div><span>Edição</span><b>#{String(nft.edition).padStart(3, '0')}</b></div><div><span>Disponíveis</span><b>{nft.available}</b></div><div><span>Rede</span><b>{nft.network}</b></div></div>
          <div className="detail-token-info"><p>ID do token: #{String(nft.edition).padStart(3, '0')}</p><p>Coleção: {nft.collection}</p></div>
          <div className="detail-attributes"><h3>Atributos</h3>{nft.attributes.map((attribute) => <span className="attribute-chip" key={attribute}>{attribute}</span>)}</div>
          <div className="quantity-row"><label htmlFor="quantity">Qtd.</label><div className="quantity-control"><button aria-label="Diminuir quantidade" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><input id="quantity" type="number" min={1} max={nft.available} value={quantity} onChange={(event) => setQuantity(Math.min(nft.available, Math.max(1, Number(event.target.value))))} /><button aria-label="Aumentar quantidade" disabled={quantity >= nft.available} onClick={() => setQuantity((value) => Math.min(nft.available, value + 1))}>+</button></div><strong>{formatEth(multiplyEth(nft.priceEth, quantity))}</strong></div>
          {cartMutation.isError && <Feedback>{errorMessage(cartMutation.error)}</Feedback>}{message && <Feedback tone="success">{message}</Feedback>}
          <div className="detail-actions"><button className="button" disabled={nft.available === 0 || cartMutation.isPending} onClick={() => cartMutation.mutate()}><ShoppingCart size={16} /><span className="detail-action-desktop">{cartMutation.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}</span><span className="detail-action-mobile">{cartMutation.isPending ? 'Adicionando...' : 'Comprar NFT'}</span></button><Link className="button button-outline" to="/cart"><ShoppingCart size={16} /><span>Ver carrinho</span></Link></div>
        </div>
      </section>
      <section className="detail-description-block"><h2>Detalhes do NFT</h2><p>{nft.description} Cada peça possui uma identidade única e faz parte de uma edição colecionável.</p><dl><div><dt>Coleção</dt><dd>{nft.collection}</dd></div><div><dt>Rede</dt><dd>{nft.network}</dd></div><div><dt>Identificador</dt><dd>{nft.id}</dd></div></dl></section>
    </main>
  )
}
