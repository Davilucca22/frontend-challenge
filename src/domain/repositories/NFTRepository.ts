import type { NFT, NFTPage, NFTSearch } from '../entities/NFT'

export interface NFTRepository {
  list(search: NFTSearch, signal?: AbortSignal): Promise<NFTPage>
  getById(id: string, signal?: AbortSignal): Promise<NFT>
  getFavorites(): Promise<string[]>
  setFavorite(id: string, favorite: boolean): Promise<string[]>
}
