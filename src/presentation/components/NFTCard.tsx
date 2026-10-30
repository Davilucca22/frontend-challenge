import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NFT } from '../../domain/entities/NFT'
import { formatEth } from '../../shared/utils/format'

export function NFTCard({ nft, favorite, onFavorite, onAddToCart }: { nft: NFT; favorite?: boolean; onFavorite?: () => void; onAddToCart?: () => void }) {
  return (
    <article className="nft-card">
      <div className="nft-card-art-wrap">
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`}>
          <img className="nft-card-art" src={nft.image} alt={`${nft.name}, arte digital de ${nft.collection}`} />
        </Link>
        {nft.rare && <span className="rare-badge">RARO</span>}
        {onFavorite && <button className={`icon-button favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={onFavorite} aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button>}
        {onAddToCart && <button className="icon-button card-cart-button" onClick={onAddToCart} aria-label={`Adicionar ${nft.name} ao carrinho`}><ShoppingCart size={15} /></button>}
      </div>
      <div className="nft-card-meta">
        <Link className="nft-name" to="/nft/$nftId" params={{ nftId: nft.id }}>{nft.name}</Link>
        <span className="price">{formatEth(nft.priceEth)}</span>
      </div>
    </article>
  )
}
