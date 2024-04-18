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
  const clsName = `mb-4 font-bold text-pw-lightgreen ${className ?? ""}`.trim();

  return (
    <span className={clsName}>
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
      }).format(Number(value))}
    </span>
  );
}
