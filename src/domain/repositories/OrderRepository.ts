import type { CartLine, Quote } from '../entities/Cart'
import type { Order } from '../entities/Order'
import type { Wallet } from '../entities/User'

// Contrato de cotação, criação idempotente e consulta de pedidos.
export interface OrderRepository {
  quote(lines: CartLine[], coupon?: string): Promise<Quote>
  create(lines: CartLine[], wallet: Wallet, customer: Order['customer'], quote: Quote, coupon: string | undefined, idempotencyKey: string): Promise<Order>
  getById(id: string): Promise<Order>
}
