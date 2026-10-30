import type { User } from '../../../domain/entities/User'
import type { AuthRepository } from '../../../domain/repositories/AuthRepository'

export class Login {
  constructor(private readonly repository: AuthRepository) {}

  execute(email: string, password: string): Promise<User> {
    if (!email.includes('@') || password.length < 6) {
      return Promise.reject(new Error('Informe um e-mail e uma senha válidos.'))
    }
    return this.repository.login(email, password)
  }
}
