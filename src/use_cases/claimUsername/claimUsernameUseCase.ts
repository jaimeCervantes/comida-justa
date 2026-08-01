import {
  UsernameAlreadySetError,
  UsernameTakenError,
  UserValidationError,
} from "~/domain/entities/user/errors";
import type { UserProfile } from "~/domain/entities/user/types";
import { resolveUsername } from "~/domain/entities/user/username";
import type IUserProfileRepository from "./ports/IUserProfileRepository";

export interface ClaimUsernameInput {
  userId: string;
  /** Lo que la persona escribió; se normaliza igual que el nombre de una tienda. */
  requested: string;
}

export type ClaimUsernameResult =
  | { profile: UserProfile; errorMessage?: undefined }
  | { profile?: undefined; errorMessage: string };

/**
 * Reserva la dirección personal de una cuenta (`/u/<username>`).
 *
 * Se reclama **una sola vez**: cambiarla rompería los enlaces que la persona ya repartió, y
 * sostener el anterior con una redirección es trabajo aparte. Igual que en el alta de vendedor,
 * lo esperado vuelve como mensaje y lo inesperado se propaga.
 */
export default class ClaimUsernameUseCase {
  constructor(private readonly userRepository: IUserProfileRepository) {}

  async execute({
    userId,
    requested,
  }: ClaimUsernameInput): Promise<ClaimUsernameResult> {
    try {
      const profile = await this.claim(userId, requested);

      return { profile };
    } catch (error) {
      if (error instanceof UserValidationError) {
        return { errorMessage: error.message };
      }

      throw error;
    }
  }

  private async claim(userId: string, requested: string): Promise<UserProfile> {
    const current = await this.userRepository.findByUserId(userId);

    if (current?.username) {
      throw new UsernameAlreadySetError(current.username);
    }

    const username = resolveUsername(requested);
    const owner = await this.userRepository.findByUsername(username);

    if (owner) {
      throw new UsernameTakenError(username);
    }

    return this.userRepository.saveUsername(userId, username);
  }
}
