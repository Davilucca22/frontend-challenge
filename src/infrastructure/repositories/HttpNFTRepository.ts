import type { NFT, NFTPage, NFTSearch } from '../../domain/entities/NFT'
import type { NFTRepository } from '../../domain/repositories/NFTRepository'
import { httpClient } from '../http/axios-client'

export class HttpNFTRepository implements NFTRepository {
  async list(search: NFTSearch, signal?: AbortSignal): Promise<NFTPage> {
    const { data } = await httpClient.get<NFTPage>('/nfts', { params: search, signal })
    return data
  }

  async getById(id: string, signal?: AbortSignal): Promise<NFT> {
    const { data } = await httpClient.get<NFT>(`/nfts/${encodeURIComponent(id)}`, { signal })
    return data
  }

  async getFavorites(): Promise<string[]> {
    const { data } = await httpClient.get<string[]>('/favorites')
    return data
  }

  async setFavorite(id: string, favorite: boolean): Promise<string[]> {
    const { data } = await httpClient.put<string[]>(`/favorites/${encodeURIComponent(id)}`, { favorite })
    return data
  }
}
