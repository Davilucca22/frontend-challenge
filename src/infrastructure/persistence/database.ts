import type { CartLine, Quote } from '../../domain/entities/Cart'
import type { NFT } from '../../domain/entities/NFT'
import type { Order } from '../../domain/entities/Order'
import type { User, Wallet } from '../../domain/entities/User'
import { nftFixtures } from '../mocks/fixtures/nfts'
import type { MockScenario } from '../mocks/database/scenarios'
import { artwork } from '../../shared/constants/assets'
import { storage } from './storage'

export interface UserRecord extends User {
  passwordHash: string
}

export interface MockDatabase {
  users: UserRecord[]
  currentUserId: string | null
  nfts: NFT[]
  favorites: Record<string, string[]>
  carts: Record<string, CartLine[]>
  coupons: Record<string, number>
  orders: Order[]
  idempotency: Record<string, { fingerprint: string; orderId: string }>
  wallets: Record<string, Wallet[]>
  scenario: MockScenario
}

const passwordHash = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `demo-${(hash >>> 0).toString(16)}`
}

const shuffledArtwork = (): string[] => {
  const images = Object.values(artwork)
  for (let index = images.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const image = images[index]
    images[index] = images[randomIndex]
    images[randomIndex] = image
  }
  return images
}

const withRandomArtwork = (nfts: NFT[]): NFT[] => {
  const images = shuffledArtwork()
  return nfts.map((nft, index) => ({ ...nft, image: images[index % images.length] }))
}

const defaultDatabase = (): MockDatabase => ({
  users: [
    { id: 'user-demo', name: 'Davi Colecionador', username: 'davi-kurio', email: 'comprador@kurio.art', walletAlias: 'Reserva', ensName: 'novak.kurio.eth', avatar: '', passwordHash: passwordHash('kurio123') },
    { id: 'user-artist', name: 'Mila Costa', username: 'mila-artist', email: 'artista@kurio.art', walletAlias: 'Principal', ensName: 'mila.kurio.eth', avatar: '', passwordHash: passwordHash('kurio123') },
  ],
  currentUserId: null,
  nfts: withRandomArtwork(nftFixtures),
  favorites: {},
  carts: {},
  coupons: { KURIO10: 10 },
  orders: [],
  idempotency: {},
  wallets: {},
  scenario: 'standard',
})

let database = storage.get<MockDatabase>('database', defaultDatabase())
const currentArtwork = new Set(Object.values(artwork))
const outdatedNFTs = database.nfts.filter((nft) => !currentArtwork.has(nft.image))
if (outdatedNFTs.length > 0) {
  const images = shuffledArtwork()
  let imageIndex = 0
  database.nfts = database.nfts.map((nft) =>
    currentArtwork.has(nft.image)
      ? nft
      : { ...nft, image: images[imageIndex++ % images.length] },
  )
  storage.set('database', database)
}

export const getDatabase = (): MockDatabase => database
export const saveDatabase = (): void => storage.set('database', database)
export const resetDatabase = (): MockDatabase => {
  database = defaultDatabase()
  storage.set('database', database)
  return database
}
export const replaceDatabase = (next: MockDatabase): void => {
  database = next
  saveDatabase()
}
export const hashPassword = passwordHash
export const publicUser = (record: UserRecord): User => {
  const user = { ...record }
  delete (user as Partial<UserRecord>).passwordHash
  return user
}
export const currentOwnerId = (): string => database.currentUserId ?? 'guest'
export const cartForCurrentOwner = (): CartLine[] => database.carts[currentOwnerId()] ?? []
export const quoteLines = (lines: CartLine[], coupon?: string): Quote => {
  const unit = 1_000_000_000_000_000_000n
  const subtotalMicro = lines.reduce((sum, line) => {
    const nft = database.nfts.find((item) => item.id === line.nftId)
    if (!nft) return sum
    const [whole, fraction = ''] = nft.priceEth.split('.')
    return sum + (BigInt(whole) * unit + BigInt(fraction.padEnd(18, '0').slice(0, 18))) * BigInt(line.quantity)
  }, 0n)
  const discountPercent = coupon ? database.coupons[coupon.toUpperCase()] ?? 0 : 0
  const discount = (subtotalMicro * BigInt(discountPercent)) / 100n
  const networkFee = subtotalMicro > 0n ? 16_000_000_000_000_000n : 0n
  const format = (amount: bigint) => {
    const fraction = (amount % unit).toString().padStart(18, '0').replace(/0+$/, '')
    return fraction ? `${amount / unit}.${fraction}` : `${amount / unit}.00`
  }
  const issues = lines.flatMap((line) => {
    const nft = database.nfts.find((item) => item.id === line.nftId)
    return !nft ? [`NFT ${line.nftId} não encontrado`] : line.quantity > nft.available ? [`${nft.name}: apenas ${nft.available} disponível(is)`] : []
  })
  return {
    subtotalEth: format(subtotalMicro),
    discountEth: format(discount),
    networkFeeEth: format(networkFee),
    totalEth: format(subtotalMicro - discount + networkFee),
    coupon: discountPercent > 0 ? coupon?.toUpperCase() : undefined,
    version: lines.reduce((max, line) => Math.max(max, database.nfts.find((nft) => nft.id === line.nftId)?.version ?? 0), 0),
    issues,
  }
}
