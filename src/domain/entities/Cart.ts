// Representa cada item do carrinho pelo identificador da NFT e sua quantidade.
export interface CartLine {
  nftId: string
  quantity: number
}

// Agrupa os itens que compõem o carrinho ativo.
export interface Cart {
  items: CartLine[]
}

// Descreve a cotação calculada antes de confirmar uma compra.
export interface Quote {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon?: string
  version: number
  issues: string[]
}
