import type { User, Wallet } from '../../domain/entities/User'

// Define os campos aceitos ao editar os dados públicos do perfil.
export interface ProfileUpdateDTO {
  name: string
  username: string
  email: string
  walletAlias: string
  ensName: string
  avatar: string
}

// Limita a alteração de senha aos dados necessários para validá-la.
export interface PasswordUpdateDTO {
  currentPassword: string
  newPassword: string
}

// Permite criar uma carteira sem ID ou atualizar uma carteira existente.
export interface WalletInputDTO extends Omit<Wallet, 'id'> {
  id?: string
}

// Reutiliza a entidade pública como formato de leitura do perfil.
export type ProfileDTO = User
