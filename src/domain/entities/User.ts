// Dados públicos e editáveis de uma conta de colecionador.
export interface User {
  id: string
  name: string
  username: string
  email: string
  walletAlias: string
  ensName: string
  avatar: string
}

// Carteira associada à conta para simular opções de pagamento.
export interface Wallet {
  id: string
  name: string
  alias: string
  address: string
  network: string
  type: string
  email: string
  ens: string
  primary: boolean
}
