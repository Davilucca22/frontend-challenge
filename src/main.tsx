import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from './presentation/providers/AppProviders'
import { router } from './presentation/routes'
import { bootstrap } from './app/bootstrap'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado.')

const root = createRoot(rootElement)
void bootstrap().then(() => {
  root.render(
    <StrictMode>
      <AppProviders><RouterProvider router={router} /></AppProviders>
    </StrictMode>,
  )
}).catch((error: unknown) => {
  console.error('Falha ao iniciar a aplicação.', error)
  root.render(<main role="alert" className="startup-error">Não foi possível iniciar a aplicação simulada. Atualize a página ou verifique o console.</main>)
})
