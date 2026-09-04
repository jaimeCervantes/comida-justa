import { describe, expect, it } from "vitest";
import {
  ACCOUNT_SETUP_ORDER,
  type AccountSetupSnapshot,
  type AccountSetupStepKey,
  readAccountSetup,
} from "./accountSetup";

/** Una cuenta recién creada: sesión iniciada y nada más. */
const EMPTY: AccountSetupSnapshot = {
  storeName: null,
  username: null,
  logoUrl: null,
  description: null,
  branchCoordinates: [],
};

/** «Panadería La Luz», la tienda del `.feature`, con los cinco pasos resueltos. */
const COMPLETE: AccountSetupSnapshot = {
  storeName: "Panadería La Luz",
  username: "jaime-cervantes",
  logoUrl: "https://cdn.test/logo.webp",
  description: "Pan de masa madre horneado cada mañana.",
  branchCoordinates: [{ latitude: 18.6013, longitude: -96.7089 }],
};

function stepDone(
  key: AccountSetupStepKey,
  snapshot: AccountSetupSnapshot,
): boolean {
  const step = readAccountSetup(snapshot).steps.find((one) => one.key === key);

  if (!step) throw new Error(`El paso ${key} no está en la lista`);

  return step.done;
}

describe("readAccountSetup", () => {
  it("enumera los cinco pasos en el orden acordado, falte lo que falte", () => {
    for (const snapshot of [EMPTY, COMPLETE]) {
      expect(readAccountSetup(snapshot).steps.map((step) => step.key)).toEqual([
        ...ACCOUNT_SETUP_ORDER,
      ]);
    }
  });

  describe("un paso está cumplido cuando el dato que promete ya existe", () => {
    const cumplidos: [AccountSetupStepKey, Partial<AccountSetupSnapshot>][] = [
      ["store", { storeName: "Panadería La Luz" }],
      ["username", { username: "jaime-cervantes" }],
      ["logo", { logoUrl: "https://cdn.test/logo.webp" }],
      ["description", { description: "Pan de masa madre cada mañana" }],
      [
        "branchLocation",
        { branchCoordinates: [{ latitude: 18.6013, longitude: -96.7089 }] },
      ],
    ];

    it.each(cumplidos)("%s se marca con su dato puesto", (key, patch) => {
      expect(stepDone(key, { ...EMPTY, ...patch })).toBe(true);
    });
  });

  describe("lo vacío y lo que solo parece un dato quedan pendientes", () => {
    const pendientes: [
      string,
      AccountSetupStepKey,
      Partial<AccountSetupSnapshot>,
    ][] = [
      ["sin tienda", "store", { storeName: null }],
      ["sin dirección personal", "username", { username: null }],
      ["sin logo", "logo", { logoUrl: null }],
      ["sin descripción", "description", { description: null }],
      ["descripción de solo espacios", "description", { description: "   " }],
      [
        "sucursal sin coordenadas legibles",
        "branchLocation",
        { branchCoordinates: [null] },
      ],
      [
        // 0,0 es el Golfo de Guinea: en la práctica significa "no se pudo leer nada".
        "sucursal en 0,0",
        "branchLocation",
        { branchCoordinates: [{ latitude: 0, longitude: 0 }] },
      ],
    ];

    it.each(pendientes)("%s", (_caso, key, patch) => {
      expect(stepDone(key, { ...COMPLETE, ...patch })).toBe(false);
    });
  });

  it("basta una sucursal ubicada entre varias sin ubicar", () => {
    expect(
      stepDone("branchLocation", {
        ...EMPTY,
        branchCoordinates: [
          null,
          { latitude: 0, longitude: 0 },
          { latitude: 18.6013, longitude: -96.7089 },
        ],
      }),
    ).toBe(true);
  });

  describe("un paso bloqueado no es lo mismo que uno pendiente", () => {
    /* Sin tienda, la ficha y la tarjeta de sucursales ni se pintan: ofrecer un atajo a esos pasos
       sería mandar a alguien a una puerta que no está. */
    const sinTienda = readAccountSetup(EMPTY);
    const blocked = (key: AccountSetupStepKey): boolean =>
      sinTienda.steps.find((step) => step.key === key)?.blocked ?? false;

    it.each(["logo", "description", "branchLocation"] as AccountSetupStepKey[])(
      "%s se bloquea mientras no haya tienda",
      (key) => {
        expect(blocked(key)).toBe(true);
      },
    );

    it("abrir la tienda no se bloquea a sí misma", () => {
      expect(blocked("store")).toBe(false);
    });

    /* La dirección personal es de la persona, no del negocio: se puede reservar sin vender nada. */
    it("la dirección personal no depende de tener tienda", () => {
      expect(blocked("username")).toBe(false);
    });

    it("con la tienda abierta se desbloquean los tres", () => {
      const conTienda = readAccountSetup({ ...EMPTY, storeName: "Panadería" });

      expect(conTienda.steps.filter((step) => step.blocked)).toHaveLength(0);
    });

    it("un paso ya cumplido nunca se marca bloqueado", () => {
      expect(
        readAccountSetup(COMPLETE).steps.filter((step) => step.blocked),
      ).toHaveLength(0);
    });
  });

  describe("el avance se cuenta sobre los cinco pasos", () => {
    it("cuenta cero y no se da por terminado en una cuenta vacía", () => {
      const setup = readAccountSetup(EMPTY);

      expect(setup).toMatchObject({ done: 0, total: 5, complete: false });
    });

    it("cuenta los intermedios sin darse por terminado", () => {
      const setup = readAccountSetup({
        ...COMPLETE,
        logoUrl: null,
        branchCoordinates: [],
      });

      expect(setup).toMatchObject({ done: 3, total: 5, complete: false });
    });

    it("se da por terminado solo con los cinco", () => {
      expect(readAccountSetup(COMPLETE)).toMatchObject({
        done: 5,
        total: 5,
        complete: true,
      });
    });
  });
});
