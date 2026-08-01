import PillarReferences from "./PillarReferences";
import { MOVEMENT_REFERENCES } from "./references";

export default function MovimientoPage() {
  return (
    <article className="">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-pw-lightgreen mb-4">
          3. Movimiento y ejercicio
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Combatiendo el sedentarismo en la vida diaria.
        </p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            La Revolución Industrial (Siglo XVIII - XIX): El Adiós al Movimiento
          </h2>
          <p className="mb-4">
            Antes de esto, la mayoría de la humanidad trabajaba en el campo,
            cazaba o hacía trabajo manual. El movimiento no era
            &quot;ejercicio&quot;, era supervivencia.
          </p>

          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-emerald-500 dark:border-emerald-800 shadow-xs">
            <ul className="space-y-6">
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El cambio:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  El paso de sociedades agrarias a sociedades industriales y
                  luego postindustriales trasladó el trabajo de espacios
                  abiertos y tareas físicas a entornos interiores y tareas
                  mentales. Se consolidó un empleo cada vez más de &quot;silla y
                  pantalla&quot;, con trabajos de baja demanda física y largas
                  jornadas sentados.
                </span>
              </li>
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El impacto:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  Apareció el sedentarismo estructural. Por primera vez en la
                  historia, el ser humano empezó a pasar 8 o 12 horas sentado o
                  parado en un mismo lugar, bajo techos que nos ocultaron el
                  sol. Con máquinas que sustituyen el esfuerzo físico, abriendo
                  la puerta al sedentarismo crónico y a muchas enfermedades
                  modernas como obesidad y riesgo cardiovascular.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div className="bg-emerald-50/80 dark:bg-emerald-900/20 border-l-4 border-emerald-500 dark:border-emerald-400 p-6 rounded-r-xl my-8">
            <p className="text-emerald-900 dark:text-emerald-100 text-lg m-0">
              Este pilar esta enfocado en combatir el sedentarismo mediante la
              integración de la actividad física en la vida diaria. No se limita
              al gimnasio; abarca caminar, correr, jugar fútbol o cualquier
              forma de movimiento funcional. El objetivo es que las personas
              encuentren placer en el esfuerzo físico y lo mantengan de forma
              constante.
            </p>
          </div>
        </section>

        <PillarReferences
          references={MOVEMENT_REFERENCES}
          linkClassName="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline transition-colors"
        />
      </div>
    </article>
  );
}
