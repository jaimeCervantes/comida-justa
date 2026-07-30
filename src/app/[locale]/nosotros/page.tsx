import type { Metadata } from "next";
import Image from "next/image";
import { ABOUT_SUBTITLE, ABOUT_TITLE, buildAboutMetadata } from "./metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildAboutMetadata();
}

export default function NosotrosPage() {
  return (
    <main className="container-width py-12 space-y-16 max-w-4xl mx-auto">
      <header className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
          {ABOUT_TITLE}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 text-balance max-w-2xl mx-auto">
          {ABOUT_SUBTITLE}
        </p>
      </header>

      {/* 1. Ecosistema Hazlo Sano / Chatbot */}
      <section className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-3xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 sm:gap-6 text-center sm:text-left">
                <Image
                  src="/logo.webp"
                  alt="Logo Hazlo Sano"
                  width={100}
                  height={100}
                  className="hover:scale-105 transition-transform shrink-0"
                  priority
                />
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-900 dark:text-blue-100">
                  El Ecosistema &quot;Hazlo Sano&quot;
                </h2>
              </div>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                <strong>Hazlo Sano</strong> es todo un ecosistema de iniciativas
                y sistemas (No solo computacionales) diseñados para que vivir
                sano sea la opción más fácil para todos.
              </p>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed font-medium">
                Hablamos de acciones concretas basadas en nuestros 4 pilares:
              </p>
              <ul className="space-y-2 text-blue-900 dark:text-blue-100 font-medium text-lg">
                <li className="flex items-center gap-3">
                  <span className="text-xl">✅</span> Sueño y descanso
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">✅</span> Alimentación natural y
                  nutritiva
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">✅</span> Movimiento o ejercicio
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-xl">✅</span> Emociones / mente /
                  espíritu
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-blue-200 dark:border-blue-800/50">
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-3 mb-3">
                <span className="text-3xl">🤖</span> Nuestro Asistente Virtual
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-lg leading-relaxed">
                ¿No sabes por dónde empezar? Nuestro{" "}
                <strong className="font-semibold">Chatbot en Telegram</strong>{" "}
                está diseñado para ayudarte de inmediato con tu salud.
              </p>
            </div>
          </div>

          <div className="shrink-0 mt-2 sm:mt-0 sm:self-end">
            <a
              href="https://t.me/HazloSanoBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Ir al Chatbot
            </a>
          </div>
        </div>
      </section>

      {/* 2. Crema de Cacahuate */}
      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🥜</span> Crema de Cacahuate Natural
          </h2>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            ¿Tu crema de cacahuate tiene más ingredientes que cacahuate?
          </h3>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Muchas cremas comerciales llevan azúcar, aceites añadidos,
            conservadores y otros ingredientes que tu cuerpo realmente no
            necesita.
            <br />
            En{" "}
            <strong className="text-gray-900 dark:text-white">
              Hazlo Sano
            </strong>{" "}
            hacemos algo mucho más simple: <em>comida real</em>.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <ul className="space-y-4 bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <li className="flex items-start gap-3 text-lg">
              <span className="mt-1">✅</span>
              <div>
                <strong className="block text-gray-900 dark:text-white">
                  100% Natural
                </strong>
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  Solo contiene cacahuate.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 text-lg">
              <span className="mt-1">💪</span>
              <div>
                <strong className="block text-gray-900 dark:text-white">
                  Energía Real
                </strong>
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  Rica en proteína vegetal y grasas saludables (corazón).
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 text-lg">
              <span className="mt-1">🌿</span>
              <div>
                <strong className="block text-gray-900 dark:text-white">
                  Sin Extras Innecesarios
                </strong>
                <span className="text-gray-600 dark:text-gray-400 text-base">
                  Sin azúcar añadida, aceites refinados ni conservadores.
                </span>
              </div>
            </li>
          </ul>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <h4 className="text-lg font-bold mb-4 text-amber-900 dark:text-amber-400 flex items-center gap-2">
              🥄 Ideal para acompañar:
            </h4>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-amber-800 dark:text-amber-200/80 font-medium">
              <li className="flex items-center gap-2">🍞 Pan de masa madre</li>
              <li className="flex items-center gap-2">🍞 Pan tostado</li>
              <li className="flex items-center gap-2">🍌 Plátano</li>
              <li className="flex items-center gap-2">🥣 Avena</li>
              <li className="flex items-center gap-2">🍓 Fruta</li>
              <li className="flex items-center gap-2">🥤 Licuados</li>
              <li className="flex items-center gap-2">🥞 Hotcakes</li>
            </ul>
            <p className="mt-4 text-sm text-amber-900/80 dark:text-amber-300">
              ⚡ O simplemente <strong>una cucharada directa</strong> cuando
              necesitas energía natural post-entrenamiento o por la mañana.
            </p>
          </div>
        </div>

        {/* Consejos de Conservación */}
        <div className="bg-amber-100/50 dark:bg-amber-950/30 p-6 rounded-2xl">
          <h4 className="text-xl font-bold mb-4 text-amber-800 dark:text-amber-500 flex items-center gap-2">
            💡 Consejos para su conservación
          </h4>
          <ul className="space-y-3 text-amber-900 dark:text-amber-100/90 list-disc pl-5">
            <li>
              <strong>Temperatura:</strong> Guárdala en un lugar fresco y
              oscuro, como una alacena, para mantenerla untable y suave.
            </li>
            <li>
              <strong>Mezclar bien:</strong> Al no tener emulsionantes, es
              normal que el aceite natural del cacahuate suba a la superficie.
              Simplemente mézclala bien hasta el fondo antes de cada uso.
            </li>
            <li>
              <strong>Refrigeración opcional:</strong> Si tardarás más de unas
              semanas en consumirla, puedes guardarla en el refrigerador. Esto
              mantendrá los aceites estables por más tiempo, aunque la textura
              se volverá más firme.
            </li>
            <li>
              <strong>Higiene:</strong> Introduce siempre un utensilio limpio y
              seco para prolongar su vida útil.
            </li>
          </ul>
        </div>
      </section>

      {/* 3. Pan de Masa Madre */}
      <section className="space-y-8" id="pan-de-masa-madre-mmnaturalmente">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🥖</span> Pan de Masa Madre
          </h2>
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
            ¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano.
          </h3>
          <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            El pan de{" "}
            <strong className="text-gray-900 dark:text-white">
              MMNaturalmente
            </strong>{" "}
            no es solo pan. Es un{" "}
            <strong className="text-gray-900 dark:text-white">
              ecosistema vivo
            </strong>{" "}
            que cuida tu salud, elaborado sin químicos ni levaduras
            industriales. Es pan vivo. Es pan que nutre. ✨
          </p>

          <div className="bg-orange-50/80 dark:bg-orange-950/30 p-5 rounded-2xl text-orange-900 dark:text-orange-200 border border-orange-200/60 dark:border-orange-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>
              📍 Hazlo Sano es <strong>punto de venta oficial</strong> del pan
              elaborado por{" "}
              <strong className="font-bold">MMNaturalmente</strong>.
            </p>
            <div className="flex shrink-0 items-center justify-start gap-4 font-medium text-sm">
              <a
                href="https://www.instagram.com/mmnaturalmente/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-[#1a1a1a] px-3 py-1.5 rounded-full shadow-xs hover:shadow-md hover:text-orange-600 dark:hover:text-orange-400 border border-orange-100 dark:border-orange-900/50 transition-all flex items-center gap-1.5"
              >
                📸 Instagram
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61575188279449"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-[#1a1a1a] px-3 py-1.5 rounded-full shadow-xs hover:shadow-md hover:text-blue-600 dark:hover:text-blue-400 border border-orange-100 dark:border-orange-900/50 transition-all flex items-center gap-1.5"
              >
                🔵 Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50">
              <h4 className="text-lg font-bold mb-4 text-orange-900 dark:text-orange-400 flex items-center gap-2">
                🧬 ¿Qué pasa en cada hogaza?
              </h4>
              <ul className="space-y-4 text-orange-900 dark:text-orange-100/80">
                <li className="flex flex-col">
                  <strong className="text-orange-950 dark:text-orange-300">
                    Digestión Ligera
                  </strong>
                  <span className="text-sm">
                    Las bacterias naturales pre-digieren parte del gluten y los
                    carbohidratos. Muchas personas intolerantes lo asimilan
                    mejor.
                  </span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-orange-950 dark:text-orange-300">
                    Más Biodisponibilidad
                  </strong>
                  <span className="text-sm">
                    Reduce el ácido fítico, mejorando la absorción de hierro,
                    zinc y magnesio.
                  </span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-orange-950 dark:text-orange-300">
                    Respuesta Glucémica Estable
                  </strong>
                  <span className="text-sm">
                    La fermentación modifica los almidones, logrando liberar
                    energía de forma sostenida (evita picos bruscos de azúcar).
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-center">
            <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              🛒 Variedades (Hogaza de 1 kg)
            </h4>
            <ul className="space-y-3 text-lg mb-6">
              <li className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span>🌾 Natural</span>
                <span className="font-semibold text-(--highlight)">$96</span>
              </li>
              <li className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="leading-tight">
                  🌻 Semillas / Hierbas finas / Arándanos / Canela
                </span>
                <span className="font-semibold text-(--highlight)">$125</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>🍫 Chocolate</span>
                <span className="font-semibold text-(--highlight)">$136</span>
              </li>
            </ul>
            <div className="mt-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              📍 Disponibles directamente en nuestra sede.
            </div>
          </div>
        </div>

        {/* Consejos de Conservación */}
        <div className="bg-orange-100/60 dark:bg-orange-900/20 p-6 rounded-2xl">
          <h4 className="text-xl font-bold mb-4 text-orange-900 dark:text-orange-500 flex items-center gap-2">
            💡 Consejos para conservar el Pan
          </h4>
          <ul className="space-y-3 text-orange-900 dark:text-orange-100/90 list-disc pl-5">
            <li>
              <strong>Congelación (La mejor opción):</strong> Si no te vas a
              acabar el pan en 3-4 días, guárdalo en el congelador.
            </li>
            <li>
              <strong>Consumo desde congelador:</strong> Saca solo las rebanadas
              que vayas a comer y directas al tostador o comal caliente.
              ¡Quedarán crujientes y suaves por dentro, como recién horneadas!
            </li>
            <li>
              <strong>Recuperar frescura:</strong> Si guardaste el pan a
              temperatura ambiente, pasados los días puede endurecerse de la
              corteza. Para revivirlo, salpícale un par de gotas de agua
              uniformemente por fuera y mételo al horno a 180°C por 3 a 5
              minutos.
            </li>
          </ul>
        </div>
      </section>

      {/* Redes y Contacto */}
      <section className="bg-gray-100 dark:bg-[#141414] p-8 sm:p-12 rounded-3xl text-center space-y-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Haz tu Pedido
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Pasa a recoger tus productos nutritivos a nuestra sucursal y cuida tu
          salud.
        </p>

        <div className="flex flex-wrap justify-center gap-4 py-4">
          <a
            href="https://wa.me/522781126948"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            WhatsApp Directo
          </a>
          <a
            href="https://www.tiktok.com/@hazlosano"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black dark:bg-zinc-800 hover:bg-gray-800 dark:hover:bg-zinc-700 text-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            TikTok
          </a>
          <a
            href="https://fb.com/hazlo.sano.comunidad"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            Facebook
          </a>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium">
          <span className="block w-full sm:w-auto text-gray-500">
            📞 Cel: 2781126948
          </span>
          <a
            href="https://hazlosano.com"
            className="text-(--highlight) hover:underline"
          >
            hazlosano.com
          </a>
          <a
            href="https://restaurante.hazlosano.com"
            className="text-(--highlight) hover:underline"
          >
            restaurante.hazlosano.com
          </a>
        </div>
      </section>
    </main>
  );
}
