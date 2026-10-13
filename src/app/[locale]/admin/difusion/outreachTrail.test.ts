import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import type { Crumb } from "~/presentation/navigation/Breadcrumbs";
import { groupsTrail, outreachTrail } from "./outreachTrail";

const LABELS = {
  home: es.common.home,
  outreach: es.outreach.listHeading,
  groups: es.outreach.groupsHeading,
};

function read(crumbs: readonly Crumb[]): string {
  return crumbs.map((crumb) => crumb.label).join(" / ");
}

/** La corrida de escritorio del slice 3.1 de `difusionEnGrupos.feature`. */
describe("cada pantalla de difusión tiene su camino", () => {
  it.each([
    {
      pantalla: "la lista de publicaciones",
      camino: outreachTrail(LABELS),
      seLee: "Inicio / Difusión en grupos",
    },
    {
      pantalla: "una publicación nueva",
      camino: outreachTrail(LABELS, { label: es.outreach.newText }),
      seLee: "Inicio / Difusión en grupos / Nueva publicación",
    },
    {
      pantalla: 'la publicación "Masa madre"',
      camino: outreachTrail(LABELS, { label: "Masa madre" }),
      seLee: "Inicio / Difusión en grupos / Masa madre",
    },
    {
      pantalla: 'la edición de "Masa madre"',
      camino: outreachTrail(
        LABELS,
        {
          label: "Masa madre",
          href: { pathname: "/admin/difusion/[id]", params: { id: "texto-1" } },
        },
        { label: es.outreach.edit },
      ),
      seLee: "Inicio / Difusión en grupos / Masa madre / Editar",
    },
    {
      pantalla: "la lista de grupos",
      camino: groupsTrail(LABELS),
      seLee: "Inicio / Difusión en grupos / Grupos",
    },
    {
      pantalla: "el alta de un grupo",
      camino: groupsTrail(LABELS, { label: es.outreach.newGroup }),
      seLee: "Inicio / Difusión en grupos / Grupos / Nuevo grupo",
    },
    {
      pantalla: 'la edición de "Compra Venta Orizaba"',
      camino: groupsTrail(LABELS, { label: "Compra Venta Orizaba" }),
      seLee: "Inicio / Difusión en grupos / Grupos / Compra Venta Orizaba",
    },
  ])("$pantalla se lee «$seLee»", ({ camino, seLee }) => {
    expect(read(camino)).toBe(seLee);
  });

  // Subir un nivel es lo que justifica las migas: cada tramo común lleva a su lista.
  it("los tramos comunes llevan a su lista", () => {
    expect(
      groupsTrail(LABELS, { label: "Nuevo grupo" }).map((crumb) => crumb.href),
    ).toEqual(["/", "/admin/difusion", "/admin/difusion/grupos", undefined]);
  });
});
