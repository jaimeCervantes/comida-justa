export default function AmountCurrency({
  value,
  locale, // when undefined use the locale of the environment
  currency = "MXN",
  className,
}: {
  value: number;
  locale?: string;
  currency?: string;
  className?: string;
}) {
  const clsName = `font-bold text-pw-lightgreen ${className ?? ""}`.trim();

  // inic modi
  if (Boolean(value) === false){
    return null;
  }
// fin modi
  return (
    <span className={clsName}>
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
      }).format(Number(value))}
    </span>
  );
}
