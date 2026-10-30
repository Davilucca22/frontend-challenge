import type { CartLine, Quote } from './Cart'
import type { NFT } from './NFT'
import type { Wallet } from './User'

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface Order {
  id: string
  userId: string
  customer: { name: string; email: string; ensName: string }
  transactionId: string
  status: OrderStatus
  items: Array<CartLine & { nft: NFT; unitPriceEth: string }>
  quote: Quote
  wallet: Wallet
  createdAt: string
  version: number
}

export interface OrderEvent {
  eventId: string
  resourceId: string
  version: number
  status: OrderStatus
}
