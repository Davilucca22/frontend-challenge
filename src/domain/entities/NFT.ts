// Modelo de domínio de uma peça digital disponível no catálogo.
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

// Parâmetros opcionais utilizados para filtrar, ordenar e paginar o catálogo.
export interface NFTSearch {
  q?: string
  category?: string
  network?: string
  min?: string
  max?: string
  sort?: 'recent' | 'price-asc' | 'price-desc'
  page?: number
}

// Resultado paginado retornado pela busca de NFTs.
export interface NFTPage {
  items: NFT[]
  page: number
  pageSize: number
  total: number
}
