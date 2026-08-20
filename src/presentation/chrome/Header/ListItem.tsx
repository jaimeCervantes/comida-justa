import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import classNames from "classnames";
import type { ForwardedRef, ReactNode } from "react";
import React from "react";
import { type AppHref, Link } from "~/i18n/navigation";

export default React.forwardRef(function ListItem(
  {
    className,
    children,
    title,
    href,
    ...props
  }: { className?: string; children: ReactNode; href: AppHref; title: string },
  forwardedRef: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <li>
      <NavigationMenu.Link asChild>
        <Link
          /* Traía tres restos de la plantilla de Radix: un anillo de foco propio
             (`focus:shadow-violet7`), que es justo lo que el slice 7 unificó en `focus-ring`, un
             `hover:bg-mauve3` de la escala de Radix y un radio escrito a mano. */
          className={classNames(
            "focus-ring group hover:bg-surface-elevation-2 block select-none rounded-chip p-3 text-[15px] leading-none no-underline transition-colors",
            className,
          )}
          href={href}
          {...props}
          ref={forwardedRef}
        >
          <div className="text-text-base group-hover:text-highlight mb-[5px] font-medium leading-[1.2]">
            {title}
          </div>
          {/* La descripción **no** cambia de color al pasar el cursor: quien se mueve por el menú
              sigue el título, y teñir de verde las dos líneas convierte el realce en ruido. */}
          <p className="text-text-support leading-[1.4]">{children}</p>
        </Link>
      </NavigationMenu.Link>
    </li>
  );
});
