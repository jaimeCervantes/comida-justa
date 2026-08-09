import type { ReactNode } from "react";
import { FaWhatsapp } from "react-icons/fa";

/**
 * El botón que abre WhatsApp con el mensaje ya escrito.
 *
 * **Con `href` nulo no pinta nada.** La regla de "no ofrecer un enlace roto" vive aquí y no en
 * cada pantalla: quien lo usa pasa el resultado de `buildWhatsappOrderLink` tal cual, sin
 * repetir el condicional.
 */
export default function WhatsappButton({
  href,
  children,
  className,
  testId = "whatsapp-cta",
}: {
  href: string | null;
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-pw-green px-2 py-2 text-label text-white transition-colors hover:bg-pw-green/80 ${className || ""}`}
    >
      <FaWhatsapp size="20" aria-hidden />
      {children}
    </a>
  );
}
