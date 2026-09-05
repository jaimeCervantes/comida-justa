/**
 * Las prácticas del pilar del descanso.
 *
 * Trece, deduplicadas de las veintidós apariciones que la misma acción tenía repartidas entre el
 * ritual (`atomicSleepChallenge.ritualStep*`), el santuario, la descarga mental y el catálogo. Esa
 * deduplicación es un juicio editorial, no un `diff`: por eso vive en filas revisables una por una.
 *
 * **Los DOIs no se inventaron.** Salen de los comentarios de `pillarBibliography.ts`, que ya
 * explicaban qué afirmación sostenía cada estudio, y de títulos de Crossref que lo dicen sin
 * ambigüedad. Dos prácticas se quedan con la lista vacía —la infusión y notar la claridad— porque
 * ninguno de los 116 estudios habla de eso: una bibliografía de adorno es peor que una lista corta.
 *
 * **Respirar despacio no está aquí, y sirve al descanso igual.** Vive en `mindPractices.ts` porque
 * su pilar primario es Mente, y `practice_pillars` la trae a Sueño sin copiarla. Es la práctica que
 * justifica que esa tabla sea N:N.
 */
import type { PracticeSeed } from "./practiceSeed";

/** La advertencia del ritual del descanso, que ya vive en `atomicSleepChallenge.safety`. */
const SLEEP_SAFETY_ES =
  "La luz se recibe al aire libre y nunca mirando directamente al sol. Si el insomnio se sostiene en el tiempo, o si roncas o dejas de respirar al dormir, consúltalo con profesionales de salud: hay trastornos del sueño que ningún ritual corrige.";
const SLEEP_SAFETY_EN =
  "Light is taken outdoors and never by looking straight at the sun. If insomnia holds on over time, or if you snore or stop breathing while asleep, take it to a health professional: there are sleep disorders no ritual can fix.";

export const SLEEP_PRACTICE_SEED: readonly PracticeSeed[] = [
  {
    key: "sleep-evening-to-morning",
    challengeKey: "sleep-evening-to-morning-v1",
    costLevel: 0,
    pillars: ["sleep"],
    dois: ["10.1210/jc.2010-2098", "10.1038/tp.2016.262"],
    es: {
      title: "Del atardecer al amanecer",
      summary:
        "Dos anclas bastan para que la repetición cuente: cerrar la noche y abrir la mañana. Lo demás ayuda, pero no convierte tu día en fracaso.",
      howTo:
        "Una hora antes de dormir, aparta las pantallas de tu alcance y baja la intensidad de la luz. En la primera hora tras despertar, sal a recibir de 10 a 15 minutos de luz natural.",
      safetyNote: SLEEP_SAFETY_ES,
    },
    en: {
      title: "From dusk to dawn",
      summary:
        "Two anchors are enough for the repetition to count: closing the night and opening the morning. The rest helps, but it does not turn your day into a failure.",
      howTo:
        "An hour before bed, put screens out of reach and turn the lights down. In the first hour after waking, step out for 10 to 15 minutes of natural light.",
      safetyNote: SLEEP_SAFETY_EN,
    },
  },
  {
    key: "sleep-morning-sunlight",
    effortMinutes: 15,
    costLevel: 0,
    // También de Movimiento: la luz se recibe saliendo, y el estudio de 2023 que la liga con el
    // sueño está en la bibliografía de ese pilar, no en la de este.
    pillars: ["sleep", "movement"],
    dois: [
      "10.1038/tp.2016.262",
      "10.1007/s11818-019-00215-x",
      "10.1073/pnas.2301608120",
    ],
    es: {
      title: "Anclar la mañana con sol",
      summary:
        "De 10 a 15 minutos de luz natural en la primera hora tras despertar ajustan tu reloj interno y programan la melatonina de esta noche.",
      howTo:
        "Sal al patio, al balcón o a la calle. Si no puedes salir, desayuna junto a una ventana abierta. Sin lentes de sol en ese rato.",
      safetyNote: "Nunca mires al sol directamente.",
    },
    en: {
      title: "Anchor the morning with sunlight",
      summary:
        "Ten to fifteen minutes of natural light in the first hour after waking set your internal clock and schedule tonight's melatonin.",
      howTo:
        "Step out to the yard, the balcony or the street. If you cannot go out, have breakfast by an open window. No sunglasses during that stretch.",
      safetyNote: "Never look straight at the sun.",
    },
  },
  {
    key: "sleep-sunset-light",
    effortMinutes: 20,
    costLevel: 0,
    pillars: ["sleep", "movement"],
    dois: ["10.1038/tp.2016.262", "10.1073/pnas.2301608120"],
    es: {
      title: "Recibir la luz del atardecer",
      summary:
        "Ver el atardecer o caminar a última hora de la tarde le dice a tu reloj interno que el día se está acabando.",
      howTo:
        "Sal un rato antes de que se ponga el sol. Una caminata corta basta; no hace falta un mirador.",
    },
    en: {
      title: "Catch the evening light",
      summary:
        "Watching the sunset or walking late in the afternoon tells your internal clock the day is ending.",
      howTo:
        "Head out for a while before the sun goes down. A short walk is enough; you do not need a lookout point.",
    },
  },
  {
    key: "sleep-dim-the-house",
    effortMinutes: 60,
    costLevel: 0,
    pillars: ["sleep"],
    dois: [
      "10.1210/jc.2010-2098",
      "10.1038/s41598-020-75622-4",
      "10.1073/pnas.1901824116",
      "10.2174/0122106766390602251012162712",
    ],
    es: {
      title: "Atenuar la casa una hora antes",
      summary:
        "La luz de una habitación normal antes de dormir retrasa el inicio de la melatonina y le recorta cerca de noventa minutos.",
      howTo:
        "Una hora antes de dormir, aparta las pantallas de tu alcance y baja la intensidad de la luz: cálida e indirecta.",
    },
    en: {
      title: "Dim the house an hour before",
      summary:
        "Ordinary room light before bed pushes melatonin onset later and cuts about ninety minutes off it.",
      howTo:
        "An hour before bed, put screens out of reach and turn the light down: warm and indirect.",
    },
  },
  {
    key: "sleep-mental-unload",
    effortMinutes: 5,
    costLevel: 0,
    pillars: ["sleep"],
    dois: ["10.1037/xge0000374"],
    es: {
      title: "La descarga mental",
      summary:
        "Escribir cinco minutos lo que queda pendiente hace dormirse antes que escribir lo que ya se hizo, medido con polisomnografía.",
      howTo:
        "Antes de acostarte, anota en papel los pendientes de mañana y lo que te da vueltas. No hay que resolverlo ni ordenarlo: basta con sacarlo y saber que mañana puedes volver a la lista.",
    },
    en: {
      title: "The mental unload",
      summary:
        "Writing for five minutes about what is still pending gets you to sleep sooner than writing up what you already did, measured with polysomnography.",
      howTo:
        "Before bed, write on paper what you have pending for tomorrow and what is going round your head. You do not have to solve it or tidy it: getting it out, knowing you can come back to the list tomorrow, is the point.",
    },
  },
  {
    key: "sleep-cool-room",
    costLevel: 0,
    pillars: ["sleep"],
    dois: ["10.1186/1880-6805-31-14"],
    es: {
      title: "Un cuarto fresco y ventilado",
      summary:
        "Para dormirte, tu temperatura corporal tiene que bajar cerca de un grado; un cuarto caliente lo impide por más cansado que estés.",
      howTo: "Ventila antes de acostarte y deja el aire circulando.",
    },
    en: {
      title: "A cool, aired room",
      summary:
        "To fall asleep, your body temperature has to drop by about a degree; a hot room blocks that no matter how tired you are.",
      howTo: "Air the room before bed and leave the air moving.",
    },
  },
  {
    key: "sleep-dark-room",
    costLevel: 1,
    pillars: ["sleep"],
    dois: [
      "10.1093/sleep/zsz067.037",
      "10.1016/j.lfs.2017.02.008",
      "10.3109/07420528.2015.1073158",
    ],
    es: {
      title: "Penumbra total",
      summary:
        "La oscuridad es la única señal que el cuerpo acepta sin discutir, y dormir con luz artificial encendida se asocia a más inflamación.",
      howTo:
        "Cortinas gruesas, y fuera los pilotos y las luces de los aparatos.",
    },
    en: {
      title: "Full darkness",
      summary:
        "Darkness is the one signal your body accepts without arguing, and sleeping with artificial light on is associated with more inflammation.",
      howTo: "Thick curtains, and standby lights on devices covered or off.",
    },
  },
  {
    key: "sleep-phone-out",
    costLevel: 1,
    pillars: ["sleep"],
    dois: ["10.2174/0122106766390602251012162712"],
    es: {
      title: "El teléfono fuera del cuarto",
      summary:
        "No es fuerza de voluntad: es poner distancia física entre tú y el scroll de medianoche, y entre tú y las notificaciones al abrir los ojos.",
      howTo:
        "El teléfono cargando fuera de la habitación, y un despertador aparte.",
    },
    en: {
      title: "The phone out of the bedroom",
      summary:
        "This is not willpower: it is putting physical distance between you and the midnight scroll, and between you and the notifications waiting when you open your eyes.",
      howTo:
        "The phone charging outside the bedroom, and a separate alarm clock.",
    },
  },
  {
    key: "sleep-bed-for-sleep",
    costLevel: 0,
    pillars: ["sleep"],
    dois: ["10.1016/j.pcad.2023.02.005"],
    es: {
      title: "La cama, solo para dormir",
      summary:
        "Tu cuarto le enseña a tu cerebro qué se hace en él; si ahí se trabaja y se discute, la cama deja de ser una señal de dormir.",
      howTo: "La cama solo para dormir y para la intimidad. El trabajo, fuera.",
    },
    en: {
      title: "The bed, for sleep only",
      summary:
        "Your room teaches your brain what happens in it; if you work and argue there, the bed stops being a signal to sleep.",
      howTo: "The bed only for sleep and intimacy. Work stays out.",
    },
  },
  {
    key: "sleep-caffeine-free-infusion",
    costLevel: 1,
    pillars: ["sleep"],
    // Ninguno de los 116 estudios habla de infusiones. Se queda sin bibliografía en vez de
    // pedirle prestada la de otra práctica.
    dois: [],
    es: {
      title: "Una infusión caliente sin cafeína",
      summary:
        "Algo tibio que le diga al sistema nervioso que la jornada terminó y que ya no hace falta estar alerta.",
      howTo:
        "Manzanilla, toronjil o tila. A granel y de temporada, en vez de una compra envasada más.",
    },
    en: {
      title: "A hot caffeine-free infusion",
      summary:
        "Something warm that tells your nervous system the day is over and there is no need to stay alert.",
      howTo:
        "Chamomile, lemon balm or linden. Loose and in season, rather than one more packaged purchase.",
    },
  },
  {
    key: "sleep-paper-book",
    costLevel: 1,
    pillars: ["sleep"],
    dois: ["10.2174/0122106766390602251012162712"],
    es: {
      title: "Un libro en papel junto a la cama",
      summary:
        "Ocupa el rato de antes de dormir sin la luz ni el desplazamiento sin fondo de una pantalla.",
      howTo: "Déjalo donde antes estaba el teléfono.",
    },
    en: {
      title: "A paper book beside the bed",
      summary:
        "It fills the stretch before sleep without the light or the bottomless scroll of a screen.",
      howTo: "Leave it where the phone used to be.",
    },
  },
  {
    key: "sleep-notice-clarity",
    effortMinutes: 2,
    costLevel: 0,
    pillars: ["sleep"],
    // Notar cómo amaneciste es el cierre del ritual, no una intervención medida. Sin estudio.
    dois: [],
    es: {
      title: "Notar la claridad al despertar",
      summary:
        "Fijarte en qué tan descansado te sientes y en cuánta cafeína necesitas de verdad es lo que convierte una noche en información.",
    },
    en: {
      title: "Notice the clarity on waking",
      summary:
        "Paying attention to how rested you feel, and to how much caffeine you actually need, is what turns a night into information.",
    },
  },
];
