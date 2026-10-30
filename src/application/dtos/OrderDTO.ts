import type { CartLine } from '../../domain/entities/Cart'
import type { Wallet } from '../../domain/entities/User'

export interface CreateOrderDTO {
  items: CartLine[]
  wallet: Wallet
  coupon?: string
  idempotencyKey: string
}
