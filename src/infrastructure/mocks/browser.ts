import { setupWorker } from 'msw/browser'
import handlers from './handlers'

// Registra no navegador os endpoints simulados pelo Mock Service Worker.
export const worker = setupWorker(...handlers)
