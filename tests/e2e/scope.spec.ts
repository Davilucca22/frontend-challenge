import { expect, test, type Page } from '@playwright/test'

async function setScenario(page: Page, scenario: string) {
  await expect(page.locator('#root > *').first()).toBeVisible()
  await page.evaluate(async (value) => {
    const response = await fetch('/api/mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: value }),
    })
    if (!response.ok) throw new Error(`Não foi possível ativar o cenário ${value}: ${response.status} ${await response.text()}`)
  }, scenario)
}

async function signIn(page: Page, redirect = '/cart', email = 'comprador@kurio.art') {
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('textbox', { name: 'Senha' }).fill('kurio123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL(`**${redirect}`)
}

async function addEmerald(page: Page) {
  await page.goto('/')
  const cartUpdated = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes('/api/cart/items/emerald-ape-042') && response.ok(),
  )
  await page.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await cartUpdated
}

async function finishCheckout(page: Page) {
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await page.getByRole('button', { name: 'Revisar valores' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
}

test('mantém filtros no histórico e na URL com parâmetros combinados', async ({ page }) => {
  await page.goto('/?category=M%C3%BAsica&network=Solana&sort=price-asc&page=1')
  await expect(page.getByText('Golden Beat #207')).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
  if (await page.evaluate(() => matchMedia('(max-width: 640px)').matches)) {
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
  }
  await page.getByRole('button', { name: 'Todas as categorias' }).click()
  await expect(page).toHaveURL(/network=Solana/)
  await expect(page).not.toHaveURL(/category=/)
  await page.goBack()
  await expect(page).toHaveURL(/category=M%C3%BAsica/)
  await expect(page.getByText('Golden Beat #207')).toBeVisible()
})

test('Diário de Cunhagem apresenta quatro histórias e abre o NFT relacionado', async ({ page }) => {
  await page.goto('/')
  const diary = page.getByRole('region', { name: 'Diário de Cunhagem' })
  await expect(diary.getByRole('heading', { name: 'Diário de Cunhagem' })).toBeVisible()
  await expect(diary.locator('article')).toHaveCount(4)
  await diary.getByRole('link', { name: 'Ler mais: O que acontece na cunhagem?' }).click()
  await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('login, sessão recuperável, expiração e logout preservam o fluxo', async ({ page }) => {
  await signIn(page, '/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await setScenario(page, 'session-expired')
  await page.locator('.account-sidebar a[href="/wallets"]').click()
  await expect(page.getByText('Entre para continuar')).toBeVisible()
  await page.getByRole('link', { name: 'Entrar na Kurio' }).click()
  await expect(page).toHaveURL(/login.*redirect.*wallets/)
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await setScenario(page, 'standard')
  await signIn(page, '/profile', 'artista@kurio.art')
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.waitForURL((url) => url.pathname === '/')
})

test('favoritos revertem uma falha e podem ser salvos após recuperação', async ({ page }) => {
  await signIn(page, '/')
  await page.goto('/')
  await setScenario(page, 'failure')
  const favorite = page.getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos' })
  await favorite.click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível atualizar o favorito')
  await expect(page.getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos' })).toBeVisible()
  await setScenario(page, 'standard')
  await page.getByRole('button', { name: 'Adicionar Emerald Ape #042 aos favoritos' }).click()
  await expect(page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver NFTs favoritas' }).first().click()
  await expect(page.getByRole('dialog')).toContainText('Emerald Ape #042')
})

test('carrinho persiste, aceita cupom válido e mantém itens após login', async ({ page }) => {
  await addEmerald(page)
  await page.goto('/cart')
  await page.getByLabel('Cupom promocional').fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByText('Desconto')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  await signIn(page, '/cart')
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  await expect(page.locator('.summary-line').filter({ hasText: 'Desconto' })).toContainText('0.119 ETH')
})

test('pagamento recusado preserva o carrinho e não apresenta recibo confirmado', async ({ page }) => {
  await addEmerald(page)
  await setScenario(page, 'payment-declined')
  await signIn(page, '/cart')
  await finishCheckout(page)
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 12_000 })
  await page.goto('/cart')
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
})

test('timeout após criação recupera o mesmo pedido por idempotência', async ({ page }) => {
  await addEmerald(page)
  await setScenario(page, 'timeout-after-order')
  await signIn(page, '/cart')
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await page.getByRole('button', { name: 'Revisar valores' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento em processamento' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Seu pedido foi confirmado!' })).toBeVisible({ timeout: 10_000 })
})

test('edita perfil, avatar, senha e carteira', async ({ page }) => {
  await signIn(page, '/profile')
  await page.getByLabel('Nome de exibição *').fill('Davi Colecionador Atualizado')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toContainText('Perfil atualizado')
  await page.getByRole('button', { name: 'Alterar', exact: true }).click()
  await page.locator('input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/+ioAAAAASUVORK5CYII=', 'base64') })
  await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()
  await page.locator('.profile-password-section input').nth(0).fill('kurio123')
  await page.locator('.profile-password-section input').nth(1).fill('kurio1234')
  await page.locator('.profile-password-section input').nth(2).fill('kurio1234')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('status')).toContainText('Senha alterada')
  await page.locator('.account-sidebar a[href="/wallets"]').click()
  await page.getByRole('button', { name: 'Nova', exact: true }).click()
  await page.getByLabel('Nome de exibição *').fill('Carteira de teste')
  await page.getByLabel('Apelido da carteira *').fill('Secundária')
  await page.getByLabel('Endereço da carteira *').fill('0x1234567890abcdef')
  await page.getByLabel('Nome ENS').fill('colecionador.eth')
  await page.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()
  await expect(page.getByText('Secundária')).toBeVisible()
})

test('preço alterado via Socket.IO exige revisão antes da compra', async ({ page }) => {
  await addEmerald(page)
  await signIn(page, '/checkout')
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await page.getByRole('button', { name: 'Revisar valores' }).click()
  await page.evaluate(async () => {
    await fetch('/api/mock/price-change/emerald-ape-042', { method: 'POST' })
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'O preço, disponibilidade ou taxas mudaram' })).toBeVisible()
  await expect(page).not.toHaveURL(/orders/)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento em processamento' })).toBeVisible()
})

test('eventos Socket.IO duplicados e antigos não revertem o preço', async ({ page }) => {
  await addEmerald(page)
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Simular atualização de preço via Socket.IO' }).click()
  await expect(page.getByRole('status')).toContainText('Emerald Ape #042')
  await page.evaluate(async () => {
    await fetch('/api/mock/socket-event/emerald-ape-042', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'duplicate' }) })
    await fetch('/api/mock/socket-event/emerald-ape-042', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'stale' }) })
  })
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByText('1.29 ETH').last()).toBeVisible()
})

test('diálogo de favoritos gerencia foco e formulário de conta valida campos', async ({ page }) => {
  await signIn(page, '/')
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Ver NFTs favoritas' }).first()
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar diálogo' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await page.goto('/register')
  await page.getByRole('button', { name: 'Criar perfil' }).click()
  await expect(page.locator('input[required]').first()).toBeFocused()
})

test('skeleton, resposta vazia e falha transitória têm estados e recuperação', async ({ page }) => {
  await page.goto('/')
  await setScenario(page, 'slow')
  await page.reload()
  await expect(page.getByLabel('Carregando NFTs')).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible({ timeout: 5_000 })
  await setScenario(page, 'empty')
  await page.reload()
  await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  await setScenario(page, 'failure')
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Catálogo temporariamente indisponível')
  await setScenario(page, 'standard')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
})

test('pedido pendente é recuperado após desconexão e recarga sem duplicar compra', async ({ page }) => {
  await addEmerald(page)
  await setScenario(page, 'payment-pending')
  await signIn(page, '/cart')
  await finishCheckout(page)
  await expect(page.getByRole('heading', { name: 'Pagamento em processamento' })).toBeVisible()
  await page.context().setOffline(true)
  await page.waitForTimeout(300)
  await page.context().setOffline(false)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Seu pedido foi confirmado!' })).toBeVisible({ timeout: 15_000 })
})
