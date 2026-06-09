export interface PostUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
}

export interface IUserRepository {
  getUsersByIds(ids: string[]): Promise<Map<string, PostUser>>;
}
