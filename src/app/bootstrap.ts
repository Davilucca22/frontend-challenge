import { appConfig } from './config/env'

export async function bootstrap(): Promise<void> {
  if (appConfig.mocksEnabled) {
    const { worker } = await import('../infrastructure/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}
