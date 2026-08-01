import { PostgresSellerRepository } from "./PostgresSellerRepository";

let instance: PostgresSellerRepository | null = null;

export function createSellerRepository(): PostgresSellerRepository {
  if (instance) return instance;
  instance = new PostgresSellerRepository();
  return instance;
}
