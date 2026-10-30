export interface User {
  id: string
  name: string
  username: string
  email: string
  walletAlias: string
  ensName: string
  avatar: string
}

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
