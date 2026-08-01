import { useFormatter } from "next-intl";

/**
 * Un importe con su moneda.
 *
 * El idioma sale del formateador de next-intl y no de un `locale` recibido a mano: los dos sitios
 * que lo pintaban le pasaban `"es-MX"` fijo, así que el precio seguía escrito a la mexicana en la
 * versión en inglés. La **moneda** sí se recibe, y por omisión es MXN: lo que se vende aquí se
 * cobra en pesos, hable el idioma que hable quien mira.
 */
export default function AmountCurrency({
  value,
  currency = "MXN",
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const format = useFormatter();
  const clsName = `font-bold text-pw-lightgreen ${className ?? ""}`.trim();

  if (Boolean(value) === false) {
    return null;
  }

  return (
    <span className={clsName}>
      {format.number(Number(value), { style: "currency", currency })}
    </span>
  );
}
