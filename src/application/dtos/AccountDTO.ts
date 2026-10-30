import type { User, Wallet } from '../../domain/entities/User'

export interface ProfileUpdateDTO {
  name: string
  username: string
  email: string
  walletAlias: string
  ensName: string
  avatar: string
}

export interface PasswordUpdateDTO {
  currentPassword: string
  newPassword: string
}

export interface WalletInputDTO extends Omit<Wallet, 'id'> {
  id?: string
}

export type ProfileDTO = User
