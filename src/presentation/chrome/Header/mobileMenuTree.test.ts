import { describe, expect, it } from "vitest";
import type { CategoryBranch } from "~/domain/entities/post/taxonomy";
import { categoryEntries, panelAt } from "./mobileMenuTree";

/** El catálogo real: una raíz con hijas y otra sin ellas. */
const branches: CategoryBranch[] = [
  {
    value: "alimentacion",
    label: "Alimentación",
    children: [
      { value: "jugos", label: "Jugos" },
      { value: "panaderia", label: "Panadería" },
    ],
  },
  {
    value: "movimiento_y_ejercicio",
    label: "Movimiento y ejercicio",
    children: [],
  },
];

describe("categoryEntries", () => {
  it("convierte una raíz con hijas en una puerta a sus hijas", () => {
    const [alimentacion] = categoryEntries(branches);

    expect(alimentacion).toMatchObject({
      kind: "panel",
      label: "Alimentación",
    });
    expect(
      alimentacion.kind === "panel"
        ? alimentacion.entries.map((entry) => entry.label)
        : [],
    ).toEqual(["Jugos", "Panadería"]);
  });

  // Una puerta a una lista vacía es un toque para no llegar a nada.
  it("deja una raíz sin hijas como enlace directo a su catálogo", () => {
    const [, movimiento] = categoryEntries(branches);

    expect(movimiento).toMatchObject({
      kind: "link",
      label: "Movimiento y ejercicio",
      href: {
        pathname: "/categoria/[key]",
        params: { key: "movimiento_y_ejercicio" },
      },
    });
  });

  it("enlaza cada hija a su propia categoría", () => {
    const [alimentacion] = categoryEntries(branches);
    const jugos =
      alimentacion.kind === "panel" ? alimentacion.entries[0] : null;

    expect(jugos).toMatchObject({
      href: { pathname: "/categoria/[key]", params: { key: "jugos" } },
    });
  });
});

describe("panelAt", () => {
  const entries = [
    {
      kind: "link" as const,
      id: "about",
      label: "Nosotros",
      href: "/" as const,
    },
    {
      kind: "panel" as const,
      id: "categories",
      label: "Por categoría",
      entries: categoryEntries(branches),
    },
  ];

  it("sin camino, no hay panel abierto", () => {
    expect(panelAt(entries, [])).toBeNull();
  });

  it("baja un nivel", () => {
    expect(panelAt(entries, ["categories"])).toMatchObject({
      label: "Por categoría",
    });
  });

  it("baja dos niveles hasta las sub-categorías", () => {
    expect(
      panelAt(entries, ["categories", "category:alimentacion"]),
    ).toMatchObject({ label: "Alimentación" });
  });

  /* Si el camino deja de existir —una categoría que se desactiva mientras el menú está abierto—
     se vuelve al inicio en vez de pintar un panel fantasma. */
  it("devuelve null cuando el camino ya no existe", () => {
    expect(panelAt(entries, ["categories", "category:ferreteria"])).toBeNull();
    expect(panelAt(entries, ["about"])).toBeNull();
  });
});
