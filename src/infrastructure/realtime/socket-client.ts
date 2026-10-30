import { io, type Socket } from 'socket.io-client'
import type { NFT } from '../../domain/entities/NFT'
import type { OrderEvent } from '../../domain/entities/Order'
import { appConfig } from '../../app/config/env'

export interface NFTUpdatedEvent {
  eventId: string
  resourceId: string
  version: number
  nft: NFT
}

export type MarketplaceSocket = Socket

export const createMarketplaceSocket = (): MarketplaceSocket =>
  io(window.location.origin, {
    path: appConfig.socketPath,
    addTrailingSlash: false,
    transports: ['polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 8,
  })

export const isOrderEvent = (value: unknown): value is OrderEvent =>
  typeof value === 'object' && value !== null && 'eventId' in value && 'resourceId' in value && 'version' in value
