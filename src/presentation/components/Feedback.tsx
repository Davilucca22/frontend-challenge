import { tw } from '../../shared/tw'

// Exibe avisos de erro, sucesso ou informação com semântica acessível.
export function Feedback({ children, tone = 'error', onRetry }: { children: string; tone?: 'error' | 'success' | 'info'; onRetry?: () => void }) {
  return <div className={tw(`feedback feedback-${tone}`)} role={tone === 'error' ? 'alert' : 'status'}><p className="mb-0">{children}</p>{onRetry && <button className="mt-2 rounded border border-current bg-transparent px-3 py-1 text-sm font-semibold hover:bg-white/5" onClick={onRetry} type="button">Tentar novamente</button>}</div>
}
