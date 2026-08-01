import { PostgresBranchRepository } from "./PostgresBranchRepository";

let instance: PostgresBranchRepository | null = null;

export function createBranchRepository(): PostgresBranchRepository {
  if (instance) return instance;
  instance = new PostgresBranchRepository();
  return instance;
}
