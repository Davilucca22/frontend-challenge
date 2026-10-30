export interface CartLine {
  nftId: string
  quantity: number
}

export interface Cart {
  items: CartLine[]
}

export interface Quote {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon?: string
  version: number
  issues: string[]
}
