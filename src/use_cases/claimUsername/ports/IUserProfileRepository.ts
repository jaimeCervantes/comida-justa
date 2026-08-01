import type { UserProfile } from "~/domain/entities/user/types";

export default interface IUserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  /** Quién ocupa esa dirección. Protege el índice único `ix_users_username`. */
  findByUsername(username: string): Promise<UserProfile | null>;
  saveUsername(userId: string, username: string): Promise<UserProfile>;
}
