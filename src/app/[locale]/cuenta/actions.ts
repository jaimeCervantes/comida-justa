"use server";
import { getLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import {
  createOrphanPostRepository,
  createSellerRepository,
} from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import { GoogleMapsUrlResolver } from "~/infra/services/GoogleMapsUrlResolver";
import AddBranchUseCase from "~/use_cases/addBranch/addBranchUseCase";
import BecomeSellerUseCase from "~/use_cases/becomeSeller/becomeSellerUseCase";
import ClaimUsernameUseCase from "~/use_cases/claimUsername/claimUsernameUseCase";
import UpdateSellerProfileUseCase from "~/use_cases/updateSellerProfile/updateSellerProfileUseCase";
import { profileHref } from "./profilePath";
import { storeHref } from "./storePath";

export type BecomeSellerState = {
  errorMessage?: string;
  handle?: string;
};

export type AddBranchState = {
  errorMessage?: string;
  branchName?: string;
};

export type ClaimUsernameState = {
  errorMessage?: string;
  username?: string;
};

export type StoreProfileState = {
  errorMessage?: string;
  saved?: boolean;
};

/**
 * Corrige la ficha de la tienda de quien está en sesión.
 *
 * La dirección (`slug`) no viaja en el formulario: el nombre visible cambia, la URL no.
 */
export async function updateStoreProfile(
  _prevState: StoreProfileState,
  formData: FormData,
): Promise<StoreProfileState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const useCase = new UpdateSellerProfileUseCase(createSellerRepository());
  const result = await useCase.execute({
    userId,
    draft: {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      description: String(formData.get("description") ?? ""),
      url: String(formData.get("url") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
    },
  });

  if (!result.seller) {
    return { errorMessage: result.errorMessage };
  }

  revalidateLocalizedPath("/cuenta");
  revalidateLocalizedPath(storeHref(result.seller.handle ?? ""));

  return { saved: true };
}

/** Reserva la dirección personal (`/u/<username>`) de quien está en sesión. */
export async function claimUsername(
  _prevState: ClaimUsernameState,
  formData: FormData,
): Promise<ClaimUsernameState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const useCase = new ClaimUsernameUseCase(createUserProfileRepository());
  const result = await useCase.execute({
    userId,
    requested: String(formData.get("username") ?? ""),
  });

  if (!result.profile?.username) {
    return { errorMessage: result.errorMessage };
  }

  revalidateLocalizedPath("/cuenta");
  revalidateLocalizedPath(profileHref(result.profile.username));

  return { username: result.profile.username };
}

/**
 * Da de alta una sucursal de la tienda de quien está en sesión.
 *
 * El `sellerId` NO viene del formulario: se resuelve del lado del servidor a partir de la sesión,
 * porque si viajara en un campo oculto cualquiera podría colgarle una sucursal a la tienda de otro.
 */
export async function addBranch(
  _prevState: AddBranchState,
  formData: FormData,
): Promise<AddBranchState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const seller = await createSellerRepository().findByUserId(userId);

  if (!seller) {
    return { errorMessage: "Primero abre tu tienda." };
  }

  const useCase = new AddBranchUseCase(
    createBranchRepository(),
    new GoogleMapsUrlResolver(),
  );

  const result = await useCase.execute({
    sellerId: seller.id,
    draft: {
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      mapUrl: String(formData.get("mapUrl") ?? ""),
      coordinates: readCoordinates(formData),
    },
  });

  if (!result.branch) {
    return { errorMessage: result.errorMessage };
  }

  revalidateLocalizedPath("/cuenta");
  revalidateLocalizedPath(storeHref(seller.handle ?? ""));

  return { branchName: result.branch.name };
}

/** Lo que deja el botón "usar mi ubicación actual"; ausente si el vendedor no lo tocó. */
function readCoordinates(formData: FormData): Coordinates | null {
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!latitude || !longitude) return null;

  return { latitude, longitude };
}

/**
 * Da de alta la tienda de quien está en sesión.
 *
 * Solo los fallos **esperados** (nombre ocupado, teléfono repetido, datos inválidos) vuelven al
 * formulario; un fallo de infraestructura se deja subir al `error.tsx`, porque reintentar el
 * formulario no lo arregla.
 */
export async function becomeSeller(
  _prevState: BecomeSellerState,
  formData: FormData,
): Promise<BecomeSellerState> {
  const session = await auth();

  if (!session) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const userId = (session.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
  }

  const useCase = new BecomeSellerUseCase(
    createSellerRepository(),
    createOrphanPostRepository(),
  );
  const result = await useCase.execute({
    userId,
    draft: {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      description: String(formData.get("description") ?? ""),
    },
  });

  if (!result.seller) {
    return { errorMessage: result.errorMessage };
  }

  const handle = result.seller.handle ?? "";

  revalidateLocalizedPath("/cuenta");
  revalidateLocalizedPath(storeHref(handle));

  return { handle };
}
