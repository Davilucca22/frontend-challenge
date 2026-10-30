import type { NFT } from '../../../domain/entities/NFT'
import type { NFTRepository } from '../../../domain/repositories/NFTRepository'

export class GetNFTById {
  constructor(private readonly repository: NFTRepository) {}

  execute(id: string, signal?: AbortSignal): Promise<NFT> {
    return this.repository.getById(id, signal)
  }
}
