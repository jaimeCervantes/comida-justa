import { areValidCoordinates, type Coordinates } from "./coordinates";

/**
 * Los pasos que dejan una tienda **encontrable**, en el orden en que se enseñan.
 *
 * El orden es fijo y no depende de cuáles estén cumplidos. Una lista que se reordena sola cada vez
 * que resuelves un paso obliga a releerla entera para saber dónde ibas; con el orden fijo, el que
 * ayer estaba tercero sigue tercero y solo cambia su marca.
 *
 * También es el orden de dependencia real: sin tienda no hay logo que subir ni sucursal que colgar,
 * así que `store` va primero y arrastra a los demás.
 */
export const ACCOUNT_SETUP_ORDER = [
  "store",
  "username",
  "logo",
  "description",
  "branchLocation",
] as const;

export type AccountSetupStepKey = (typeof ACCOUNT_SETUP_ORDER)[number];

/**
 * Lo que la página ya sabe de la cuenta.
 *
 * Son exactamente los datos que `/cuenta` lee para pintarse —el vendedor, el perfil y sus
 * sucursales—, así que calcular el avance no cuesta ni una consulta más. El día que un paso pida un
 * dato nuevo, este retrato lo dirá en su firma en vez de esconder una lectura dentro de la regla.
 */
export interface AccountSetupSnapshot {
  storeName: string | null;
  username: string | null;
  logoUrl: string | null;
  description: string | null;
  /** Una entrada por sucursal. `null` para la que se guardó sin coordenadas legibles. */
  branchCoordinates: readonly (Coordinates | null)[];
}

export interface AccountSetupStep {
  key: AccountSetupStepKey;
  done: boolean;
}

export interface AccountSetup {
  /** Los cinco pasos, siempre los cinco y siempre en `ACCOUNT_SETUP_ORDER`. */
  steps: readonly AccountSetupStep[];
  done: number;
  total: number;
  /** Cuando es cierto no hay nada que ofrecer: quien llama deja de pintar la lista. */
  complete: boolean;
}

/** Qué le falta a esta cuenta para que sus clientes la encuentren. */
export function readAccountSetup(snapshot: AccountSetupSnapshot): AccountSetup {
  const done: Record<AccountSetupStepKey, boolean> = {
    store: hasText(snapshot.storeName),
    username: hasText(snapshot.username),
    logo: hasText(snapshot.logoUrl),
    description: hasText(snapshot.description),
    branchLocation: snapshot.branchCoordinates.some(areValidCoordinates),
  };

  const steps = ACCOUNT_SETUP_ORDER.map((key) => ({ key, done: done[key] }));
  const completed = steps.filter((step) => step.done).length;

  return {
    steps,
    done: completed,
    total: steps.length,
    complete: completed === steps.length,
  };
}

/**
 * Un dato que solo tiene espacios no es un dato.
 *
 * Importa de verdad en `description`: el área de texto de la ficha guarda lo que se escriba, y una
 * descripción en blanco daría el paso por cumplido mientras la tienda sigue sin decir qué vende.
 */
function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
