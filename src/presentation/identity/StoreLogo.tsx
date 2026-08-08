import Image from "next/image";

/**
 * La cara de una tienda, en pequeño y junto a su nombre.
 *
 * **Es decorativa a propósito.** Va siempre acompañada del nombre escrito, así que describirla
 * haría que un lector de pantalla dijera "Hazlo Sano" dos veces seguidas. Por eso `alt=""` y
 * `aria-hidden`: quien no la ve no se pierde nada, porque el nombre está al lado.
 *
 * Cuando la tienda no subió logo cae a su inicial, que no es adorno: mantiene la fila a la misma
 * altura, y una fila que cambia de alto según haya imagen o no se lee como dos diseños distintos.
 */
export default function StoreLogo({
  logoUrl,
  name,
  size = 28,
  testId,
}: {
  logoUrl?: string | null;
  /** Solo para la inicial de respaldo: nunca se anuncia, ver arriba. */
  name: string;
  size?: number;
  testId?: string;
}) {
  const common = "shrink-0 rounded-full object-cover";

  return (
    <span aria-hidden="true" data-testid={testId} className="inline-flex">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={size}
          height={size}
          className={common}
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className={`${common} inline-flex items-center justify-center bg-surface-elevation-2 text-label font-medium text-text-support`}
          style={{ width: size, height: size }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
