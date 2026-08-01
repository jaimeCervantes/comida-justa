import PillarReferences from "./PillarReferences";
import { MIND_SPIRIT_REFERENCES } from "./references";

export default function MenteEspirituPage() {
  return (
    <article className="">
      <header className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-sky-400 mb-4">
          4. Emociones, Mente, Espíritu y Comunidad
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Reconectando con nosotros mismos y nuestra tribu.
        </p>
      </header>

      <div className="space-y-8 text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            La Revolución Digital y la Urbanización (Siglo XX - XXI): El Adiós a
            la Tribu
          </h2>
          <p className="mb-4">
            Antes de esto, el ser humano nunca vivía solo. La
            &quot;soledad&quot; era una sentencia de muerte biológica. El
            espíritu y la mente se nutrían del ritual, el silencio de la
            naturaleza y el apoyo del grupo.
          </p>

          <div className="bg-sky-50/50 dark:bg-sky-900/10 rounded-2xl p-6 sm:p-8 my-8 border border-sky-500 dark:border-sky-800 shadow-xs">
            <ul className="space-y-6">
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El cambio:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  Pasamos de la &quot;aldea&quot; (donde todos se conocían) a la
                  gran ciudad anónima, y finalmente al hiper-vínculo digital
                  (redes sociales) que nos conecta con miles, pero nos aísla
                  físicamente de todos.
                </span>
              </li>
              <li className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-50 shrink-0 sm:w-28 text-xl">
                  El impacto:
                </span>
                <span className="text-slate-700 dark:text-slate-300 text-lg">
                  Apareció la soledad crónica. El cerebro interpreta el
                  aislamiento como un peligro constante, disparando la ansiedad.
                  Perdimos los rituales de paso y el contacto con la tierra
                  (espiritualidad natural), sustituyéndolos por el
                  &quot;ruido&quot; mental de la comparación constante y la
                  productividad vacía.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            El &quot;Desajuste Evolutivo&quot; en la Mente y el Espíritu
          </h3>
          <p className="mb-4">
            Tu cerebro sigue esperando mirar a los ojos a alguien mientras
            platican, recibir la validación de su comunidad por sus acciones y
            sentirse parte de algo más grande que uno mismo (naturaleza o
            propósito).
          </p>
          <p className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
            La vida moderna te ofrece:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300 text-lg mb-8">
            <li>Likes en lugar de abrazos.</li>
            <li>
              Noticieros llenos de miedo en lugar de historias alrededor de una
              fogata.
            </li>
            <li>Competencia feroz en lugar de colaboración tribal.</li>
          </ul>

          <div className="bg-sky-50/80 dark:bg-sky-900/20 border-l-4 border-sky-500 dark:border-sky-400 p-6 rounded-r-xl my-8">
            <p className="text-sky-900 dark:text-sky-100 text-lg m-0">
              Este pilar reconoce que la salud no es solo física. Se centra en
              la gestión emocional, la claridad mental y la conexión con los
              demás. La salud &quot;espíritu/comunidad&quot; implica sentirse
              parte de algo más grande, cultivar relaciones sanas y mantener un
              propósito claro que impulse los otros tres pilares.
            </p>
          </div>
        </section>

        <PillarReferences
          references={MIND_SPIRIT_REFERENCES}
          linkClassName="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 underline transition-colors"
        />
      </div>
    </article>
  );
}
