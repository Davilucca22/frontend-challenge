import { io, type Socket } from 'socket.io-client'
import type { NFT } from '../../domain/entities/NFT'
import type { OrderEvent } from '../../domain/entities/Order'
import { appConfig } from '../../app/config/env'

// Formato de evento publicado quando preço ou estoque de uma NFT é alterado.
export interface NFTUpdatedEvent {
  eventId: string
  resourceId: string
  version: number
  nft: NFT
}

export type MarketplaceSocket = Socket

// Cria o cliente Socket.IO com reconexão automática para atualizações do marketplace.
export const createMarketplaceSocket = (): MarketplaceSocket =>
  io(window.location.origin, {
    path: appConfig.socketPath,
    addTrailingSlash: false,
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 8,
  })

// Confere os campos mínimos antes de tratar um payload como evento de pedido.
export const isOrderEvent = (value: unknown): value is OrderEvent =>
  typeof value === 'object' && value !== null && 'eventId' in value && 'resourceId' in value && 'version' in value
