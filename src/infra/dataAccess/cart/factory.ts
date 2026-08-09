import { PostgresCartProductRepository } from "./PostgresCartProductRepository";

let instance: PostgresCartProductRepository | null = null;

export function createCartProductRepository(): PostgresCartProductRepository {
  if (instance) return instance;
  instance = new PostgresCartProductRepository();
  return instance;
}
