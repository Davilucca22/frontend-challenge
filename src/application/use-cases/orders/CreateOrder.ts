import type { CartLine, Quote } from '../../../domain/entities/Cart'
import type { Order } from '../../../domain/entities/Order'
import type { Wallet } from '../../../domain/entities/User'
import type { OrderRepository } from '../../../domain/repositories/OrderRepository'

export class CreateOrder {
  constructor(private readonly repository: OrderRepository) {}

  execute(items: CartLine[], wallet: Wallet, customer: Order['customer'], quote: Quote, coupon: string | undefined, idempotencyKey: string): Promise<Order> {
    if (items.length === 0) return Promise.reject(new Error('O carrinho está vazio.'))
    if (!idempotencyKey) return Promise.reject(new Error('A chave da compra é obrigatória.'))
    if (!customer.name.trim() || !customer.email.includes('@')) return Promise.reject(new Error('Informe os dados válidos do colecionador.'))
    return this.repository.create(items, wallet, customer, quote, coupon, idempotencyKey)
  }
}
