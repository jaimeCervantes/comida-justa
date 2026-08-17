import { PostgresRouteRepository } from "./PostgresRouteRepository";

let instance: PostgresRouteRepository | null = null;

export function createRouteRepository(): PostgresRouteRepository {
  if (instance) return instance;
  instance = new PostgresRouteRepository();
  return instance;
}
