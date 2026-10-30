export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton ${className}`} />
}

export function LoadingGrid() {
  return <div className="nft-grid" aria-label="Carregando NFTs">{Array.from({ length: 6 }, (_, index) => <article className="nft-card" key={index}><Skeleton className="skeleton-art" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line short" /></article>)}</div>
}
