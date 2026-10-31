import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { bootstrap } from './app/bootstrap'
import './styles.css'

// Confere o ponto de montagem antes de inicializar React.
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado.')

const root = createRoot(rootElement)
// Ativa mocks e carrega providers/rotas antes de renderizar a interface.
void bootstrap().then(() => {
  return Promise.all([import('./presentation/providers/AppProviders'), import('./presentation/routes')]).then(([{ AppProviders }, { router }]) => {
    root.render(
      <StrictMode>
        <AppProviders><RouterProvider router={router} /></AppProviders>
      </StrictMode>,
    )
  })
}).catch((error: unknown) => {
  // Apresenta uma falha explícita caso a inicialização não possa ser concluída.
  console.error('Falha ao iniciar a aplicação.', error)
  root.render(<main role="alert" className="[max-width:500px] [margin:15vh_auto] [padding:24px] [border:1px_solid_var(--danger)] [background:#301915] startup-error">Não foi possível iniciar a aplicação simulada. Atualize a página ou verifique o console.</main>)
})
