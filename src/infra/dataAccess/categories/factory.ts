import type ICategoryTaxonomyRepository from "~/use_cases/catalog/ports/ICategoryTaxonomyRepository";
import PostgresCategoryTaxonomyRepository from "./PostgresCategoryTaxonomyRepository";

let instance: ICategoryTaxonomyRepository | null = null;

export function createCategoryTaxonomyRepository(): ICategoryTaxonomyRepository {
  if (instance) return instance;
  instance = new PostgresCategoryTaxonomyRepository();
  return instance;
}
