export interface NFT {
  id: string
  name: string
  creator: string
  collection: string
  description: string
  image: string
  priceEth: string
  previousPriceEth?: string
  network: string
  edition: number
  available: number
  category: string
  attributes: string[]
  rare?: boolean
  version: number
}

export interface NFTSearch {
  q?: string
  category?: string
  network?: string
  min?: string
  max?: string
  sort?: 'recent' | 'price-asc' | 'price-desc'
  page?: number
}

export interface NFTPage {
  items: NFT[]
  page: number
  pageSize: number
  total: number
}
