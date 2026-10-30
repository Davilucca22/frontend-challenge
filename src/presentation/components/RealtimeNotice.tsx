import { Radio } from 'lucide-react'
import { useRealtime } from '../providers/RealtimeProvider'

export function RealtimeNotice() {
  const { notice, connected } = useRealtime()
  return (
    <>
      {notice && <div className="realtime-notice" role="status">{notice}</div>}
      <span className="connection-indicator" title={connected ? 'Atualizações em tempo real conectadas' : 'Reconectando atualizações'} aria-label={connected ? 'Tempo real conectado' : 'Tempo real desconectado'}><Radio size={12} />{connected ? 'AO VIVO' : 'CONECTANDO'}</span>
    </>
  )
}
