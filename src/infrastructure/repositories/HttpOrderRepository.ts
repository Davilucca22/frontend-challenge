import type { CartLine, Quote } from '../../domain/entities/Cart'
import type { Order } from '../../domain/entities/Order'
import type { Wallet } from '../../domain/entities/User'
import type { OrderRepository } from '../../domain/repositories/OrderRepository'
import { httpClient } from '../http/axios-client'

export class HttpOrderRepository implements OrderRepository {
  async quote(items: CartLine[], coupon?: string): Promise<Quote> {
    const { data } = await httpClient.post<Quote>('/quote', { items, coupon })
    return data
  }

  async create(items: CartLine[], wallet: Wallet, customer: Order['customer'], quote: Quote, coupon: string | undefined, idempotencyKey: string): Promise<Order> {
    const { data } = await httpClient.post<Order>('/orders', { items, wallet, customer, quote, coupon }, { headers: { 'Idempotency-Key': idempotencyKey } })
    return data
  }

  async getById(id: string): Promise<Order> {
    const { data } = await httpClient.get<Order>(`/orders/${encodeURIComponent(id)}`)
    return data
  }
}
