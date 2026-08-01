import PillarReferences from "./PillarReferences";
import { NUTRITION_REFERENCES } from "./references";

export default function AlimentacionPage() {
  return (
    <article className="">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-pw-orange mb-4">
          2. Alimentación natural y nutritiva
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Reconectando con el origen y la comida real.
        </p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            La Revolución Verde y los Ultraprocesados (Post-Segunda Guerra
            Mundial)
          </h2>
          <p className="mb-4">
            Aquí es donde la alimentación se rompió. En los años 50, la
            prioridad era alimentar a una población mundial en explosión, y se
            optó por la cantidad sobre la calidad.
          </p>

          <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-orange-100 dark:border-orange-800/30 shadow-xs">
            <ul className="space-y-6">
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El cambio:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  Aparecieron los aceites vegetales refinados, las harinas
                  blancas masivas y el azúcar en todo.
                </span>
              </li>
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El impacto:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  Pasamos de comer &quot;comida de la tierra&quot; a
                  &quot;productos comestibles&quot; diseñados en laboratorios
                  para ser adictivos pero nutricionalmente nulos.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <p className="mb-6">
            Desde la posguerra, la prioridad de producir muchas calorías baratas
            (Revolución Verde + industrialización alimentaria) facilitó la
            transición hacia ultraprocesados basados en azúcar, harinas y
            aceites refinados. Esto resolvió buena parte del hambre aguda, pero
            a costa de dietas menos diversas y más “de laboratorio”, hoy
            fuertemente vinculadas con enfermedades crónicas y daños
            ambientales. Volver a patrones basados en alimentos mínimamente
            procesados, variados y de origen local se alinea mejor con salud
            humana y planetaria.
          </p>

          <div className="bg-orange-50/80 dark:bg-orange-900/20 border-l-4 border-orange-500 dark:border-orange-400 p-6 rounded-r-xl my-8">
            <p className="text-orange-900 dark:text-orange-100 text-lg m-0">
              Más allá de una dieta, este pilar se enfoca en la conexión con el
              origen. Promueve el consumo de alimentos reales y locales,
              facilitando el puente entre los agricultores y el consumidor
              final.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Incluye:
          </h3>
          <ul className="list-disc pl-6 space-y-3 text-slate-700 dark:text-slate-300 text-lg">
            <li>El apoyo a restaurantes que ofrecen opciones nutritivas.</li>
            <li>
              La promoción de la siembra propia de insumos (huertos urbanos o
              células de permacultura).
            </li>
            <li>
              La creación de un entorno donde elegir comida sana sea la opción
              más sencilla.
            </li>
          </ul>
        </section>

        <PillarReferences
          references={NUTRITION_REFERENCES}
          linkClassName="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline transition-colors"
        />
      </div>
    </article>
  );
}
