import { tw } from '../../shared/tw'
import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { NFT } from '../../domain/entities/NFT'
import { formatEth } from '../../shared/utils/format'

export function NFTCard({ nft, favorite, onFavorite, onAddToCart }: { nft: NFT; favorite?: boolean; onFavorite?: () => void; onAddToCart?: () => void }) {
  return (
    <article className={"[min-width:0] max-[640px]:[min-width:0] max-[640px]:[padding:4px] max-[640px]:[border-radius:16px] max-[640px]:[background:#241610] max-[640px]:[&:nth-child(even)]:[margin-top:15px] nft-card"}>
      <div className={"[position:relative] [padding:9px] [background:var(--panel)] [border-radius:8px] [&:hover_.nft-card-art]:[transform:scale(1.015)] max-[640px]:[padding:0] max-[640px]:[background:transparent] nft-card-art-wrap"}>
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`}>
          <img className={"[width:100%] [aspect-ratio:1_/_1] [object-fit:cover] [border-radius:6px] [background:#bcb99b] [transition:transform_.2s] max-[640px]:[aspect-ratio:1_/_1] max-[640px]:[border-radius:12px] nft-card-art"} src={nft.image} alt={`${nft.name}, arte digital de ${nft.collection}`} />
        </Link>
        {nft.rare && <span className={"[position:absolute] [top:16px] [left:16px] [padding:3px_7px] [color:#1b1009] [background:var(--accent-light)] [font-weight:700] [font-size:14px] max-[640px]:[top:6px] max-[640px]:[left:0] max-[640px]:[padding:3px_7px] max-[640px]:[font-size:14px] rare-badge"}>RARO</span>}
        {onFavorite && <button className={tw(`icon-button favorite-button ${favorite ? 'is-favorite' : ''}`)} onClick={onFavorite} aria-label={favorite ? `Remover ${nft.name} dos favoritos` : `Adicionar ${nft.name} aos favoritos`}><Heart size={16} fill={favorite ? 'currentColor' : 'none'} /></button>}
        {onAddToCart && <button className={"[min-width:34px] [min-height:34px] [display:inline-flex] [align-items:center] [justify-content:center] [color:var(--muted)] [background:transparent] [border:0] [border-radius:50%] [cursor:pointer] [&:hover]:[background:#382317] [&:hover]:[color:var(--accent-light)] [&.large]:[width:42px] [&.large]:[height:42px] [&.large]:[border:1px_solid_var(--border)] [position:absolute] [top:14px] [right:54px] [color:var(--text)] [background:#24150ccc] max-[640px]:[top:6px] max-[640px]:[right:35px] max-[640px]:[bottom:auto] max-[640px]:[min-width:25px] max-[640px]:[min-height:25px] max-[640px]:[color:#f0e9df] max-[640px]:[background:#382519] icon-button card-cart-button"} onClick={onAddToCart} aria-label={`Adicionar ${nft.name} ao carrinho`}><ShoppingCart size={15} /></button>}
      </div>
      <div className={"[display:flex] [flex-direction:column] [gap:1px] [padding:9px_4px] max-[640px]:[display:grid] max-[640px]:[gap:1px] max-[640px]:[padding:7px_4px_3px] nft-card-meta"}>
        <Link className={"[overflow:hidden] [color:#eadcc9] [font-size:11px] [text-overflow:ellipsis] [white-space:nowrap] max-[640px]:[overflow:hidden] max-[640px]:[font-size:10px] max-[640px]:[text-overflow:ellipsis] max-[640px]:[white-space:nowrap] nft-name"} to="/nft/$nftId" params={{ nftId: nft.id }}>{nft.name}</Link>
        <span className={"[color:var(--accent-light)] [font-size:14px] [font-weight:700] max-[640px]:[font-size:14px] price"}>{formatEth(nft.priceEth)}</span>
      </div>
    </article>
  )
}
