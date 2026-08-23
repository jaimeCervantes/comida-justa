import { cn } from "../styling/merge-class-names";
import { FieldHelper } from "./FieldHelper";

export interface SegmentedOption {
  value: string;
  label: string;
  /** Para localizar el control en las pruebas sin depender del idioma del rótulo. */
  testId?: string;
}

/**
 * Elegir una de pocas opciones **viéndolas todas**, en píldoras.
 *
 * Es lo que dibuja el 5.3 para «¿qué publicas?». Un `<select>` esconde las opciones detrás de un
 * clic y con cuatro no hay nada que esconder: la primera decisión del formulario —la que además
 * decide qué campos aparecen después— merece verse entera sin desplegar nada.
 *
 * **Por dentro son radios de verdad, no botones.** Un grupo de `<button>` con `aria-pressed` habría
 * quedado igual y habría perdido tres cosas que aquí vienen gratis: las flechas del teclado navegan
 * entre opciones, el `<fieldset>`/`<legend>` hace que un lector de pantalla anuncie «¿qué publicas?,
 * 2 de 4» al llegar, y el valor viaja en el `FormData` sin que nadie lo copie a un campo oculto.
 * El radio se esconde con `sr-only` —no con `display:none`, que lo sacaría del árbol de
 * accesibilidad y del foco— y la píldora se pinta con `peer-checked`.
 *
 * Vive en el design system y no en `/publicar` porque la forma «elige una de pocas» aparecerá otra
 * vez: el filtro de tipo del buscador es exactamente esto.
 */
export function SegmentedField({
  name,
  label,
  options,
  value,
  onChange,
  hint,
  containerClassName,
}: {
  name: string;
  label: string;
  options: readonly SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  containerClassName?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col border-0 p-0", containerClassName)}>
      {/* Mismas clases que `FieldLabel`: es el rótulo de un campo, y que sea una `<legend>` es un
          detalle del marcado, no una razón para que se vea distinto. */}
      <legend className="mb-1.5 block text-sm font-medium text-text-base">
        {label}
      </legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            data-testid={option.testId}
            data-selected={option.value === value ? "true" : "false"}
            className="cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex items-center rounded-chip border px-4 py-2 text-label transition-colors",
                /* Sin marcar: el mismo hueco y el mismo borde que el resto de controles. */
                "border-separator bg-surface-elevation-1 text-text-base",
                /* Marcada: el relleno del botón primario, que es el par ya medido del sistema. */
                "peer-checked:border-transparent peer-checked:bg-button-primary-bg peer-checked:font-semibold peer-checked:text-button-primary-text",
                /* El anillo va aquí y no en el radio: el radio no se ve, así que sin esto navegar
                   con el teclado sería avanzar a ciegas. Se escribe a mano en vez de usar la
                   utilidad `focus-ring` porque aquélla está atada a `&:focus-visible` del propio
                   elemento, y aquí quien recibe el foco es el hermano. Los valores son los mismos
                   tokens. */
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus-ring)",
                "hover:border-text-support peer-checked:hover:border-transparent",
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <FieldHelper>{hint}</FieldHelper>
    </fieldset>
  );
}
