"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import {
  FaFacebookF,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { MdCheck, MdContentCopy, MdEmail, MdShare } from "react-icons/md";
import {
  SHARE_NETWORKS,
  type ShareNetwork,
  shareTargetLink,
} from "~/domain/sharing/shareTargets";
import { Button } from "~/presentation/design_system/buttons/Button";
import {
  MENU_CONTENT_CLASS,
  MENU_ITEM_CLASS,
  MENU_SEPARATOR_CLASS,
} from "~/presentation/design_system/styling/menuSurface";

/** Cuánto se queda en pantalla la confirmación de copiado. */
const FEEDBACK_MS = 2500;

const ICONS: Record<ShareNetwork, ReactNode> = {
  whatsapp: <FaWhatsapp aria-hidden size="18" />,
  facebook: <FaFacebookF aria-hidden size="18" />,
  x: <FaXTwitter aria-hidden size="18" />,
  telegram: <FaTelegram aria-hidden size="18" />,
  email: <MdEmail aria-hidden size="18" />,
};

export interface ShareMenuProps {
  /** La dirección **absoluta**. Una relativa no resuelve fuera del sitio. */
  url: string;
  /** El nombre de lo que se comparte: lo que la hoja nativa enseña como título. */
  title: string;
  /** El mensaje que acompaña al enlace, ya traducido. */
  text: string;
  /**
   * `button` lleva la palabra «Compartir»; `icon` es solo el icono.
   *
   * `icon` existe para las tarjetas de un listado: doce botones con texto compiten con el título de
   * cada publicación, que es lo que se viene a leer. En una ficha o en una cabecera de tienda, en
   * cambio, compartir es una acción principal y se nombra.
   */
  variant?: "button" | "icon";
  testId?: string;
  className?: string;
}

type Feedback = "copied" | "failed" | null;

/**
 * El botón de compartir del sitio: hoja nativa donde exista, y si no, los destinos uno a uno.
 *
 * **La hoja nativa va primero, no como respaldo.** `navigator.share` solo existe donde de verdad se
 * comparte —el móvil— y ofrece más destinos que cualquier lista propia: es la ÚNICA vía a Instagram
 * y a TikTok, que no tienen dirección de compartir web. Cuando no existe se despliega el menú, que
 * es el caso del escritorio.
 *
 * Ese reparto se decide **después de montar** y no durante el render: `navigator` no existe en el
 * servidor, así que consultarlo en el primer render daría un HTML distinto al del cliente y React
 * descartaría el árbol entero al hidratar. Por eso el estado arranca en "no hay hoja nativa", que
 * es además el que funciona en todas partes.
 */
export default function ShareMenu({
  url,
  title,
  text,
  variant = "button",
  testId = "share-menu",
  className,
}: ShareMenuProps) {
  const t = useTranslations("share");
  const [canShareNatively, setCanShareNatively] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setCanShareNatively(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  const shareNatively = async (): Promise<void> => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* Cerrar la hoja rechaza con `AbortError`. No es un fallo que haya que contarle a nadie: es
         alguien que se arrepintió. Sin capturarlo queda un rechazo sin manejar en la consola. */
    }
  };

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("copied");
    } catch {
      // Sin contexto seguro `writeText` rechaza. La dirección está escrita justo encima, así que
      // se puede seleccionar a mano: decirlo es mejor que un botón que aparenta no hacer nada.
      setFeedback("failed");
    }
  };

  /* El mismo botón en los dos caminos: con hoja nativa dispara `navigator.share`, y sin ella es el
     disparador del desplegable. Se comparten las props para que no se separen visualmente.

     En `icon` el nombre accesible pasa al `aria-label`: sin él, el botón se anunciaría como
     "botón" a secas. Es el mismo texto, no uno acortado — lo que cambia es que no ocupa ancho. */
  const isIcon = variant === "icon";
  const triggerProps = isIcon
    ? ({
        color: "white",
        size: "sm",
        "aria-label": t("trigger"),
        title: t("trigger"),
        "data-testid": `${testId}-trigger`,
        className:
          "rounded-full bg-transparent text-text-support hover:bg-surface-elevation-2 hover:text-pw-green",
        children: <MdShare aria-hidden size="18" />,
      } as const)
    : ({
        color: "green",
        size: "sm",
        startIcon: <MdShare aria-hidden size="18" />,
        "data-testid": `${testId}-trigger`,
        children: t("trigger"),
      } as const);

  return (
    <div className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      {canShareNatively ? (
        <Button {...triggerProps} onClick={shareNatively} />
      ) : (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button {...triggerProps} />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              /* El icono vive pegado al borde derecho de una tarjeta; abriendo desde `start` el
                 panel se saldría de ella. Con texto, el botón está a la izquierda de su bloque. */
              align={isIcon ? "end" : "start"}
              sideOffset={8}
              aria-label={t("menuLabel")}
              className={MENU_CONTENT_CLASS}
              data-testid={`${testId}-content`}
            >
              {SHARE_NETWORKS.map((network) => (
                <DropdownMenu.Item key={network} asChild>
                  <a
                    href={shareTargetLink(network, { url, text })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${MENU_ITEM_CLASS} flex items-center gap-3`}
                    data-testid={`share-${network}`}
                  >
                    {ICONS[network]}
                    {t(network)}
                  </a>
                </DropdownMenu.Item>
              ))}

              <DropdownMenu.Separator className={MENU_SEPARATOR_CLASS} />

              <DropdownMenu.Item
                onSelect={copyLink}
                className={`${MENU_ITEM_CLASS} flex items-center gap-3`}
                data-testid="share-copy"
              >
                <MdContentCopy aria-hidden size="18" />
                {t("copyLink")}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      {/* Fuera del menú a propósito: elegir "Copiar enlace" lo cierra, y dentro la confirmación se
          desmontaría en el mismo gesto que la provoca. `role="status"` la anuncia sin robar el
          foco, que sigue en el botón. */}
      {feedback ? (
        <span
          role="status"
          data-testid="share-feedback"
          className={`flex items-center gap-1 text-sm ${
            feedback === "copied" ? "text-pw-green" : "text-brand-clay-700"
          }`}
        >
          {feedback === "copied" ? <MdCheck aria-hidden size="16" /> : null}
          {feedback === "copied" ? t("copied") : t("copyFailed")}
        </span>
      ) : null}
    </div>
  );
}
