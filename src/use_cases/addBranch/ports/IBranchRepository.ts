import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { Branch } from "~/domain/entities/seller/types";

export interface NewBranch {
  sellerId: string;
  name: string;
  address: string;
  mapUrl: string;
  coordinates: Coordinates;
}

export default interface IBranchRepository {
  listBySeller(sellerId: string): Promise<Branch[]>;
  save(branch: NewBranch): Promise<Branch>;
}
