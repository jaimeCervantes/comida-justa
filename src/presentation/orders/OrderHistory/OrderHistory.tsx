"use client";
import { useFormatter, useTranslations } from "next-intl";
import {
  type Elapsed,
  elapsedBetween,
  type Order,
  type OrderStatusChange,
} from "~/domain/order/order";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/**
 * Por dónde pasó el pedido, con la hora de cada paso y lo que tardó en dar el siguiente.
 *
 * **Lo que se perdía antes.** El pedido del 10 de agosto se creó a las 01:58 y terminó a las 03:25;
 * de ahí sólo se podía deducir que tardó 1 h 27 min en total, porque cada transición pisaba el
 * `updated_at` de la anterior. Este bloque es lo que ninguna columna puede contestar: dónde se fue
 * ese tiempo.
 *
 * **El primer punto no sale del histórico**, sale de `createdAt`. El histórico guarda cambios, y
 * nacer no es un cambio: repetirlo como fila habría sido una copia de una columna que ya está.
 *
 * **Un pedido sin pasos lo dice.** Los anteriores a la migración no tienen recorrido y no se les
 * inventa uno: se enseña cuándo se hizo y se explica por qué no hay más.
 */
export default function OrderHistory({
  order,
  history,
}: {
  order: Pick<Order, "createdAt" | "status">;
  history: OrderStatusChange[];
}) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const at = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Surface
      as="section"
      radius="2xl"
      background="raised"
      border="subtle"
      className="mt-6 p-4"
      data-testid="order-history"
    >
      <h2 className="mb-3 text-body-lg font-bold">{t("historyHeading")}</h2>

      <ol className="flex flex-col gap-3">
        {/* Siempre hay al menos este: todo pedido nace Pendiente, y eso lo dice `createdAt`. */}
        <Step
          label={t("historyStep", {
            status: t("status.PENDING"),
            date: at(order.createdAt),
          })}
        />

        {history.map((change, index) => (
          <Step
            key={`${change.to}-${change.at.toISOString()}`}
            label={t("historyStep", {
              status: t(`status.${change.to}`),
              date: at(change.at),
            })}
            /* Lo que tardó desde el paso anterior; para el primero, desde que se hizo el pedido. */
            elapsed={elapsedBetween(
              index === 0 ? order.createdAt : history[index - 1].at,
              change.at,
            )}
          />
        ))}
      </ol>

      {history.length === 0 ? (
        <p
          className="mt-3 text-label text-text-support"
          data-testid="order-history-empty"
        >
          {t("historyEmpty")}
        </p>
      ) : null}
    </Surface>
  );
}

function Step({ label, elapsed }: { label: string; elapsed?: Elapsed }) {
  const t = useTranslations("orders");

  return (
    <li
      className="flex flex-wrap items-baseline gap-x-3"
      data-testid="order-history-step"
    >
      <span className="font-medium">{label}</span>
      {elapsed ? (
        <span className="text-label text-text-support">
          {describe(elapsed, t)}
        </span>
      ) : null}
    </li>
  );
}

/**
 * El hueco entre dos pasos, en palabras.
 *
 * El reparto en unidades ya lo hizo el dominio; aquí sólo se elige la frase. La rama de horas tiene
 * dos porque "1 h 0 min" no lo dice nadie.
 */
function describe(
  elapsed: Elapsed,
  t: ReturnType<typeof useTranslations<"orders">>,
): string {
  if (elapsed.unit === "days") return t("elapsedDays", { days: elapsed.days });

  if (elapsed.unit === "minutes")
    return t("elapsedMinutes", { minutes: elapsed.minutes });

  return elapsed.minutes === 0
    ? t("elapsedHours", { hours: elapsed.hours })
    : t("elapsedHoursMinutes", {
        hours: elapsed.hours,
        minutes: elapsed.minutes,
      });
}
