import type { NFTPage, NFTSearch } from '../../../domain/entities/NFT'
import type { NFTRepository } from '../../../domain/repositories/NFTRepository'

// Encapsula a busca paginada de NFTs e encaminha sinais de cancelamento.
export class GetNFTs {
  constructor(private readonly repository: NFTRepository) {}

  execute(search: NFTSearch, signal?: AbortSignal): Promise<NFTPage> {
    return this.repository.list(search, signal)
  }
}
