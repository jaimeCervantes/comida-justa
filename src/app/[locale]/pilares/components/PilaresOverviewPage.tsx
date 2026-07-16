import React from "react";
import Link from "next/link";
import { PILLARS, pillarColorClasses } from "./pilaresData";

export default function PilaresOverviewPage() {
  return (
    <article>
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
          Los 4 Pilares de{" "}
          <span className="text-pw-lightgreen">Hazlo Sano</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
          Un framework integral para reconectar con tu biología y recuperar tu
          salud. Cuatro áreas interdependientes que, trabajadas en conjunto,
          transforman tu bienestar físico, mental y emocional.
        </p>
      </header>

      <section>
        <div className="grid gap-6 sm:grid-cols-2">
          {PILLARS.map((pillar) => {
            const c = pillarColorClasses[pillar.color];
            return (
              <Link
                key={pillar.slug}
                href={`/pilares/${pillar.slug}`}
                className={`group block rounded-2xl border-2 ${c.border} ${c.bg} p-6 sm:p-8 transition-all duration-300 hover:shadow-lg ${c.hover} focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${c.badge} text-white text-sm font-bold shrink-0`}
                  >
                    {pillar.number}
                  </span>
                  <h2
                    className={`text-xl sm:text-2xl font-bold ${c.text} group-hover:underline group-hover:underline-offset-4`}
                  >
                    {pillar.title}
                  </h2>
                </div>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-3">
                  {pillar.subtitle}
                </p>

                <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-4">
                  {pillar.description}
                </p>

                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${c.text}`}
                >
                  Leer más
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16 text-center">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            ¿Por qué estos cuatro pilares?
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            La ciencia moderna confirma lo que la sabiduría ancestral ya sabía:
            el sueño reparador, la alimentación natural, el movimiento diario y
            la conexión con nuestra comunidad son los cimientos de una vida
            saludable. Cada pilar refuerza a los demás, creando un círculo
            virtuoso de bienestar integral.
          </p>
        </div>
      </section>
    </article>
  );
}
