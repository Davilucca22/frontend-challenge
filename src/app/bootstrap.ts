import { appConfig } from './config/env'

// Inicia os recursos externos da aplicação antes da montagem da interface.
export async function bootstrap(): Promise<void> {
  // Carrega o Service Worker apenas quando o modo de simulação está habilitado.
  if (appConfig.mocksEnabled) {
    const { worker } = await import('../infrastructure/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}
