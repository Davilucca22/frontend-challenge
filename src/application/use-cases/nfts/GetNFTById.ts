import type { NFT } from '../../../domain/entities/NFT'
import type { NFTRepository } from '../../../domain/repositories/NFTRepository'

// Encapsula a consulta de uma NFT específica sem acoplar o caso de uso ao HTTP.
export class GetNFTById {
  constructor(private readonly repository: NFTRepository) {}

  execute(id: string, signal?: AbortSignal): Promise<NFT> {
    return this.repository.getById(id, signal)
  }
}
