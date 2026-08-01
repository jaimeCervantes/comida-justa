import PillarReferences from "./PillarReferences";
import { SLEEP_REFERENCES } from "./references";

export default function SuenoPage() {
  return (
    <article className="">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-violet-500 mb-4">
          1. Sueño y Descanso
        </h1>
        <p className="text-xl text-slate-600 da dark:text-slate-400">
          La base de la recuperación biológica y la salud a largo plazo.
        </p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 da dark:text-slate-200 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 da dark:text-slate-50 mb-4">
            La Invención de la Luz Eléctrica (1879): El Fin del Sueño Natural
          </h2>
          <p className="mb-4">
            Este es quizás el punto de quiebre más agresivo para nuestro
            cerebro. Antes de Thomas Edison, la luz artificial, nuestro ritmo
            circadiano (el reloj interno) estaba perfectamente sincronizado con
            el sol.
          </p>

          <div className="bg-violet-50/50 da dark:bg-violet-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-violet-500 da dark:border-violet-800 shadow-xs">
            <ul className="space-y-6">
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 da dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El cambio:
                </span>
                <span className="text-slate-700 da dark:text-slate-300 text-lg">
                  La noche dejó de ser oscura. Pudimos trabajar, comer y
                  socializar después del atardecer.
                </span>
              </li>
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 da dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El impacto:
                </span>
                <span className="text-slate-700 da dark:text-slate-300 text-lg">
                  El cuerpo dejó de producir melatonina correctamente. Empezamos
                  a robarle horas al descanso, lo que disparó el estrés crónico
                  y la inflamación que hoy vemos en todos lados.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 da dark:text-slate-50 mb-4">
            ¿Cuántos procesos dependen del sueño?
          </h2>
          <p className="mb-4">
            El sueño participa en múltiples funciones esenciales, no en solo
            una:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-slate-700 da dark:text-slate-300 text-lg mb-8">
            <li>
              <strong>Cerebro y mente:</strong> memoria y aprendizaje,
              plasticidad sináptica, regulación emocional y del estado de ánimo.
            </li>
            <li>
              <strong>Metabolismo y energía:</strong> regulación del gasto y
              reposición de energía, anabolismo, mantenimiento celular y
              limpieza de &quot;desechos&quot; cerebrales (sistema glinfático).
            </li>
            <li>
              <strong>Sistema inmune e inflamación:</strong> defensa frente a
              infecciones, respuesta a vacunas y control de inflamación ligada a
              cáncer, depresión y enfermedad cardiovascular.
            </li>
            <li>
              <strong>Cardiovascular y endocrino:</strong> presión arterial,
              glucosa, hormonas del estrés, hormonas del apetito, salud
              reproductiva.
            </li>
            <li>
              <strong>Homeostasis general:</strong> equilibrio de sistemas
              orgánicos, metabolismo, estado psicológico y social.
            </li>
          </ul>
        </section>

        <section>
          <p className="mb-6">
            La <strong>evidencia científica</strong> muestra que el sueño
            interviene en prácticamente todos los procesos críticos de cuerpo y
            mente; no es un lujo, sino una base fisiológica de atención,
            memoria, estabilidad emocional, metabolismo, inmunidad y salud
            cardiovascular a largo plazo.
          </p>

          <div className="bg-violet-50/da dark:bg-violet-900 border-l-4 border-violet-500 da dark:border-violet-400 p-6 rounded-r-xl my-8">
            <p className="text-violet-900 dark:text-violet-100xt-lg m-0">
              Este pilar es la base de la recuperación biológica. No se trata
              solo de &quot;dormir&quot;, sino de optimizar la{" "}
              <strong>higiene del sueño</strong> para garantizar que el cuerpo y
              la mente se reparen adecuadamente. En <strong>Hazlo Sano</strong>,
              se busca que la tecnología ayude a monitorizar y fomentar rutinas
              que respeten los ritmos circadianos.
            </p>
          </div>
        </section>

        <PillarReferences
          references={SLEEP_REFERENCES}
          linkClassName="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 underline transition-colors"
        />
      </div>
    </article>
  );
}
