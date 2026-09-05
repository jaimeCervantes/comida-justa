/**
 * Las prácticas del pilar de la mente, el espíritu y la comunidad cercana.
 *
 * Deduplicadas del ritual (`atomicChallenges.mindExperience`), del arraigo y la respiración, de las
 * ventanas de silencio y del catálogo de prácticas de presencia.
 *
 * **`mind-slow-breathing` es la práctica que justifica el modelo entero.** Estaba escrita dos veces
 * —en el catálogo de Sueño y en la nota de Mente— y las dos versiones se contradecían: una pedía
 * «alargar la salida del aire» y la otra decía explícitamente que eso NO es lo que sostiene la
 * evidencia, porque el ensayo de 2024 y su réplica no hallaron diferencia de HRV entre 1:1 y 1:2.
 * Aquí hay una sola redacción, y cita los dos estudios: el que sostiene la afirmación y el que acotó
 * su alcance.
 *
 * Los diecinueve estudios de hiperconectividad y aislamiento digital de este pilar describen el
 * problema, no una acción: se quedan en `pillar_studies` sin colgar de ninguna práctica.
 */
import type { PracticeSeed } from "./practiceSeed";

/** La advertencia del ritual, que ya vive en `atomicChallenges.mindExperience.safety`. */
const MIND_SAFETY_ES =
  "Esta práctica acompaña, no trata. Si la ansiedad, la tristeza o la soledad se sostienen en el tiempo, pedir ayuda profesional también es cuidar la mente, y es lo que corresponde hacer. Respeta límites, privacidad y disponibilidad: nadie está obligado a retomar un vínculo que no se siente seguro.";
const MIND_SAFETY_EN =
  "This practice accompanies; it does not treat. If anxiety, sadness or loneliness hold on over time, asking for professional help is also caring for your mind, and it is the right thing to do. Respect limits, privacy and availability: nobody is obliged to pick up a bond that does not feel safe.";

export const MIND_PRACTICE_SEED: readonly PracticeSeed[] = [
  {
    key: "mind-presence-and-peace",
    challengeKey: "mind-one-connection-v1",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1177/1745691614568352"],
    es: {
      title: "Presencia, paz y conexión local",
      summary:
        "Dos anclas hacen contar la repetición: abrir el día sin pantalla y darle presencia real a una persona.",
      howTo:
        "Salir a tomar aire, conversar de verdad con alguien y cerrar con gratitud o con un gesto a quien vive cerca.",
      safetyNote: MIND_SAFETY_ES,
      cue: "Los primeros minutos del día, y la primera conversación que tengas.",
      minimum: "Abrir el día sin pantalla y escuchar de verdad a una persona.",
    },
    en: {
      title: "Presence, peace and local connection",
      summary:
        "Two anchors make the repetition count: opening the day without a screen, and giving one person real presence.",
      howTo:
        "Step out for air, have a real conversation with someone, and close with gratitude or with a gesture towards someone who lives nearby.",
      safetyNote: MIND_SAFETY_EN,
      cue: "The first minutes of the day, and the first conversation you have.",
      minimum:
        "Opening the day without a screen and really listening to one person.",
    },
  },
  {
    key: "mind-real-presence",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1177/1745691614568352", "10.1177/0265407519836170"],
    es: {
      title: "Darle presencia real a alguien",
      summary:
        "La soledad y el aislamiento están a la altura de los factores de riesgo de mortalidad ya establecidos.",
      howTo:
        "De preferencia cara a cara y sin dispositivos a la vista. Si hoy no tienes a nadie cerca, una llamada sincera cuenta igual: lo que cuenta es escuchar de verdad, no el canal.",
      safetyNote: MIND_SAFETY_ES,
      cue: "Cuando alguien te hable, antes de contestar.",
      minimum: "Una persona, cinco minutos, sin el teléfono a la vista.",
    },
    en: {
      title: "Giving someone real presence",
      summary:
        "Loneliness and social isolation stand alongside the mortality risk factors already established.",
      howTo:
        "Face to face if you can, with no devices in sight. If there is nobody nearby today, an honest phone call counts the same: what counts is really listening, not the channel.",
      safetyNote: MIND_SAFETY_EN,
      cue: "When somebody speaks to you, before you answer.",
      minimum: "One person, five minutes, with the phone out of sight.",
    },
  },
  {
    key: "mind-screenless-morning",
    effortMinutes: 45,
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1371/journal.pone.0333493", "10.1080/00049530.2021.1898914"],
    es: {
      title: "Abrir el día sin pantalla",
      summary:
        "Los primeros treinta a sesenta minutos sin redes, notificaciones ni noticias: ese rato es para respirar, estirarte o simplemente estar.",
      howTo:
        "Dejar el teléfono cargando fuera del cuarto lo vuelve casi automático.",
      cue: "Al despertar, antes de tocar el teléfono.",
      minimum: "Los primeros diez minutos. Si son treinta, mejor.",
    },
    en: {
      title: "Opening the day without a screen",
      summary:
        "The first thirty to sixty minutes with no feeds, no notifications and no news: that stretch is for breathing, stretching or simply being.",
      howTo:
        "Leaving the phone charging outside the bedroom makes it almost automatic.",
      cue: "On waking, before you touch the phone.",
      minimum: "The first ten minutes. Thirty is better.",
    },
  },
  {
    key: "mind-digital-hygiene",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1002/wps.21188", "10.1371/journal.pone.0333493"],
    es: {
      title: "Higiene digital",
      summary:
        "Hace posible la presencia plena: quien está enfrente deja de competir con una pantalla.",
      howTo:
        "Comidas sin dispositivos en la mesa, bloques en «no molestar» para trabajar o descansar, y el teléfono fuera del cuarto por la noche.",
      cue: "Al sentarte a la mesa, y al empezar un bloque de trabajo.",
    },
    en: {
      title: "Digital hygiene",
      summary:
        "It makes full presence possible: the person in front of you stops competing with a screen.",
      howTo:
        "Meals with no devices on the table, blocks on «do not disturb» for work or rest, and the phone out of the bedroom at night.",
      cue: "As you sit down at the table, and as you start a block of work.",
    },
  },
  {
    key: "mind-slow-breathing",
    effortMinutes: 5,
    costLevel: 0,
    // La práctica compartida que prueba el modelo: es de Mente en portada y de Sueño también.
    // Hasta el slice 1 estaba escrita dos veces, y las dos versiones se contradecían.
    pillars: ["mindSpirit", "sleep"],
    dois: ["10.1038/s41598-021-98736-9", "10.1007/s10484-024-09637-2"],
    es: {
      title: "Respiración pausada",
      summary:
        "Una sola sesión de respiración lenta y profunda sube el tono vagal y baja la ansiedad.",
      howTo:
        "Baja las respiraciones por minuto y aflójate. No persigas una proporción exacta entre inhalar y exhalar: el ensayo que la probó, y su réplica, no hallaron diferencia, y perseguirla es la excusa habitual para abandonar creyendo que se hace mal. Si te marea, acorta los tiempos.",
      cue: "Cuando notes que se te aprieta el pecho o la mandíbula.",
      minimum: "Cuatro respiraciones lentas, sentado, donde estés.",
    },
    en: {
      title: "Slow breathing",
      summary:
        "A single session of deep, slow breathing raises vagal tone and lowers anxiety.",
      howTo:
        "Bring your breaths per minute down and loosen up. Do not chase an exact ratio between inhaling and exhaling: the trial that tested it, and its replication, found no difference, and chasing it is the usual excuse for quitting in the belief you are doing it wrong. If it makes you dizzy, shorten the counts.",
      cue: "When you notice your chest or your jaw tighten.",
      minimum: "Four slow breaths, sitting, wherever you are.",
    },
  },
  {
    key: "mind-outdoor-grounding",
    effortMinutes: 15,
    costLevel: 0,
    // El mismo rato al aire libre que ya pide Movimiento, no una salida más en la agenda.
    pillars: ["mindSpirit", "movement"],
    dois: ["10.1016/j.envres.2023.116303"],
    es: {
      title: "Arraigo al aire libre",
      summary:
        "La exposición a espacios verdes se asocia con menos depresión y menos ansiedad.",
      howTo:
        "De diez a quince minutos en el parque, el jardín o el sendero más cercano: luz en la cara, pies en tierra o pasto, y el sonido del lugar donde vives.",
      cue: "Cuando la cabeza empiece a dar vueltas sobre lo mismo.",
    },
    en: {
      title: "Grounding outdoors",
      summary:
        "Exposure to green space is associated with less depression and less anxiety.",
      howTo:
        "Ten to fifteen minutes in the nearest park, garden or trail: light on your face, feet on soil or grass, and the sound of the place where you live.",
      cue: "When your head starts going round the same thing.",
    },
  },
  {
    key: "mind-listen-without-preparing",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1177/0265407519836170"],
    es: {
      title: "Escuchar sin preparar la respuesta",
      summary:
        "Afina la inteligencia emocional y disuelve la sensación de aislamiento, de los dos lados.",
      howTo: "Sin mirar el teléfono, y sin ir armando lo que vas a decir.",
      cue: "Cuando notes que ya estás armando tu respuesta.",
    },
    en: {
      title: "Listening without preparing your reply",
      summary:
        "It sharpens emotional intelligence and dissolves the feeling of isolation, on both sides.",
      howTo:
        "Without looking at your phone, and without assembling what you are going to say.",
      cue: "When you catch yourself assembling your reply.",
    },
  },
  {
    key: "mind-neighbour-talk",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1177/1745691614568352", "10.30935/ojcmt/14171"],
    es: {
      title: "Platicar con quien vive cerca",
      summary:
        "Genera la confianza de barrio que hace que la gente se ayude sin que nadie lo organice.",
      howTo:
        "Saludar y platicar con vecinos y con quien te vende en el mercado. Cuenta igual que una conversación larga.",
      cue: "Al cruzarte con alguien en la escalera, la banqueta o el mercado.",
    },
    en: {
      title: "Talking with the people who live nearby",
      summary:
        "It builds the neighbourhood trust that gets people helping each other without anyone organising it.",
      howTo:
        "Greeting and chatting with neighbours and with whoever sells to you at the market. It counts the same as a long conversation.",
      cue: "When you cross paths with someone on the stairs, the pavement or at the market.",
    },
  },
  {
    key: "mind-gratitude",
    effortMinutes: 5,
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1037/0022-3514.84.2.377"],
    es: {
      title: "Cerrar el día con gratitud",
      summary:
        "Tres cosas que agradeces de tu entorno, anotadas al cerrar el día.",
      howTo: "De tu entorno, no de ti: el ejercicio es mirar afuera.",
      cue: "Al apagar la luz, antes de dormirte.",
      minimum: "Una cosa. Una basta.",
    },
    en: {
      title: "Closing the day with gratitude",
      summary:
        "Three things you are grateful for in your surroundings, written down as the day closes.",
      howTo:
        "About your surroundings, not about you: the exercise is to look outward.",
      cue: "When you turn out the light, before you fall asleep.",
      minimum: "One thing. One is enough.",
    },
  },
  {
    key: "mind-community-service",
    costLevel: 0,
    pillars: ["mindSpirit"],
    dois: ["10.1177/1745691614568352"],
    es: {
      title: "Echar una mano en el barrio",
      summary:
        "Crea redes de apoyo mutuo que sostienen cuando algo va mal, y una autoestima que se apoya en hechos.",
      howTo:
        "Un huerto comunitario, una jornada de limpieza, un mercado artesanal, o simplemente ayudar a un vecino.",
      safetyNote: MIND_SAFETY_ES,
      cue: "Cuando veas un aviso en el barrio, o cuando alguien pida ayuda.",
    },
    en: {
      title: "Lending a hand in your neighbourhood",
      summary:
        "It creates mutual support networks that hold when something goes wrong, and self-esteem that rests on facts.",
      howTo:
        "A community garden, a clean-up day, a craft market, or simply helping a neighbour.",
      safetyNote: MIND_SAFETY_EN,
      cue: "When you see a notice in the neighbourhood, or when somebody asks for help.",
    },
  },
  {
    key: "mind-tend-plants",
    costLevel: 1,
    // También de Alimentación: un huerto es presencia y es despensa.
    pillars: ["mindSpirit", "nutrition"],
    dois: ["10.1016/j.envres.2023.116303"],
    es: {
      title: "Cuidar plantas o un huerto",
      summary:
        "Corta la rumiación dándole a la cabeza algo concreto que atender, y de paso acerca la despensa.",
      howTo: "Una maceta cuenta. No hace falta un terreno.",
      cue: "Con el café de la mañana, mirando si necesitan agua.",
    },
    en: {
      title: "Tending plants or a garden",
      summary:
        "It cuts rumination by giving your head something concrete to attend to, and brings the pantry closer along the way.",
      howTo: "A single pot counts. You do not need a plot of land.",
      cue: "With the morning coffee, checking whether they need water.",
    },
  },
];
