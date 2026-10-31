import { useQueries, useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { HttpNFTRepository } from '../../infrastructure/repositories/HttpNFTRepository'
import { errorMessage, formatEth } from '../../shared/utils/format'
import { Feedback } from './Feedback'
import type { RefObject } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../components/ui/dialog'

const nftRepository = new HttpNFTRepository()

export function FavoritesModal({ userId, onClose, returnFocusRef }: { userId: string; onClose: () => void; returnFocusRef?: RefObject<HTMLElement | null> }) {
  const favoritesQuery = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => nftRepository.getFavorites(),
    retry: false,
  })
  const favoriteQueries = useQueries({
    queries: (favoritesQuery.data ?? []).map((id) => ({
      queryKey: ['nft', id],
      queryFn: () => nftRepository.getById(id),
      retry: false,
    })),
  })
  const hasError = favoritesQuery.isError || favoriteQueries.some((query) => query.isError)
  const isPending = favoritesQuery.isPending || favoriteQueries.some((query) => query.isPending)
  const favorites = favoriteQueries.flatMap((query) => query.data ? [query.data] : [])
  const error = favoritesQuery.error ?? favoriteQueries.find((query) => query.isError)?.error

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent aria-describedby="favorites-modal-description" className="gap-0 p-5 sm:p-7" onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}>
        <header className="mb-5 flex items-center justify-between gap-4 border-b border-[#49301f] pb-4">
          <div className="flex items-center gap-3">
            <Heart aria-hidden="true" className="text-accent-light" size={22} />
            <div>
              <DialogTitle className="m-0">NFTs favoritas</DialogTitle>
              <DialogDescription className="mb-0 mt-1" id="favorites-modal-description">Sua seleção especial</DialogDescription>
            </div>
          </div>
        </header>

        {isPending && <p className="py-8 text-center text-sm font-medium text-muted" role="status">Carregando favoritos...</p>}
        {hasError && <Feedback>{errorMessage(error, 'Não foi possível carregar suas NFTs favoritas.')}</Feedback>}
        {!isPending && !hasError && favorites.length === 0 && (
          <div className="py-10 text-center">
            <Heart aria-hidden="true" className="mx-auto mb-3 text-muted" size={30} />
            <p className="mb-0 text-sm font-medium text-muted">Você ainda não adicionou NFTs aos favoritos.</p>
          </div>
        )}
        {!hasError && favorites.length > 0 && (
          <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
            {favorites.map((nft) => (
              <li className="min-w-0" key={nft.id}>
                <Link
                  aria-label={`Ver ${nft.name}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-panel p-3 transition hover:border-accent"
                  onClick={onClose}
                  params={{ nftId: nft.id }}
                  to="/nft/$nftId"
                >
                  <img alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" src={nft.image} />
                  <span className="grid min-w-0 gap-1">
                    <span className="truncate text-sm font-bold text-text">{nft.name}</span>
                    <span className="truncate text-sm font-medium text-muted">{nft.collection}</span>
                    <span className="text-sm font-bold text-accent-light">{formatEth(nft.priceEth)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
