import type { CategoryLocale, CategoryTaxonomy } from "./taxonomy";

/** Lo que el formulario de `/admin/catalogo` manda para dar de alta una categoría. */
export interface NewCategoryInput {
  key: string;
  /** `null` crea una categoría raíz; una clave la cuelga de esa rama. */
  parentKey: string | null;
  labels: Partial<Record<CategoryLocale, string>>;
}

/** Un mensaje por campo con problema; vacío significa que se puede guardar. */
export interface NewCategoryErrors {
  key?: string;
  parentKey?: string;
  labelEs?: string;
}

/**
 * El mismo formato que impone el CHECK de la base: minúsculas, dígitos y guiones bajos interiores.
 */
const KEY_SHAPE = /^[a-z0-9]+(_[a-z0-9]+)*$/;

/**
 * Valida un alta antes de tocar la base.
 *
 * La base ya rechaza lo imposible —el formato de la clave, la profundidad de dos niveles, el padre
 * inexistente—, pero esos errores llegan al usuario como un 500 sin explicación. Aquí se nombran en
 * el idioma del problema, y **todos a la vez**: arreglar un formulario error por error es una forma
 * lenta de perder a quien lo está llenando.
 */
export function validateNewCategory(
  taxonomy: CategoryTaxonomy,
  input: NewCategoryInput,
): NewCategoryErrors {
  const errors: NewCategoryErrors = {};
  const key = input.key.trim();

  if (!key) {
    errors.key = "La clave es obligatoria.";
  } else if (!KEY_SHAPE.test(key)) {
    errors.key =
      "La clave va en minúsculas, sin acentos ni espacios; usa guion bajo para separar (ej. conservas_caseras).";
  } else if (taxonomy.nodes.has(key)) {
    // Se mira el catálogo entero, no solo lo activo: una clave inactiva sigue ocupada, y darla de
    // alta otra vez chocaría contra la clave primaria.
    errors.key = `La clave "${key}" ya existe en el catálogo.`;
  }

  if (input.parentKey) {
    const parent = taxonomy.nodes.get(input.parentKey);

    if (!parent) {
      errors.parentKey = `La categoría "${input.parentKey}" no existe.`;
    } else if (parent.parentKey !== null) {
      errors.parentKey =
        "El catálogo es de dos niveles: una sub-categoría no puede colgar de otra.";
    }
  }

  // El español es al que cae todo lo demás cuando falta una traducción; sin él la categoría se
  // vería por su clave. El inglés puede faltar.
  if (!input.labels.es?.trim()) {
    errors.labelEs = "La etiqueta en español es obligatoria.";
  }

  return errors;
}

export function hasErrors(errors: NewCategoryErrors): boolean {
  return Object.keys(errors).length > 0;
}
