import type IOutreachChannelRepository from "~/use_cases/outreach/ports/IOutreachChannelRepository";
import type IOutreachProductCatalog from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import type IOutreachPublicationRepository from "~/use_cases/outreach/ports/IOutreachPublicationRepository";
import type IOutreachTextRepository from "~/use_cases/outreach/ports/IOutreachTextRepository";
import PostgresOutreachChannelRepository from "./PostgresOutreachChannelRepository";
import PostgresOutreachProductCatalog from "./PostgresOutreachProductCatalog";
import PostgresOutreachPublicationRepository from "./PostgresOutreachPublicationRepository";
import PostgresOutreachTextRepository from "./PostgresOutreachTextRepository";

let texts: IOutreachTextRepository | null = null;
let catalog: IOutreachProductCatalog | null = null;
let channels: IOutreachChannelRepository | null = null;
let publications: IOutreachPublicationRepository | null = null;

export function createOutreachTextRepository(): IOutreachTextRepository {
  texts ??= new PostgresOutreachTextRepository();
  return texts;
}

export function createOutreachProductCatalog(): IOutreachProductCatalog {
  catalog ??= new PostgresOutreachProductCatalog();
  return catalog;
}

export function createOutreachChannelRepository(): IOutreachChannelRepository {
  channels ??= new PostgresOutreachChannelRepository();
  return channels;
}

export function createOutreachPublicationRepository(): IOutreachPublicationRepository {
  publications ??= new PostgresOutreachPublicationRepository();
  return publications;
}
