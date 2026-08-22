import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { AA_THRESHOLD, contrastRatio } from "./contrast";

/**
 * La paleta de los cuatro pilares, medida en vivo.
 *
 * Lee los tokens con `getComputedStyle` en lugar de repetir los hexadecimales, así que enseña lo
 * que el navegador está aplicando de verdad —incluido el cambio al tema oscuro— y no una copia que
 * podría haber quedado atrás.
 */

const PILLARS = [
  {
    key: "sleep",
    number: 1,
    label: "Sueño",
    origin: "violeta anterior #8b5cf6",
  },
  {
    key: "nutrition",
    number: 2,
    label: "Alimentación",
    origin: "--brand-orange (el círculo del logo)",
  },
  {
    key: "movement",
    number: 3,
    label: "Movimiento",
    origin: "--brand-lightgreen",
  },
  {
    key: "mind-spirit",
    number: 4,
    label: "Mente y Espíritu",
    origin: "azul cielo anterior #38bdf8",
  },
] as const;

type Ramp = { solid: string; soft: string; ink: string };

function readRamp(key: string): Ramp {
  const style = getComputedStyle(document.documentElement);
  const read = (role: string) =>
    style.getPropertyValue(`--pillar-${key}-${role}`).trim();
  return { solid: read("solid"), soft: read("soft"), ink: read("ink") };
}

function Ratio({ a, b, label }: { a: string; b: string; label: string }) {
  if (!a || !b) return null;
  const ratio = contrastRatio(a, b);
  const passes = ratio >= AA_THRESHOLD;
  return (
    <span className="text-xs tabular-nums">
      {label}{" "}
      <strong className={passes ? "text-pw-green" : "text-pw-orange"}>
        {ratio.toFixed(2)} {passes ? "AA" : "✗"}
      </strong>
    </span>
  );
}

function PaletteTable() {
  // El tema se cambia desde la barra de Storybook escribiendo `data-theme` en <html>; hay que
  // releer los tokens cuando eso pasa o la tabla se queda mostrando la paleta anterior.
  const [ramps, setRamps] = useState<Record<string, Ramp>>({});

  useEffect(() => {
    const refresh = () =>
      setRamps(
        Object.fromEntries(PILLARS.map((p) => [p.key, readRamp(p.key)])),
      );
    refresh();

    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-text-support">
        Alimentación y Movimiento conservan tonos derivados de la marca. Sueño y
        Mente/Espíritu recuperan su violeta y azul cielo anteriores. Cada pilar
        usa una rampa de tres papeles porque los tonos vivos no siempre admiten
        texto blanco: <code>#8b5cf6</code> da 4.23 y <code>#38bdf8</code> da
        2.14, por debajo de AA.
      </p>

      {PILLARS.map((pillar) => {
        const ramp = ramps[pillar.key];
        if (!ramp) return null;
        return (
          <div
            key={pillar.key}
            className="flex flex-col gap-2 rounded-chip border border-separator p-4"
          >
            <div className="flex items-baseline gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: ramp.solid }}
              >
                {pillar.number}
              </span>
              <strong>{pillar.label}</strong>
              <span className="text-xs text-text-support">{pillar.origin}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["solid", "soft", "ink"] as const).map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <span
                    className="inline-block h-8 w-8 rounded-chip border border-separator"
                    style={{ backgroundColor: ramp[role] }}
                  />
                  <span className="text-xs">
                    <code>{role}</code>
                    <br />
                    <code className="text-text-support">{ramp[role]}</code>
                  </span>
                </div>
              ))}

              <div
                className="flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{ backgroundColor: ramp.soft, color: ramp.ink }}
              >
                {pillar.number} · {pillar.label}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Ratio a={ramp.ink} b={ramp.soft} label="tinta sobre su chip" />
              <Ratio a="#ffffff" b={ramp.solid} label="blanco sobre sólido" />
            </div>
          </div>
        );
      })}

      <p className="max-w-2xl text-sm text-text-support">
        <strong>Aviso de diseño.</strong> Como tinta, Movimiento y Mente
        contrastan 1.14 entre sí: casi idéntica luminosidad, solo los separa el
        tono. Por eso el número acompaña siempre al color — quien no distingue
        el tono sigue pudiendo identificar el pilar.
      </p>
    </div>
  );
}

const meta = {
  title: "Tokens/Paleta de los pilares",
  component: PaletteTable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PaletteTable>;

export default meta;

export const Paleta: StoryObj<typeof meta> = {};
