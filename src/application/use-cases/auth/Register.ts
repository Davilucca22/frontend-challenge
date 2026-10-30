import type { User } from '../../../domain/entities/User'
import type { AuthRepository } from '../../../domain/repositories/AuthRepository'

export class Register {
  constructor(private readonly repository: AuthRepository) {}

  execute(name: string, username: string, email: string, password: string): Promise<User> {
    if (!name.trim() || !username.trim() || !email.includes('@') || password.length < 8) {
      return Promise.reject(new Error('Confira os campos. A senha deve ter ao menos 8 caracteres.'))
    }
    return this.repository.register(name, username, email, password)
  }
}
