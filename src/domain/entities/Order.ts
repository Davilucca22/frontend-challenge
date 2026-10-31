import type { CartLine, Quote } from './Cart'
import type { NFT } from './NFT'
import type { Wallet } from './User'

// Estados possíveis durante o processamento demonstrativo de uma compra.
export type OrderStatus = 'pending' | 'confirmed' | 'declined'

// Pedido com dados do comprador, itens, cotação e carteira selecionada.
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

// Evento de atualização enviado quando o status do pedido muda.
export interface OrderEvent {
  eventId: string
  resourceId: string
  version: number
  status: OrderStatus
}
