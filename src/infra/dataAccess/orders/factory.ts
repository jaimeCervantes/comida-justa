import { PostgresOrderRepository } from "./PostgresOrderRepository";

let instance: PostgresOrderRepository | null = null;

export function createOrderRepository(): PostgresOrderRepository {
  if (instance) return instance;
  instance = new PostgresOrderRepository();
  return instance;
}
