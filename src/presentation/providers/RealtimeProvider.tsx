import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { NFT } from '../../domain/entities/NFT'
import { createMarketplaceSocket, type NFTUpdatedEvent } from '../../infrastructure/realtime/socket-client'

interface RealtimeContextValue {
  connected: boolean
  notice: string | null
  triggerPriceChange: (nftId: string) => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [connected, setConnected] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const eventVersions = useRef(new Map<string, number>())
  const socketRef = useRef<ReturnType<typeof createMarketplaceSocket> | null>(null)

  useEffect(() => {
    const socket = createMarketplaceSocket()
    socketRef.current = socket
    const onConnect = () => {
      setConnected(true)
      socket.emit('subscribe', 'catalog')
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
    const onDisconnect = () => setConnected(false)
    const onNFTUpdated = (event: NFTUpdatedEvent) => {
      const current = queryClient.getQueryData<NFT>(['nft', event.resourceId])
      const lastVersion = Math.max(eventVersions.current.get(event.resourceId) ?? 0, current?.version ?? 0)
      if (event.version <= lastVersion) return
      eventVersions.current.set(event.resourceId, event.version)
      if (!current || event.version > current.version) queryClient.setQueryData(['nft', event.resourceId], event.nft)
      queryClient.setQueriesData<{ items: NFT[] }>({ queryKey: ['nfts'] }, (previous) =>
        previous ? { ...previous, items: previous.items.map((item) => item.id === event.resourceId && event.version > item.version ? event.nft : item) } : previous,
      )
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      setNotice(`Preço ou disponibilidade de ${event.nft.name} foi atualizado.`)
      window.setTimeout(() => setNotice(null), 6_000)
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('nft.updated', onNFTUpdated)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('nft.updated', onNFTUpdated)
      socket.disconnect()
      socketRef.current = null
    }
  }, [queryClient])

  const value = useMemo<RealtimeContextValue>(() => ({
    connected,
    notice,
    triggerPriceChange: (nftId) => socketRef.current?.emit('mock.triggerPriceChange', nftId),
  }), [connected, notice])
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext)
  if (!context) throw new Error('useRealtime deve ser usado dentro de RealtimeProvider.')
  return context
}
