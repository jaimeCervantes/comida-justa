import type IOutreachProductCatalog from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import type IOutreachTextRepository from "~/use_cases/outreach/ports/IOutreachTextRepository";
import PostgresOutreachProductCatalog from "./PostgresOutreachProductCatalog";
import PostgresOutreachTextRepository from "./PostgresOutreachTextRepository";

let texts: IOutreachTextRepository | null = null;
let catalog: IOutreachProductCatalog | null = null;

export function createOutreachTextRepository(): IOutreachTextRepository {
  texts ??= new PostgresOutreachTextRepository();
  return texts;
}

export function createOutreachProductCatalog(): IOutreachProductCatalog {
  catalog ??= new PostgresOutreachProductCatalog();
  return catalog;
}
