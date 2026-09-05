/**
 * Las prácticas del pilar de la alimentación.
 *
 * Deduplicadas del ritual (`atomicChallenges.nutritionExperience`), de la triada del plato, de la
 * cocina limpia y del catálogo de ingredientes de proximidad.
 *
 * **Los DOIs no se inventaron.** Salen de los comentarios de `pillarBibliography.ts` —la
 * crononutrición, los aldehídos, el punto de humo del aguacate— y de títulos de Crossref que dicen
 * sin ambigüedad de qué tratan. Cuatro prácticas se quedan con la lista vacía: la triada, sus tres
 * componentes y cenar en presencia son buenas decisiones, pero ninguno de los 116 estudios de esta
 * bibliografía las mide. Prestarles la evidencia de los ultraprocesados sería exactamente la
 * autoridad de segunda mano que este catálogo vino a deshacer.
 */
import type { PracticeSeed } from "./practiceSeed";

/** La advertencia del ritual, que ya vive en `atomicChallenges.nutritionExperience.safety`. */
const NUTRITION_SAFETY_ES =
  "Esta práctica no prescribe una dieta ni reemplaza indicaciones clínicas. Adáptala a tus alergias, intolerancias, horarios de trabajo y acceso, y a las recomendaciones de tus profesionales de salud.";
const NUTRITION_SAFETY_EN =
  "This practice does not prescribe a diet and does not replace clinical advice. Adapt it to your allergies, intolerances, working hours and access, and to what your health professionals recommend.";

export const NUTRITION_PRACTICE_SEED: readonly PracticeSeed[] = [
  {
    key: "nutrition-real-dinner",
    challengeKey: "nutrition-one-plant-v1",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: ["10.1073/pnas.1418955112", "10.1111/dom.13391"],
    es: {
      title: "Cena real, local y al atardecer",
      summary:
        "Dos anclas hacen contar la repetición: cenar con la caída del sol y servir la triada con una planta más. Se calcula a ojo, sin báscula y sin contar calorías.",
      howTo:
        "Abastécete cerca, fija la hora, cocina limpio, sirve medio plato de vegetales con un cuarto de proteína y un cuarto de carbohidrato del territorio, y cena sin pantallas.",
      safetyNote: NUTRITION_SAFETY_ES,
      cue: "Cuando empieces a preparar la cena.",
      minimum: "Medio plato de verduras y la hora. Lo demás ayuda.",
    },
    en: {
      title: "A real, local dinner at sunset",
      summary:
        "Two anchors make the repetition count: eating as the sun goes down, and serving the triad with one more plant. You eyeball it — no scales, no calorie counting.",
      howTo:
        "Source it nearby, fix the hour, cook clean, serve half a plate of vegetables with a quarter protein and a quarter carbohydrate from your region, and eat without screens.",
      safetyNote: NUTRITION_SAFETY_EN,
      cue: "When you start making dinner.",
      minimum: "Half a plate of vegetables and the hour. The rest helps.",
    },
  },
  {
    key: "nutrition-dinner-at-sunset",
    costLevel: 0,
    // También del descanso: cerrar temprano el ciclo digestivo le abre paso a la melatonina.
    pillars: ["nutrition", "sleep"],
    dois: ["10.1073/pnas.1418955112", "10.1111/dom.13391"],
    es: {
      title: "Cenar al atardecer",
      summary:
        "La tolerancia a la glucosa cae por la tarde-noche por el propio sistema circadiano, no sólo por el desorden de horarios.",
      howTo:
        "Sirve la cena entre las 6:00 y las 7:30 de la tarde, o al menos dos horas y media antes de dormir.",
      cue: "Cuando se ponga el sol, o dos horas y media antes de tu hora de dormir.",
    },
    en: {
      title: "Dinner at sunset",
      summary:
        "Glucose tolerance falls in the late afternoon and evening because of the circadian system itself, not only because of irregular schedules.",
      howTo:
        "Serve dinner between 6:00 and 7:30 pm, or at least two and a half hours before bed.",
      cue: "When the sun sets, or two and a half hours before your bedtime.",
    },
  },
  {
    key: "nutrition-one-more-plant",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [],
    es: {
      title: "Una planta más en el plato",
      summary:
        "El mínimo que hace contar la repetición: una hortaliza de temporada más de las que ibas a poner.",
      howTo:
        "Lo que esté fresco esta semana en el mercado. No hay lista correcta: hay temporada.",
      cue: "Al servir el plato, antes de sentarte.",
      minimum:
        "Una hortaliza más. Puede ser la que ya tenías en el refrigerador.",
    },
    en: {
      title: "One more plant on the plate",
      summary:
        "The minimum that makes the repetition count: one more seasonal vegetable than you were going to serve.",
      howTo:
        "Whatever is fresh at the market this week. There is no correct list; there is a season.",
      cue: "When you plate the food, before you sit down.",
      minimum: "One more vegetable. It can be the one already in the fridge.",
    },
  },
  {
    key: "nutrition-plate-triad",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [],
    es: {
      title: "Servir la triada del plato",
      summary:
        "Medio plato de vegetales, un cuarto de proteína y un cuarto de carbohidrato, más una porción de grasa sana. La proporción se ve, no se pesa.",
      howTo:
        "La grasa va aparte y no como cuarto bloque: no es una fracción del plato, es una porción que se suma.",
      cue: "Al servir, mirando el plato todavía vacío.",
    },
    en: {
      title: "Serving the plate triad",
      summary:
        "Half a plate of vegetables, a quarter protein and a quarter carbohydrate, plus a portion of healthy fat. You can see the proportion; you do not weigh it.",
      howTo:
        "The fat goes alongside, not as a fourth block: it is not a fraction of the plate, it is a portion you add.",
      cue: "As you serve, looking at the still-empty plate.",
    },
  },
  {
    key: "nutrition-clean-cooking",
    costLevel: 0,
    pillars: ["nutrition"],
    dois: ["10.1038/s41598-019-39767-1", "10.3389/fnut.2021.711640"],
    es: {
      title: "Cocinar limpio",
      summary:
        "Los aceites ricos en poliinsaturados generan órdenes de magnitud más aldehídos de oxidación al calentarse, y esos productos pasan al alimento.",
      howTo:
        "Vapor, freidora de aire o caldo casero. Si salteas, unas gotas y a fuego medio, no humeante.",
      cue: "Al encender la estufa.",
    },
    en: {
      title: "Cooking clean",
      summary:
        "Oils rich in polyunsaturates generate orders of magnitude more aldehydic oxidation products when heated, and those products transfer into the food.",
      howTo:
        "Steam, air fryer or homemade broth. If you sauté, a few drops over medium heat — never smoking.",
      cue: "When you turn the stove on.",
    },
  },
  {
    key: "nutrition-right-oil",
    costLevel: 2,
    pillars: ["nutrition"],
    dois: ["10.1016/b978-1-893997-97-4.50008-5", "10.1155/2022/6627013"],
    es: {
      title: "Elegir el aceite por su punto de humo",
      summary:
        "El aceite de aguacate aguanta 250 °C sin refinar y 271 °C refinado; el de oliva extra virgen se usa crudo o a fuego bajo.",
      howTo:
        "No confundas las dos cifras del aguacate: el punto alto es el del refinado, no el del prensado en frío.",
      cue: "Cuando alcances el aceite, antes de que se caliente.",
    },
    en: {
      title: "Choosing oil by its smoke point",
      summary:
        "Avocado oil holds 250 °C unrefined and 271 °C refined; extra virgin olive oil is for raw use or low heat.",
      howTo:
        "Do not mix up the two avocado figures: the high one belongs to the refined oil, not to the cold-pressed one.",
      cue: "When you reach for the oil, before it heats.",
    },
  },
  {
    key: "nutrition-real-food",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [
      "10.1016/s0140-6736(25)01565-x",
      "10.1146/annurev-food-111523-122028",
      "10.1093/advances/nmab049",
      "10.1098/rstb.2022.0214",
      "10.1136/bmjopen-2015-009892",
    ],
    es: {
      title: "Comida de verdad, no ultraprocesada",
      summary:
        "El grado de procesamiento —no sólo los nutrientes— es lo que se asocia con el riesgo cardiovascular y con el aumento de peso poblacional.",
      howTo:
        "Si la lista de ingredientes tiene cosas que no tendrías en tu cocina, es otra categoría de alimento.",
      cue: "Al tomar un paquete del estante, antes de ponerlo en el carrito.",
    },
    en: {
      title: "Real food, not ultra-processed",
      summary:
        "The degree of processing — not only the nutrients — is what is associated with cardiovascular risk and with population weight gain.",
      howTo:
        "If the ingredient list has things you would not keep in your kitchen, it is a different category of food.",
      cue: "When you take a package off the shelf, before it goes in the cart.",
    },
  },
  {
    key: "nutrition-local-sourcing",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [
      "10.1016/j.jclepro.2022.133155",
      "10.1002/fft2.173",
      "10.1016/s2542-5196(20)30177-7",
      "10.1108/bfj-07-2016-0321",
    ],
    es: {
      title: "Abastecerte cerca y a granel",
      summary:
        "Acorta la cadena entera: menos empaque, menos flete y el dinero en manos de quien produce en tu zona.",
      howTo:
        "Mercado, tianguis o pequeño productor, de temporada, con tus propias bolsas y frascos.",
      cue: "El día que te toca el mandado, antes de salir de casa.",
      minimum: "Una cosa del mercado en vez del súper.",
    },
    en: {
      title: "Sourcing nearby and in bulk",
      summary:
        "It shortens the whole chain: less packaging, less freight, and the money in the hands of whoever grows it near you.",
      howTo:
        "Market, street market or small producer, in season, with your own bags and jars.",
      cue: "On shopping day, before you leave the house.",
      minimum: "One thing from the market instead of the supermarket.",
    },
  },
  {
    key: "nutrition-regional-protein",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [],
    es: {
      title: "Proteína regional",
      summary: "Aminoácidos y saciedad sin sobrecargar la digestión nocturna.",
      howTo:
        "Leguminosas a granel, huevo de granja cercana de libre pastoreo, pesca local sustentable o aves de pastoreo.",
      cue: "Al planear la cena de mañana.",
    },
    en: {
      title: "Regional protein",
      summary:
        "Amino acids and satiety without overloading night-time digestion.",
      howTo:
        "Bulk legumes, free-range eggs from a nearby farm, sustainable local fish or pasture-raised poultry.",
      cue: "When you plan tomorrow's dinner.",
    },
  },
  {
    key: "nutrition-territory-carbs",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [],
    es: {
      title: "Carbohidratos del territorio",
      summary:
        "Energía de liberación lenta y fibra que alimenta a la microbiota, sin picos bruscos de glucosa.",
      howTo:
        "Tubérculos de la zona, maíz criollo nixtamalizado, calabaza criolla o cereales integrales a granel.",
      cue: "Cuando decidas qué acompaña el plato.",
    },
    en: {
      title: "Carbohydrates from your territory",
      summary:
        "Slow-release energy and fibre that feeds the microbiota, without sharp glucose spikes.",
      howTo:
        "Local tubers, nixtamalised native maize, native squash or bulk whole grains.",
      cue: "When you decide what goes alongside the plate.",
    },
  },
  {
    key: "nutrition-healthy-fats",
    costLevel: 1,
    pillars: ["nutrition"],
    dois: [],
    es: {
      title: "Grasas sanas de la región",
      summary: "Sin ellas no se absorben las vitaminas A, D, E y K.",
      howTo:
        "Aguacate de huertos cercanos, semillas a granel o una crema artesanal sin aditivos.",
      cue: "Ya servido el plato, antes de llevarlo a la mesa.",
    },
    en: {
      title: "Healthy fats from your region",
      summary: "Without them, vitamins A, D, E and K are not absorbed.",
      howTo:
        "Avocado from nearby orchards, bulk seeds, or an artisanal nut butter with no additives.",
      cue: "Once the plate is served, before you carry it to the table.",
    },
  },
  {
    key: "nutrition-eat-in-presence",
    costLevel: 0,
    // También de Mente: es la misma higiene digital, vista desde la mesa.
    pillars: ["nutrition", "mindSpirit"],
    dois: [],
    es: {
      title: "Cenar en presencia",
      summary:
        "Sin pantallas, masticando despacio y reconociendo de dónde vino cada cosa.",
      howTo:
        "Los dispositivos, fuera de la mesa. Los de todos, no sólo el tuyo.",
      cue: "Al sentarte a la mesa, antes del primer bocado.",
      minimum: "Los teléfonos fuera de la mesa. Boca abajo no cuenta.",
    },
    en: {
      title: "Eating with presence",
      summary:
        "No screens, chewing slowly, and recognising where each thing came from.",
      howTo: "Devices off the table. Everyone's, not just yours.",
      cue: "As you sit down at the table, before the first bite.",
      minimum: "Phones off the table. Face down does not count.",
    },
  },
];
