import { getTranslations } from "next-intl/server";
import {
  INVENTORY_SCOPES,
  type InventoryScope,
} from "~/domain/entities/post/inventoryScope";
import { Link } from "~/i18n/navigation";
import { type InventoryParams, inventoryHref } from "./inventoryHref";

const ACTIVE =
  "focus-ring rounded-full bg-pw-green px-3 py-1 text-label text-white";
const IDLE =
  "focus-ring rounded-full border border-separator px-3 py-1 text-label text-text-support";

/**
 * Las claves del catálogo, una por ámbito.
 *
 * `Record` cerrado y no `t(\`inventoryScope.${scope}\`)`: una clave compuesta en tiempo de ejecución
 * no se encuentra con grep, y sumar un ámbito tiene que romper el `typecheck`.
 */
const LABEL_KEYS = {
  all: "inventoryScopeAll",
  out: "inventoryScopeOut",
  untracked: "inventoryScopeUntracked",
} as const satisfies Record<InventoryScope, string>;

/**
 * Las tres preguntas que se le hacen al inventario, como filtros.
 *
 * Mismas píldoras que el filtro de estado de `/pedidos`: es el mismo gesto sobre la misma clase de
 * lista, y dos formas distintas de filtrar dentro de la misma sección de la cuenta se leerían como
 * dos pantallas de sitios distintos.
 */
export default async function InventoryScopes({
  current,
}: {
  current: InventoryParams;
}) {
  const t = await getTranslations("account");

  return (
    <div className="mb-6 flex flex-wrap gap-2" data-testid="inventory-scopes">
      {INVENTORY_SCOPES.map((scope) => (
        <Link
          key={scope}
          href={inventoryHref(current, { scope })}
          data-testid={`inventory-scope-${scope}`}
          aria-current={current.scope === scope ? "page" : undefined}
          className={current.scope === scope ? ACTIVE : IDLE}
        >
          {t(LABEL_KEYS[scope])}
        </Link>
      ))}
    </div>
  );
}
