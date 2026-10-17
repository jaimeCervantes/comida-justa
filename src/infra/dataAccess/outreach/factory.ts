import type IOutreachChannelRepository from "~/use_cases/outreach/ports/IOutreachChannelRepository";
import type IOutreachFooterRepository from "~/use_cases/outreach/ports/IOutreachFooterRepository";
import type IOutreachProductFinder from "~/use_cases/outreach/ports/IOutreachProductFinder";
import type IOutreachPublicationRepository from "~/use_cases/outreach/ports/IOutreachPublicationRepository";
import type IOutreachTextRepository from "~/use_cases/outreach/ports/IOutreachTextRepository";
import PostgresOutreachChannelRepository from "./PostgresOutreachChannelRepository";
import PostgresOutreachFooterRepository from "./PostgresOutreachFooterRepository";
import PostgresOutreachProductFinder from "./PostgresOutreachProductFinder";
import PostgresOutreachPublicationRepository from "./PostgresOutreachPublicationRepository";
import PostgresOutreachTextRepository from "./PostgresOutreachTextRepository";

let texts: IOutreachTextRepository | null = null;
let channels: IOutreachChannelRepository | null = null;
let publications: IOutreachPublicationRepository | null = null;
let footers: IOutreachFooterRepository | null = null;
let productFinder: IOutreachProductFinder | null = null;

export function createOutreachTextRepository(): IOutreachTextRepository {
  texts ??= new PostgresOutreachTextRepository();
  return texts;
}

export function createOutreachChannelRepository(): IOutreachChannelRepository {
  channels ??= new PostgresOutreachChannelRepository();
  return channels;
}

export function createOutreachPublicationRepository(): IOutreachPublicationRepository {
  publications ??= new PostgresOutreachPublicationRepository();
  return publications;
}

export function createOutreachFooterRepository(): IOutreachFooterRepository {
  footers ??= new PostgresOutreachFooterRepository();
  return footers;
}

export function createOutreachProductFinder(): IOutreachProductFinder {
  productFinder ??= new PostgresOutreachProductFinder();
  return productFinder;
}
