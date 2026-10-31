import { expect, test } from '@playwright/test'

// Valida o fluxo de compra do carrinho visitante até a confirmação do pedido.
test('preserva itens do visitante e conclui a compra simulada', async ({ page }) => {
  await page.goto('/')
  const cartUpdated = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes('/api/cart/items/emerald-ape-042') && response.ok(),
  )
  await page.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await cartUpdated
  await page.goto('/login?redirect=%2Fcart')
  await page.getByLabel('E-mail').fill('comprador@kurio.art')
  await page.getByRole('textbox', { name: 'Senha' }).fill('kurio123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL('**/cart')
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  await page.getByRole('link', { name: 'Continuar para pagamento' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  await page.getByLabel('Simular conexão da carteira e confirmar que revisei os dados').check()
  await page.getByRole('button', { name: 'Revisar valores' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento em processamento' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Seu pedido foi confirmado!' })).toBeVisible({ timeout: 8_000 })
})

// Confere filtros compartilháveis por URL, carregamento de imagens e rota de detalhe.
test('filtra catálogo pela URL e abre detalhes diretamente', async ({ page }) => {
  await page.goto('/?category=M%C3%BAsica&network=Solana&sort=price-asc&page=1')
  await expect(page.getByText('Golden Beat #207')).toBeVisible()
  await expect(page.getByText('After Hours #018')).toBeVisible()
  await expect(page.getByText('Emerald Ape #042')).toHaveCount(0)
  const nftImage = page.locator('.nft-grid .nft-card-art').first()
  await expect(nftImage).toBeVisible()
  await expect.poll(() => nftImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await page.goto('/nft/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await page.goto('/nft/not-a-real-nft')
  await expect(page.getByRole('alert')).toContainText('NFT não encontrado')
})

// Garante que alterações de preço em tempo real sejam refletidas no carrinho.
test('atualiza o preço do carrinho pelo cliente Socket.IO', async ({ page }) => {
  await page.goto('/')
  const cartUpdated = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().includes('/api/cart/items/emerald-ape-042') && response.ok(),
  )
  await page.getByRole('button', { name: 'Adicionar Emerald Ape #042 ao carrinho' }).click()
  await cartUpdated
  await page.goto('/cart')
  await page.getByRole('button', { name: 'Simular atualização de preço via Socket.IO' }).click()
  await expect(page.getByRole('status')).toContainText('Emerald Ape #042')
  await expect(page.getByText('1.29 ETH').first()).toBeVisible()
})
