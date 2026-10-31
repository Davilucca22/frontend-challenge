import type { CartLine } from '../../domain/entities/Cart'
import type { Wallet } from '../../domain/entities/User'

// Reúne os dados necessários para solicitar a criação idempotente de um pedido.
export interface CreateOrderDTO {
  items: CartLine[]
  wallet: Wallet
  coupon?: string
  idempotencyKey: string
}
