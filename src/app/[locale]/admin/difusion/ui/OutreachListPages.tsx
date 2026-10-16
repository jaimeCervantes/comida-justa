import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import QueryPagination from "~/presentation/navigation/QueryPagination/QueryPagination";
import { OUTREACH_LIST_PAGE_SIZE } from "~/use_cases/outreach/listOutreachChannelsUseCase";
import {
  type OutreachListPathname,
  outreachListHref,
} from "./outreachListHref";

/**
 * Lo que va debajo de una lista de la difusión: «Anteriores / Siguientes» si hay más de una página.
 * La búsqueda viaja en cada enlace, así que cambiar de página no la pierde.
 */
export async function OutreachListPagination({
  pathname,
  term,
  page,
  total,
  testId,
}: {
  pathname: OutreachListPathname;
  term: string;
  page: number;
  total: number;
  testId: string;
}) {
  const t = await getTranslations("outreach");
  const lastPage = Math.max(1, Math.ceil(total / OUTREACH_LIST_PAGE_SIZE));

  return (
    <QueryPagination
      page={page}
      total={total}
      pageSize={OUTREACH_LIST_PAGE_SIZE}
      hrefForPage={(next) => outreachListHref(pathname, { term, page: next })}
      labels={{
        previous: t("listPrevious"),
        next: t("listNext"),
        position: t("listPageOf", { page, total: lastPage }),
      }}
      testId={testId}
    />
  );
}

/**
 * Nada coincide con lo buscado. No es lo mismo que una lista vacía —eso se arregla dando de alta,
 * esto borrando la búsqueda—, y decir lo segundo haría creer que se perdieron los datos.
 */
export function OutreachNothingFound({
  pathname,
  message,
  clearLabel,
  testId,
}: {
  pathname: OutreachListPathname;
  message: string;
  clearLabel: string;
  testId: string;
}) {
  return (
    <p data-testid={testId} className="text-text-support">
      {message}{" "}
      <Link
        href={outreachListHref(pathname, { term: "", page: 1 })}
        className="font-semibold text-highlight hover:underline"
      >
        {clearLabel}
      </Link>
    </p>
  );
}
