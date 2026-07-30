"use server";

import { updateTag } from "next/cache";
import {
  hasErrors,
  type NewCategoryErrors,
  validateNewCategory,
} from "~/domain/entities/post/newCategory";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import {
  CATEGORY_TAXONOMY_TAG,
  getCategoryTaxonomy,
} from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createCategoryTaxonomyRepository } from "~/infra/dataAccess/categories/factory";

export interface CatalogActionState {
  errors: NewCategoryErrors & { form?: string };
  created?: string;
}

/**
 * Sin esto, agregar una categoría no se vería hasta que expirara el TTL de una hora: quien la
 * acaba de crear entraría a `/publicar` y no la encontraría.
 *
 * `updateTag` y no `revalidateTag`: el primero está pensado para llamarse desde una Server Action
 * y garantiza *read-your-own-writes* —el mismo request ya ve el cambio—, mientras que el segundo
 * solo marca la entrada como vieja y en Next 16 exige además un perfil de caducidad.
 */
function refreshCatalog(): void {
  updateTag(CATEGORY_TAXONOMY_TAG);
}

/** El gate es el mismo que el de la página; una Server Action se puede invocar directamente. */
async function requireAdmin(): Promise<boolean> {
  const session = await auth();

  return isAdmin(session?.user?.email);
}

export async function createCategory(
  _state: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  if (!(await requireAdmin())) {
    return { errors: { form: "No tienes permiso para editar el catálogo." } };
  }

  const key = String(formData.get("key") ?? "");
  const parentRaw = String(formData.get("parentKey") ?? "");
  const input = {
    key,
    parentKey: parentRaw || null,
    labels: {
      es: String(formData.get("labelEs") ?? ""),
      en: String(formData.get("labelEn") ?? ""),
    },
  };

  const errors = validateNewCategory(await getCategoryTaxonomy(), input);

  if (hasErrors(errors)) return { errors };

  try {
    await createCategoryTaxonomyRepository().createCategory(input);
  } catch (error) {
    // La base tiene la última palabra: dos administradores a la vez pueden pasar la validación con
    // la misma clave y solo uno gana. Se traduce a un mensaje en vez de una pantalla de error.
    console.error("[catálogo] no se pudo crear la categoría", error);

    return {
      errors: {
        form: "No se pudo guardar. ¿Alguien creó esa clave mientras tanto?",
      },
    };
  }

  refreshCatalog();

  return { errors: {}, created: input.key.trim() };
}

export async function setCategoryActive(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const key = String(formData.get("key") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!key) return;

  await createCategoryTaxonomyRepository().setCategoryActive(key, isActive);
  refreshCatalog();
}
