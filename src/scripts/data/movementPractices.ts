/**
 * Las prácticas del pilar del movimiento.
 *
 * Deduplicadas del ritual (`atomicChallenges.movementExperience`), de la cadencia del día, del pie y
 * el terreno, y del catálogo de formas de movimiento.
 *
 * **Los DOIs no se inventaron.** Los dos ensayos de interrumpir la silla, el NEAT, la luz exterior y
 * el calzado minimalista salen de los comentarios de `pillarBibliography.ts`, que ya explicaban qué
 * afirmación sostenía cada uno. Los diecinueve estudios restantes de este pilar describen el daño
 * del sedentarismo —por qué el pilar existe— y no una acción concreta: se quedan en
 * `pillar_studies` sin colgar de ninguna práctica, que es exactamente para lo que esa tabla existe.
 */
import type { PracticeSeed } from "./practiceSeed";

/** La advertencia del ritual, que ya vive en `atomicChallenges.movementExperience.safety`. */
const MOVEMENT_SAFETY_ES =
  "Adapta el movimiento a tu capacidad, tu espacio y tus apoyos: si usas silla, muletas o bastón, tu forma de desplazarte cuenta igual. Detente si algo no se siente seguro y sigue las indicaciones de tus profesionales de salud.";
const MOVEMENT_SAFETY_EN =
  "Adapt the movement to your capacity, your space and your supports: if you use a wheelchair, crutches or a cane, your way of moving counts just the same. Stop if something does not feel safe, and follow what your health professionals tell you.";

export const MOVEMENT_PRACTICE_SEED: readonly PracticeSeed[] = [
  {
    key: "movement-living-movement",
    challengeKey: "movement-two-minutes-v1",
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.2337/dc11-1931", "10.1152/japplphysiol.00796.2020"],
    es: {
      title: "Movimiento vivo, local y funcional",
      summary:
        "Dos anclas hacen contar la repetición: un trayecto corto sin motor y dos minutos de pie por cada cincuenta de silla. Los puntos cuentan días, no volumen.",
      howTo:
        "Alargarlo le hace bien a tu cuerpo. El mínimo es un piso, no un techo, y nadie compite por intensidad ni distancia.",
      safetyNote: MOVEMENT_SAFETY_ES,
      cue: "El primer trayecto corto del día, y cada vez que lleves cincuenta minutos sentado.",
      minimum:
        "Un trayecto sin motor y dos minutos de pie, como tu cuerpo permita.",
    },
    en: {
      title: "Living, local, functional movement",
      summary:
        "Two anchors make the repetition count: one short trip under your own power, and two minutes on your feet for every fifty in a chair. Points count days, not volume.",
      howTo:
        "Doing more is good for your body. The minimum is a floor, not a ceiling, and nobody competes on intensity or distance.",
      safetyNote: MOVEMENT_SAFETY_EN,
      cue: "The first short trip of the day, and every time you have been sitting for fifty minutes.",
      minimum:
        "One trip under your own power and two minutes on your feet, however your body allows.",
    },
  },
  {
    key: "movement-break-the-chair",
    effortMinutes: 2,
    costLevel: 0,
    pillars: ["movement"],
    dois: [
      "10.2337/dc11-1931",
      "10.1152/japplphysiol.00796.2020",
      "10.7326/m14-1651",
    ],
    es: {
      title: "Dos minutos de pie cada cincuenta",
      summary:
        "Un par de minutos de sentadillas o de caminata cada media hora bajan la glucosa y la insulina posprandiales tanto como caminar seguido.",
      howTo:
        "Sentadillas, elevaciones de talones, movilidad de cadera y torácica. Como tu cuerpo permita.",
      safetyNote: MOVEMENT_SAFETY_ES,
      cue: "Cuando termines una llamada o cierres una pestaña.",
      minimum: "Ponerte de pie. Aunque sean treinta segundos.",
    },
    en: {
      title: "Two minutes on your feet every fifty",
      summary:
        "A couple of minutes of squats or walking every half hour lower post-meal glucose and insulin as much as a continuous walk does.",
      howTo:
        "Squats, calf raises, hip and thoracic mobility. However your body allows.",
      safetyNote: MOVEMENT_SAFETY_EN,
      cue: "When you end a call or close a tab.",
      minimum: "Standing up. Even for thirty seconds.",
    },
  },
  {
    key: "movement-no-motor",
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.1053/beem.2002.0227", "10.1016/j.pcad.2019.02.004"],
    es: {
      title: "El trayecto corto, sin motor",
      summary:
        "El gasto espontáneo de energía —el que no es ejercicio ni deporte— explica por qué motorizar los trayectos cortos pesa mucho más de lo que parece.",
      howTo:
        "El mercado, la tienda, la casa de alguien: a pie, en bici o con tu propio impulso.",
      safetyNote: MOVEMENT_SAFETY_ES,
      cue: "Cuando alcances las llaves del coche para un mandado cerca.",
    },
    en: {
      title: "The short trip, under your own power",
      summary:
        "Spontaneous energy expenditure — the kind that is neither exercise nor sport — explains why motorising short trips weighs far more than it looks.",
      howTo:
        "The market, the shop, someone's house: on foot, by bike, or under your own power.",
      safetyNote: MOVEMENT_SAFETY_EN,
      cue: "When you reach for the car keys for an errand nearby.",
    },
  },
  {
    key: "movement-outdoors-daily",
    effortMinutes: 25,
    costLevel: 0,
    // El puente medido con el descanso: la luz exterior adelanta el sueño.
    pillars: ["movement", "sleep"],
    dois: ["10.1073/pnas.2301608120"],
    es: {
      title: "De veinte a treinta minutos al aire libre",
      summary:
        "La exposición diaria a luz natural adelanta el sueño y reduce la somnolencia diurna.",
      howTo:
        "En tierra, pasto o sendero, mejor que sobre asfalto: el terreno irregular despierta el pie y el equilibrio.",
      cue: "Después de comer, o cuando la casa se quede en silencio.",
    },
    en: {
      title: "Twenty to thirty minutes outdoors",
      summary:
        "Daily exposure to natural light brings sleep earlier and reduces daytime sleepiness.",
      howTo:
        "On soil, grass or a trail rather than asphalt: uneven ground wakes up the foot and your balance.",
      cue: "After lunch, or when the house goes quiet.",
    },
  },
  {
    key: "movement-natural-terrain",
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.1038/s41598-021-98070-0"],
    es: {
      title: "Pisar terreno irregular",
      summary:
        "Pasto, tierra, arena y senderos obligan a corregir a cada paso: fortalecen el arco plantar y reparten los impactos.",
      howTo:
        "Caminar descalzo un rato sobre pasto o tierra limpia es la versión más simple, y no cuesta nada.",
      safetyNote: MOVEMENT_SAFETY_ES,
      cue: "Cuando pases junto a un parque o a un camino de tierra.",
    },
    en: {
      title: "Walking on uneven ground",
      summary:
        "Grass, soil, sand and trails force a correction at every step: they strengthen the arch of the foot and spread the impact.",
      howTo:
        "Walking barefoot for a while on grass or clean soil is the simplest version, and it costs nothing.",
      safetyNote: MOVEMENT_SAFETY_EN,
      cue: "When you pass a park or a dirt path.",
    },
  },
  {
    key: "movement-minimal-footwear",
    costLevel: 2,
    pillars: ["movement"],
    dois: ["10.1038/s41598-021-98070-0"],
    es: {
      title: "Calzado que deja trabajar al pie",
      summary:
        "Seis meses de actividad cotidiana con calzado sin soporte aumentan la fuerza del pie.",
      howTo:
        "Horma ancha para que los dedos se separen, suela flexible para sentir el suelo, y drop cero o bajo.",
      safetyNote:
        "Cambia de calzado poco a poco. Un pie acostumbrado a suela rígida y talón alto necesita semanas para adaptarse, y acelerar esa transición es la forma más común de lesionarse intentando cuidarse.",
      cue: "Al comprar zapatos, mirando la punta y la suela antes que el precio.",
    },
    en: {
      title: "Footwear that lets the foot work",
      summary:
        "Six months of everyday activity in unsupportive footwear increases foot strength.",
      howTo:
        "A wide toe box so the toes can spread, a flexible sole so the foot feels the ground, and zero or low drop.",
      safetyNote:
        "Change footwear gradually. A foot used to a rigid sole and a raised heel needs weeks to adapt, and rushing that transition is the most common way to get injured while trying to take care of yourself.",
      cue: "When buying shoes, looking at the toe box and the sole before the price.",
    },
  },
  {
    key: "movement-functional-strength",
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.1016/j.smhs.2019.08.006"],
    es: {
      title: "Fuerza útil, una vez por semana",
      summary:
        "Aumenta la densidad ósea, preserva masa muscular y estabiliza el centro del cuerpo.",
      howTo:
        "Calistenia en el parque, cargar garrafones o las compras, trabajo en el huerto, o una rutina guiada en el gimnasio de tu zona.",
      safetyNote: MOVEMENT_SAFETY_ES,
      cue: "El día de la semana que ya tienes libre, y siempre el mismo.",
    },
    en: {
      title: "Useful strength, once a week",
      summary:
        "It increases bone density, preserves muscle mass and stabilises your core.",
      howTo:
        "Calisthenics in the park, carrying water jugs or the shopping, work in the garden, or a guided routine at the gym near you.",
      safetyNote: MOVEMENT_SAFETY_EN,
      cue: "The day of the week you already have free, and always the same one.",
    },
  },
  {
    key: "movement-community-sport",
    costLevel: 0,
    // También de Mente: el deporte de conjunto es tejido comunitario, no sólo cardio.
    pillars: ["movement", "mindSpirit"],
    dois: ["10.1016/j.smhs.2019.08.006"],
    es: {
      title: "Deporte con gente",
      summary:
        "Fortalece el sistema cardiorrespiratorio y, de paso, recupera los espacios públicos que dejan de usarse cuando nadie sale.",
      howTo:
        "Un partido del barrio, una caminata en grupo, o una clase colectiva en un estudio de la zona.",
      cue: "Cuando alguien invite, y el fin de semana antes de que se llene.",
    },
    en: {
      title: "Sport with other people",
      summary:
        "It strengthens the cardiorespiratory system and, along the way, reclaims the public spaces that fall out of use when nobody goes out.",
      howTo:
        "A neighbourhood match, a group walk, or a class at a studio near you.",
      cue: "When somebody invites you, and at the weekend before it fills up.",
    },
  },
  {
    key: "movement-take-the-stairs",
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.1053/beem.2002.0227"],
    es: {
      title: "Subir por la escalera",
      summary:
        "Es gasto espontáneo, el que no aparece en ninguna rutina y decide buena parte del total del día.",
      howTo: "Y bajarte una parada antes, para hacer el último tramo a pie.",
      cue: "Al llegar frente al elevador.",
    },
    en: {
      title: "Taking the stairs",
      summary:
        "It is spontaneous expenditure — the kind that shows up in no routine and decides a good part of the daily total.",
      howTo: "And getting off one stop early, to walk the last stretch.",
      cue: "When you arrive in front of the lift.",
    },
  },
  {
    key: "movement-notice-vitality",
    effortMinutes: 2,
    costLevel: 0,
    pillars: ["movement"],
    dois: ["10.1037/a0016136"],
    es: {
      title: "Notar el triple impacto",
      summary:
        "Vitalidad en el cuerpo, gasolina que no se fue y vecinos con los que sí te cruzaste.",
      cue: "Al día siguiente, cuando te levantes.",
    },
    en: {
      title: "Noticing the triple impact",
      summary:
        "Vitality in your body, fuel you did not spend, and neighbours you actually ran into.",
      cue: "The next morning, when you get up.",
    },
  },
];
