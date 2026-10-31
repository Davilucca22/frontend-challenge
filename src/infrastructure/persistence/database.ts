import type { CartLine, Quote } from '../../domain/entities/Cart'
import type { NFT } from '../../domain/entities/NFT'
import type { Order } from '../../domain/entities/Order'
import type { User, Wallet } from '../../domain/entities/User'
import { nftFixtures } from '../mocks/fixtures/nfts'
import type { MockScenario } from '../mocks/database/scenarios'
import { storage } from './storage'

// Acrescenta o hash demonstrativo usado pelas contas sem expô-lo na API pública.
export interface UserRecord extends User {
  passwordHash: string
}

// Define todo o estado persistido pela API simulada no navegador.
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

// Hash simples apenas para a demonstração; não substitui um KDF de produção.
const passwordHash = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `demo-${(hash >>> 0).toString(16)}`
}

// Cria o estado inicial com usuários de teste, fixtures e valores padrão.
const defaultDatabase = (): MockDatabase => ({
  users: [
    { id: 'user-demo', name: 'Davi Colecionador', username: 'davi-kurio', email: 'comprador@kurio.art', walletAlias: 'Reserva', ensName: 'novak.kurio.eth', avatar: '', passwordHash: passwordHash('kurio123') },
    { id: 'user-artist', name: 'Mila Costa', username: 'mila-artist', email: 'artista@kurio.art', walletAlias: 'Principal', ensName: 'mila.kurio.eth', avatar: '', passwordHash: passwordHash('kurio123') },
  ],
  currentUserId: null,
  nfts: [...nftFixtures],
  favorites: {},
  carts: {},
  coupons: { KURIO10: 10 },
  orders: [],
  idempotency: {},
  wallets: {},
  scenario: 'standard',
})

let database = storage.get<MockDatabase>('database', defaultDatabase())
const fixtureImages = new Map(nftFixtures.map((nft) => [nft.id, nft.image]))
// Atualiza imagens antigas após mudanças nas fixtures sem apagar os outros dados.
const outdatedNFTs = database.nfts.filter((nft) => fixtureImages.has(nft.id) && fixtureImages.get(nft.id) !== nft.image)
if (outdatedNFTs.length > 0) {
  database.nfts = database.nfts.map((nft) => {
    const image = fixtureImages.get(nft.id)
    return image ? { ...nft, image } : nft
  })
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
// Remove o hash antes de devolver os dados de conta às telas.
export const publicUser = (record: UserRecord): User => {
  const user = { ...record }
  delete (user as Partial<UserRecord>).passwordHash
  return user
}
export const currentOwnerId = (): string => database.currentUserId ?? 'guest'
export const cartForCurrentOwner = (): CartLine[] => database.carts[currentOwnerId()] ?? []
// Calcula valores em unidades inteiras de ETH para evitar erros de ponto flutuante.
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
