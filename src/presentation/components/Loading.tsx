import { tw } from '../../shared/tw'
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={tw(`skeleton ${className}`)} />
}

export function LoadingGrid() {
  return <div className={"[display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:25px_20px] max-[900px]:[gap:17px_12px] max-[640px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[640px]:[align-items:start] max-[640px]:[gap:12px_14px] nft-grid"} aria-label="Carregando NFTs">{Array.from({ length: 6 }, (_, index) => <article className={"[min-width:0] max-[640px]:[min-width:0] max-[640px]:[padding:4px] max-[640px]:[border-radius:16px] max-[640px]:[background:#241610] max-[640px]:[&:nth-child(even)]:[margin-top:15px] nft-card"} key={index}><Skeleton className={"[width:100%] [aspect-ratio:1] skeleton-art"} /><Skeleton className={"[height:14px] [margin:10px_0] [&.short]:[width:55%] skeleton-line"} /><Skeleton className={"[height:14px] [margin:10px_0] [&.short]:[width:55%] short skeleton-line"} /></article>)}</div>
}
