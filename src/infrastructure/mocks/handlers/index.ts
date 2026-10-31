import { http, HttpResponse, delay, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { appConfig } from '../../../app/config/env'
import type { MockScenario } from '../database/scenarios'
import type { CartLine } from '../../../domain/entities/Cart'
import type { NFTSearch } from '../../../domain/entities/NFT'
import type { Order } from '../../../domain/entities/Order'
import type { User, Wallet } from '../../../domain/entities/User'
import {
  cartForCurrentOwner,
  currentOwnerId,
  getDatabase,
  hashPassword,
  publicUser,
  quoteLines,
  resetDatabase,
  saveDatabase,
} from '../../persistence/database'

type MockSocket = ReturnType<typeof toSocketIo>
const socketSubscriptions = new Map<MockSocket, Set<string>>()
const socketLink = ws.link(appConfig.socketPath)

const broadcast = (event: string, payload: unknown, subscription: string) => {
  for (const [socket, subscriptions] of socketSubscriptions) {
    if (subscriptions.has(subscription)) socket.client.emit(event, payload)
  }
}

const confirmOrder = (orderId: string) => {
  setTimeout(() => {
    const db = getDatabase()
    const order = db.orders.find((item) => item.id === orderId)
    if (!order || order.status !== 'pending') return
    order.status = db.scenario === 'payment-declined' ? 'declined' : 'confirmed'
    order.version += 1
    if (order.status === 'confirmed') {
      for (const line of order.items) {
        const nft = db.nfts.find((item) => item.id === line.nftId)
        if (nft) nft.available = Math.max(0, nft.available - line.quantity)
        const cart = db.carts[order.userId] ?? []
        const cartLine = cart.find((item) => item.nftId === line.nftId)
        if (cartLine) cartLine.quantity -= line.quantity
        db.carts[order.userId] = cart.filter((item) => item.quantity > 0)
      }
    }
    saveDatabase()
    broadcast('order.updated', {
      eventId: crypto.randomUUID(),
      resourceId: order.id,
      version: order.version,
      status: order.status,
    }, `order:${order.id}`)
  }, getDatabase().scenario === 'payment-pending' ? 10_000 : 900)
}

const changeNftPrice = (nftId: string) => {
  const nft = getDatabase().nfts.find((item) => item.id === nftId)
  if (!nft) return null
  nft.previousPriceEth = nft.priceEth
  nft.priceEth = (Number(nft.priceEth) + 0.1).toFixed(2)
  nft.available = Math.max(0, nft.available - 1)
  nft.version += 1
  saveDatabase()
  return { eventId: crypto.randomUUID(), resourceId: nft.id, version: nft.version, nft: { ...nft } }
}

const socketHandlers = [socketLink.addEventListener('connection', (connection) => {
  const socket = toSocketIo(connection)
  const subscriptions = new Set<string>()
  socketSubscriptions.set(socket, subscriptions)
  socket.client.on('subscribe', (_event, topic, resourceId) => {
    if (topic === 'catalog') subscriptions.add('catalog')
    if (topic === 'order' && typeof resourceId === 'string') {
      const order = getDatabase().orders.find((item) => item.id === resourceId)
      if (order && order.userId === getDatabase().currentUserId && order.status === 'pending') {
        subscriptions.add(`order:${resourceId}`)
        confirmOrder(resourceId)
      }
    }
  })
  socket.client.on('mock.triggerPriceChange', (_event, nftId) => {
    if (typeof nftId !== 'string') return
    const event = changeNftPrice(nftId)
    if (event) broadcast('nft.updated', event, 'catalog')
  })
  socket.rawClient.addEventListener('close', () => socketSubscriptions.delete(socket))
})]

const errorResponse = (status: number, message: string, code: string) =>
  HttpResponse.json({ message, code }, { status })

const userRequired = () => {
  const db = getDatabase()
  if (db.scenario === 'session-expired') {
    db.currentUserId = null
    saveDatabase()
    return null
  }
  const user = db.users.find((candidate) => candidate.id === db.currentUserId)
  return user ? { user, db } : null
}

const preserveGuestCart = (userId: string) => {
  const db = getDatabase()
  const guest = db.carts.guest ?? []
  if (!guest.length) return
  const owned = db.carts[userId] ?? []
  db.carts[userId] = guest.reduce<CartLine[]>((merged, line) => {
    const quantity = amountOf(merged, line.nftId) + line.quantity
    const available = db.nfts.find((nft) => nft.id === line.nftId)?.available ?? 0
    const next = Math.min(quantity, available)
    const existing = merged.find((item) => item.nftId === line.nftId)
    if (existing) existing.quantity = next
    else if (next > 0) merged.push({ nftId: line.nftId, quantity: next })
    return merged
  }, [...owned])
  delete db.carts.guest
}

const seedWallets = (userId: string, email: string): Wallet[] => [
  { id: `wallet-reserve-${userId}`, name: 'Reserva', alias: 'Reserva', address: '0x9A91...F82C', network: 'Polygon', type: 'WalletConnect', email, ens: 'nova.kurio.eth', primary: false },
  { id: `wallet-main-${userId}`, name: 'Principal', alias: 'Principal', address: '0xA91F...E82C', network: 'Ethereum', type: 'MetaMask', email, ens: 'colecionador.kurio.eth', primary: true },
]

const amountOf = (lines: CartLine[], nftId: string) =>
  lines.find((line) => line.nftId === nftId)?.quantity ?? 0

const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const db = getDatabase()
    const params = new URL(request.url).searchParams
    if (db.scenario === 'slow') await delay(1_200)
    if (db.scenario === 'out-of-order') await delay(params.get('q')?.toLowerCase() === 'slow' ? 1_000 : 80)
    if (db.scenario === 'failure') return errorResponse(503, 'Catálogo temporariamente indisponível.', 'SERVICE_UNAVAILABLE')
    const search: NFTSearch = {
      q: params.get('q') ?? undefined,
      category: params.get('category') ?? undefined,
      network: params.get('network') ?? undefined,
      min: params.get('min') ?? undefined,
      max: params.get('max') ?? undefined,
      sort: (params.get('sort') as NFTSearch['sort']) ?? 'recent',
      page: Number(params.get('page') ?? 1),
    }
    if (db.scenario === 'empty') return HttpResponse.json({ items: [], page: Math.max(1, search.page ?? 1), pageSize: 9, total: 0 })
    let items = [...db.nfts]
    if (search.q) {
      const term = search.q.toLocaleLowerCase()
      items = items.filter((item) => `${item.name} ${item.collection} ${item.creator}`.toLocaleLowerCase().includes(term))
    }
    if (search.category) items = items.filter((item) => item.category === search.category)
    if (search.network) items = items.filter((item) => item.network === search.network)
    if (search.min) items = items.filter((item) => Number(item.priceEth) >= Number(search.min))
    if (search.max) items = items.filter((item) => Number(item.priceEth) <= Number(search.max))
    if (search.sort === 'price-asc') items.sort((a, b) => Number(a.priceEth) - Number(b.priceEth))
    if (search.sort === 'price-desc') items.sort((a, b) => Number(b.priceEth) - Number(a.priceEth))
    const pageSize = 9
    const page = Math.max(1, search.page ?? 1)
    return HttpResponse.json({ items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length })
  }),

  http.get('/api/nfts/:id', ({ params }) => {
    const nft = getDatabase().nfts.find((item) => item.id === params.id)
    return nft ? HttpResponse.json(nft) : errorResponse(404, 'NFT não encontrado.', 'NOT_FOUND')
  }),

  http.get('/api/favorites', () => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para acessar seus favoritos.', 'UNAUTHORIZED')
    return HttpResponse.json(session.db.favorites[session.user.id] ?? [])
  }),

  http.put('/api/favorites/:id', async ({ params, request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para salvar favoritos.', 'UNAUTHORIZED')
    if (getDatabase().scenario === 'failure') return errorResponse(503, 'Não foi possível atualizar o favorito.', 'SERVICE_UNAVAILABLE')
    const { favorite } = (await request.json()) as { favorite: boolean }
    const id = String(params.id)
    const favorites = new Set(session.db.favorites[session.user.id] ?? [])
    if (favorite) favorites.add(id)
    else favorites.delete(id)
    session.db.favorites[session.user.id] = [...favorites]
    saveDatabase()
    return HttpResponse.json(session.db.favorites[session.user.id])
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { name, username, email, password } = (await request.json()) as Record<string, string>
    const db = getDatabase()
    if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase() || user.username === username)) {
      return errorResponse(409, 'E-mail ou nome de usuário já cadastrado.', 'ACCOUNT_CONFLICT')
    }
    if (!name?.trim() || !username?.trim() || !email?.includes('@') || password.length < 8) {
      return errorResponse(422, 'Revise os dados informados. A senha deve ter ao menos 8 caracteres.', 'VALIDATION_ERROR')
    }
    const user = {
      id: `user-${crypto.randomUUID()}`,
      name,
      username,
      email,
      walletAlias: 'Principal',
      ensName: '',
      avatar: '',
      passwordHash: hashPassword(password),
    }
    db.users.push(user)
    db.currentUserId = user.id
    preserveGuestCart(user.id)
    db.wallets[user.id] = seedWallets(user.id, user.email)
    saveDatabase()
    return HttpResponse.json(publicUser(user), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    const db = getDatabase()
    const user = db.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.passwordHash === hashPassword(password))
    if (!user) return errorResponse(401, 'E-mail ou senha incorretos.', 'INVALID_CREDENTIALS')
    db.currentUserId = user.id
    preserveGuestCart(user.id)
    if (!db.wallets[user.id]?.length) db.wallets[user.id] = seedWallets(user.id, user.email)
    saveDatabase()
    return HttpResponse.json(publicUser(user))
  }),

  http.get('/api/auth/session', () => {
    const session = userRequired()
    return session ? HttpResponse.json(publicUser(session.user)) : HttpResponse.json(null)
  }),

  http.post('/api/auth/logout', () => {
    const db = getDatabase()
    db.currentUserId = null
    saveDatabase()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/cart', () => HttpResponse.json({ items: cartForCurrentOwner() })),

  http.put('/api/cart/items/:id', async ({ params, request }) => {
    const { quantity } = (await request.json()) as { quantity: number }
    const nftId = String(params.id)
    const db = getDatabase()
    const nft = db.nfts.find((item) => item.id === nftId)
    if (!nft) return errorResponse(404, 'NFT não encontrado.', 'NOT_FOUND')
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > nft.available) {
      return errorResponse(409, `Quantidade indisponível. Restam ${nft.available} unidade(s).`, 'STOCK_CONFLICT')
    }
    const owner = currentOwnerId()
    const items = [...(db.carts[owner] ?? [])].filter((line) => line.nftId !== nftId)
    if (quantity > 0) items.push({ nftId, quantity })
    db.carts[owner] = items
    saveDatabase()
    return HttpResponse.json({ items })
  }),

  http.delete('/api/cart/items/:id', ({ params }) => {
    const db = getDatabase()
    const owner = currentOwnerId()
    db.carts[owner] = (db.carts[owner] ?? []).filter((line) => line.nftId !== params.id)
    saveDatabase()
    return HttpResponse.json({ items: db.carts[owner] })
  }),

  http.post('/api/quote', async ({ request }) => {
    const body = (await request.json()) as { items: CartLine[]; coupon?: string }
    const quote = quoteLines(body.items, body.coupon)
    if (body.coupon && !quote.coupon) return errorResponse(422, 'Cupom inválido ou expirado.', 'INVALID_COUPON')
    if (quote.issues.length) return HttpResponse.json({ ...quote, message: quote.issues.join('; ') }, { status: 409 })
    return HttpResponse.json(quote)
  }),

  http.post('/api/orders', async ({ request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Sua sessão expirou. Entre novamente para continuar.', 'UNAUTHORIZED')
    const payload = (await request.json()) as { items: CartLine[]; wallet: Wallet; customer: Order['customer']; quote: Order['quote']; coupon?: string }
    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) return errorResponse(400, 'Chave de idempotência obrigatória.', 'IDEMPOTENCY_KEY_REQUIRED')
    const fingerprint = JSON.stringify({ userId: session.user.id, ...payload })
    const previous = session.db.idempotency[idempotencyKey]
    if (previous) {
      if (previous.fingerprint !== fingerprint) return errorResponse(409, 'A chave já foi utilizada em outra compra.', 'IDEMPOTENCY_CONFLICT')
      const existing = session.db.orders.find((order) => order.id === previous.orderId && order.userId === session.user.id)
      return existing ? HttpResponse.json(existing) : errorResponse(404, 'Pedido não encontrado.', 'NOT_FOUND')
    }
    const ownedWallet = session.db.wallets[session.user.id]?.some((wallet) => wallet.id === payload.wallet?.id)
    if (!ownedWallet) return errorResponse(403, 'A carteira selecionada não pertence a esta conta.', 'FORBIDDEN')
    const ownedCart = session.db.carts[session.user.id] ?? []
    if (payload.items.some((line) => line.quantity > amountOf(ownedCart, line.nftId))) {
      return errorResponse(409, 'O carrinho foi alterado. Revise os itens antes de confirmar.', 'CART_CONFLICT')
    }
    const quote = quoteLines(payload.items, payload.coupon)
    if (JSON.stringify(quote) !== JSON.stringify(payload.quote)) return errorResponse(409, 'A cotação mudou. Revise os valores antes de confirmar.', 'QUOTE_STALE')
    if (quote.issues.length) return errorResponse(409, quote.issues.join('; '), 'STOCK_CONFLICT')
    if (quote.coupon !== payload.coupon?.toUpperCase() && payload.coupon) return errorResponse(422, 'Cupom inválido ou expirado.', 'INVALID_COUPON')
    const current = payload.items.map((line) => {
      const nft = session.db.nfts.find((item) => item.id === line.nftId)!
      return { ...line, nft: { ...nft }, unitPriceEth: nft.priceEth }
    })
    const order: Order = {
      id: `KUR-${Date.now().toString(36).toUpperCase()}`,
      userId: session.user.id,
      customer: payload.customer,
      transactionId: `0x${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`,
      status: 'pending',
      items: current,
      quote,
      wallet: payload.wallet,
      createdAt: new Date().toISOString(),
      version: 1,
    }
    session.db.orders.unshift(order)
    session.db.idempotency[idempotencyKey] = { fingerprint, orderId: order.id }
    saveDatabase()
    if (session.db.scenario === 'timeout-after-order') return HttpResponse.error()
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para consultar o pedido.', 'UNAUTHORIZED')
    const order = session.db.orders.find((item) => item.id === params.id && item.userId === session.user.id)
    return order ? HttpResponse.json(order) : errorResponse(404, 'Pedido não encontrado.', 'NOT_FOUND')
  }),

  http.get('/api/profile', () => {
    const session = userRequired()
    return session ? HttpResponse.json(publicUser(session.user)) : errorResponse(401, 'Entre para acessar seu perfil.', 'UNAUTHORIZED')
  }),

  http.put('/api/profile', async ({ request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para atualizar seu perfil.', 'UNAUTHORIZED')
    const update = (await request.json()) as Partial<User>
    if (!update.name?.trim() || !update.username?.trim() || !update.email?.includes('@')) {
      return errorResponse(422, 'Nome, usuário e e-mail são obrigatórios.', 'VALIDATION_ERROR')
    }
    const collision = session.db.users.some((user) => user.id !== session.user.id && (user.email === update.email || user.username === update.username))
    if (collision) return errorResponse(409, 'E-mail ou usuário já está em uso.', 'ACCOUNT_CONFLICT')
    Object.assign(session.user, update)
    saveDatabase()
    return HttpResponse.json(publicUser(session.user))
  }),

  http.put('/api/profile/password', async ({ request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para alterar sua senha.', 'UNAUTHORIZED')
    const { currentPassword, newPassword } = (await request.json()) as { currentPassword: string; newPassword: string }
    if (session.user.passwordHash !== hashPassword(currentPassword)) return errorResponse(422, 'A senha atual não confere.', 'VALIDATION_ERROR')
    if (newPassword.length < 8) return errorResponse(422, 'A nova senha deve ter ao menos 8 caracteres.', 'VALIDATION_ERROR')
    session.user.passwordHash = hashPassword(newPassword)
    saveDatabase()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/wallets', () => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para acessar suas carteiras.', 'UNAUTHORIZED')
    if (!session.db.wallets[session.user.id]?.length) session.db.wallets[session.user.id] = seedWallets(session.user.id, session.user.email)
    saveDatabase()
    return HttpResponse.json(session.db.wallets[session.user.id])
  }),

  http.post('/api/wallets', async ({ request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para cadastrar uma carteira.', 'UNAUTHORIZED')
    const payload = (await request.json()) as Omit<Wallet, 'id'>
    if (!payload.name?.trim() || !payload.alias?.trim() || !payload.address?.trim() || !payload.network) return errorResponse(422, 'Preencha os campos obrigatórios.', 'VALIDATION_ERROR')
    const wallets = session.db.wallets[session.user.id] ?? []
    const wallet: Wallet = { ...payload, id: crypto.randomUUID(), primary: wallets.length === 0 || payload.primary }
    session.db.wallets[session.user.id] = [...wallets.map((item) => ({ ...item, primary: wallet.primary ? false : item.primary })), wallet]
    saveDatabase()
    return HttpResponse.json(session.db.wallets[session.user.id], { status: 201 })
  }),

  http.put('/api/wallets/:id', async ({ params, request }) => {
    const session = userRequired()
    if (!session) return errorResponse(401, 'Entre para editar uma carteira.', 'UNAUTHORIZED')
    const payload = (await request.json()) as Partial<Wallet>
    const wallets = session.db.wallets[session.user.id] ?? []
    const existing = wallets.find((wallet) => wallet.id === params.id)
    if (!existing) return errorResponse(404, 'Carteira não encontrada.', 'NOT_FOUND')
    Object.assign(existing, payload)
    if (existing.primary) wallets.forEach((wallet) => { if (wallet.id !== existing.id) wallet.primary = false })
    saveDatabase()
    return HttpResponse.json(wallets)
  }),

  http.post('/api/mock/reset', () => {
    resetDatabase()
    return HttpResponse.json({ ok: true })
  }),
  http.put('/api/mock/scenario', async ({ request }) => {
    const { scenario } = (await request.json()) as { scenario: MockScenario }
    if (!['standard', 'empty', 'out-of-order', 'slow', 'failure', 'session-expired', 'payment-pending', 'payment-declined', 'timeout-after-order'].includes(scenario)) {
      return errorResponse(422, 'Cenário desconhecido.', 'INVALID_SCENARIO')
    }
    getDatabase().scenario = scenario
    saveDatabase()
    return HttpResponse.json({ scenario })
  }),
  http.post('/api/mock/price-change/:id', ({ params }) => {
    const event = changeNftPrice(String(params.id))
    if (!event) return errorResponse(404, 'NFT não encontrado.', 'NOT_FOUND')
    broadcast('nft.updated', event, 'catalog')
    return HttpResponse.json(event)
  }),
  http.post('/api/mock/socket-event/:id', async ({ params, request }) => {
    const nft = getDatabase().nfts.find((item) => item.id === params.id)
    if (!nft) return errorResponse(404, 'NFT não encontrado.', 'NOT_FOUND')
    const { kind } = await request.json() as { kind: 'duplicate' | 'stale' }
    const event = {
      eventId: `test-${kind}-${nft.id}-${nft.version}`,
      resourceId: nft.id,
      version: kind === 'stale' ? Math.max(0, nft.version - 1) : nft.version,
      nft: kind === 'stale' ? { ...nft, priceEth: nft.previousPriceEth ?? nft.priceEth } : { ...nft },
    }
    broadcast('nft.updated', event, 'catalog')
    if (kind === 'duplicate') broadcast('nft.updated', event, 'catalog')
    return HttpResponse.json({ eventId: event.eventId, version: event.version })
  }),
  ...socketHandlers,
]

export default handlers
