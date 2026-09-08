export interface PostUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  /** Dirección pública personal: `/u/<username>`. */
  username?: string;
}

export interface IUserRepository {
  getUsersByIds(ids: string[]): Promise<Map<string, PostUser>>;
}
