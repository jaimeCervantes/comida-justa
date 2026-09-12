import { cva } from "class-variance-authority";

/**
 * Las clases del botón, **fuera del módulo del componente y sin `"use client"`**.
 *
 * Vivían dentro de `Button.tsx`, que es un Client Component. Exportarlas desde ahí las convierte en
 * una función de cliente, y un Server Component que la llame revienta en tiempo de ejecución con
 * «Attempted to call buttonVariants() from the server». Ni `tsc` ni `next build` lo ven —el error
 * aparece al pedir la página—, así que el módulo se separa: aquí no hay directiva, y las pueden
 * pedir los dos lados.
 *
 * Existen aparte del componente para que un **enlace** pueda vestirse de botón sin copiar sus
 * clases. Un CTA que navega tiene que ser un `<a>`: se abre en pestaña nueva, se copia su dirección
 * y un rastreador lo sigue. `LinkButton` no sirve para eso —empuja con `router.push` desde un
 * `<button>`—, así que la alternativa era escribir el relleno y el radio a mano en cada portada,
 * que es exactamente la deuda que este primitivo existe para no tener.
 */
export const buttonVariants = cva(
  // `whitespace-nowrap` no es cosmético: sin él, un botón que se queda sin ancho —por ejemplo
  // cuando el hermano de al lado crece al mostrar su loader— parte la etiqueta en dos renglones
  // y el botón crece de alto, rompiendo la altura fija del header.
  // `focus-ring` es el anillo del sistema (`tokens/focus.css`). El botón no tenía **ninguno**: al
  // navegar con teclado no había forma de saber dónde estabas.
  // `rounded-control` es la escala con nombre del slice 10: el botón deja de elegir un número.
  "focus-ring relative rounded-control inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      /**
       * Cada color pide su **par** —relleno y el texto que le toca—, no un hex de marca.
       *
       * El slice 10 arregló el token: `--brand-green` dejó de ser la semilla del logo (3.92 con
       * blanco) y pasó al relleno que sí cumple. Pero mientras aquí pusiera `bg-pw-green
       * text-white`, este componente seguía eligiendo el texto por su cuenta, y en oscuro eso se
       * rompe: ahí el relleno se aclara a `#6ba34a` y lo que va encima es tinta oscura, no blanco.
       *
       * Pidiendo el par, el tema mueve las dos variables a la vez y el botón no se entera.
       * `brandPalette.contrast.test.ts` mide justamente esas parejas en los dos temas.
       */
      color: {
        green:
          "bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover",
        orange:
          "bg-button-buy-bg text-button-buy-text hover:bg-button-buy-hover",
        black: "bg-pw-black text-pw-white hover:bg-pw-black/90",
        white:
          "bg-surface-elevation-1 text-text-base hover:bg-surface-elevation-2",
        default:
          "bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover",
      },
      /**
       * La altura mínima va declarada y no se deja al relleno.
       *
       * 44px es el objetivo táctil con el que un pulgar acierta, y `md` —el tamaño por omisión— lo
       * cumple con margen. `xs` y `sm` existen para barras densas de escritorio; declaran su altura
       * igual, para que se vea de un vistazo que no llegan y nadie los ponga en un teléfono
       * creyendo que sí.
       */
      size: {
        xs: "min-h-8 px-3 py-1.5 text-xs",
        sm: "min-h-10 px-4 py-2 text-sm",
        md: "min-h-12 px-5 py-3 text-base",
        lg: "min-h-14 px-6 py-4 text-base",
        xl: "min-h-16 px-7 py-5 text-base",
      },
      /**
       * Solo el icono, en cuadrado.
       *
       * Existe para los listados: la tarjeta de una publicación llevaba tres acciones con texto
       * —«Añadir al carrito» sola ocupa 172 px— y cada una caía en su propio renglón, así que las
       * acciones se llevaban la mitad del alto de la tarjeta compitiendo con la foto y el título,
       * que es lo que se viene a mirar. En una columna de 226 px no hay sitio para eso.
       *
       * **El relleno horizontal se va, el alto no.** Es lo que vuelve el botón cuadrado sin tocar
       * su objetivo táctil: `md` sigue siendo 48px de lado, que es con lo que un pulgar acierta.
       *
       * **Quien lo use TIENE que pasar `aria-label`.** Un botón sin texto y sin etiqueta se
       * anuncia como «botón» y deja de existir para quien navega escuchando. El nombre no se pone
       * aquí porque el design system no puede leer el catálogo (ver `loadingLabel`).
       */
      iconOnly: {
        true: "px-0 py-0 shrink-0",
        false: "",
      },
    },
    compoundVariants: [
      /* El lado sigue al tamaño: sin esto, quitar el relleno dejaría un botón tan ancho como su
         icono —16 px— y el objetivo táctil se perdería aunque el alto se conservara. */
      { iconOnly: true, size: "xs", class: "w-8" },
      { iconOnly: true, size: "sm", class: "w-10" },
      { iconOnly: true, size: "md", class: "w-12" },
      { iconOnly: true, size: "lg", class: "w-14" },
      { iconOnly: true, size: "xl", class: "w-16" },
    ],
    defaultVariants: {
      color: "default",
      size: "md",
      iconOnly: false,
    },
  },
);
