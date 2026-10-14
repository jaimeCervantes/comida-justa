import { getLocale, getTranslations } from "next-intl/server";
import type { AppRedirectHref } from "~/i18n/navigation";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import DeleteOutreachRecordUseCase, {
  type DeletableOutreachRecords,
} from "~/use_cases/outreach/deleteOutreachRecordUseCase";
import type { DeleteState } from "./ui/ConfirmDelete";

interface DeleteTarget {
  /** La lista a la que se vuelve: lo borrado ya no tiene página. */
  backTo: AppRedirectHref;
  /** Qué se dice si ya no existía: cada cosa se nombra a sí misma. */
  gone: "notFound" | "groupNotFound" | "footerNotFound";
}

/**
 * Lo que comparten las tres acciones de borrar: el gate de admin, el caso de uso y volver a la
 * lista. Sin directiva a propósito: no es una acción, la usan las de cada pantalla, que sí la llevan.
 */
export async function deleteOutreachRecord(
  records: DeletableOutreachRecords,
  formData: FormData,
  { backTo, gone }: DeleteTarget,
): Promise<DeleteState> {
  const t = await getTranslations("outreach");
  const session = await auth();

  // El gate es el mismo que el de la página: una Server Action se puede invocar directamente.
  if (!isAdmin(session?.user?.email)) return { error: t("noPermission") };

  const id = formData.get("id");
  const result = await new DeleteOutreachRecordUseCase(records).execute(
    typeof id === "string" ? id : "",
  );

  if (result.status === "not-found") return { error: t(gone) };

  redirectKeepingLocale(backTo, resolveLocale(await getLocale()));
}
