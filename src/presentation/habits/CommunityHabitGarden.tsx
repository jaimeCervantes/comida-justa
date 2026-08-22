import { getTranslations } from "next-intl/server";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { Heading } from "~/presentation/design_system/typography/Heading";
import type { CommunitySectionVariant } from "./communitySectionVariant";

/**
 * `full` cuenta el jardín (título, relato y nota de privacidad); `compact` solo enseña el dato:
 * los cuatro canteros con su número. La variante corta existe para poder poner el jardín al lado
 * de otra sección en una fila de dos columnas, donde el relato lo repetiría el bloque vecino.
 */
export default async function CommunityHabitGarden({
  garden,
  variant = "full",
}: {
  garden: CommunityGarden;
  variant?: CommunitySectionVariant;
}): Promise<React.ReactNode> {
  const t = await getTranslations("habitCommunity");
  const compact = variant === "compact";
  const plots = [
    { key: "sleep", count: garden.sleep, color: "bg-pillar-sleep-solid" },
    {
      key: "nutrition",
      count: garden.nutrition,
      color: "bg-pillar-nutrition-solid",
    },
    {
      key: "movement",
      count: garden.movement,
      color: "bg-pillar-movement-solid",
    },
    {
      key: "mind",
      count: garden.mind,
      color: "bg-pillar-mind-spirit-solid",
    },
  ] as const;

  return (
    <section
      data-testid="community-habit-garden"
      data-variant={variant}
      className={`@container rounded-panel border border-separator bg-surface-elevation-1 ${
        compact ? "p-4" : "mt-6 p-4"
      }`}
    >
      {/* Sin título grande, el eyebrow es quien nombra la sección: si fuera un `<p>` el jardín se
          quedaría sin encabezado accesible dentro de la fila. */}
      {compact ? (
        <Heading
          level={2}
          size="eyebrow"
          tone="inherit"
          className="text-pw-green"
        >
          {t("eyebrow")}
        </Heading>
      ) : (
        <>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-pw-green">
            {t("eyebrow")}
          </p>
          <Heading level={2} tone="inherit" className="mt-1 text-text-strong">
            {t("title")}
          </Heading>
          <p className="mt-2 max-w-3xl text-body">
            {t("body", { total: garden.total })}
          </p>
        </>
      )}
      {/* Las columnas se deciden por el ancho del propio jardín, no por el de la ventana: el mismo
          componente vive a todo lo ancho en pilares y en media columna en el home. */}
      <div className="mt-5 grid grid-cols-2 gap-3 @xl:grid-cols-4">
        {plots.map((plot) => (
          <div
            key={plot.key}
            data-pillar={plot.key}
            className="rounded-card bg-surface-elevation-1"
          >
            <span
              aria-hidden="true"
              className={`block h-2 rounded-full ${plot.color}`}
            />
            <strong className="mt-3 block text-2xl text-text-strong">
              {plot.count}
            </strong>
            <span className="text-sm text-body">{t(plot.key)}</span>
          </div>
        ))}
      </div>
      {compact ? null : (
        <p className="mt-5 text-sm text-body">{t("privacy")}</p>
      )}
      {/* <p className="mt-2 rounded-control bg-surface-elevation-2 p-3 text-sm text-body">
        {t("groupsUnavailable")}
      </p> */}
    </section>
  );
}
