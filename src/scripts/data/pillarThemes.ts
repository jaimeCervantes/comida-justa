/**
 * Los temas del catálogo de cada pilar.
 *
 * Un tema agrupa **parte** de las prácticas de su pilar y añade lo que la práctica suelta no dice:
 * qué le hace al cuerpo y qué le hace al entorno. Los dos impactos van juntos y no en una sección de
 * sostenibilidad aparte — son la misma decisión, y separarlos volvería opcional la mitad que sostiene
 * al barrio.
 *
 * **Un solo modelo, dos granularidades.** En Movimiento y Mente un tema agrupa tres acciones
 * distintas; en Alimentación agrupa una o dos, porque sus cuatro «ítems» de catálogo eran cuatro
 * opciones de la misma acción y viven dentro de su `how_to`. No se partieron: «comer frijol» y
 * «comer huevo de granja» no son dos hábitos, son dos maneras de hacer uno.
 *
 * **No toda práctica tiene tema, y eso significa algo.** Los cuatro rituales no están en ninguno
 * —son la práctica insignia del pilar, no una fila de su catálogo—, y en Alimentación el catálogo
 * trata de ingredientes, así que las prácticas sobre *cómo* se come se quedan fuera.
 *
 * Los textos se mudaron literalmente de `pillarPages.*.catalog*`, que era donde vivían.
 */
import type { PillarKey } from "~/domain/pillars/pillarKey";

export type ThemeTranslationSeed = {
  title: string;
  /** Lo que le hace a quien lo practica. */
  bodyImpact: string;
  /** Lo que le hace a su entorno y a la economía de la zona. */
  localImpact: string;
};

export type PillarThemeSeed = {
  key: string;
  pillar: PillarKey;
  sortOrder: number;
  /** Las claves de las prácticas que agrupa, en el orden en que se enseñan. */
  practices: readonly string[];
  es: ThemeTranslationSeed;
  en: ThemeTranslationSeed;
};

export const PILLAR_THEME_SEED: readonly PillarThemeSeed[] = [
  {
    key: "sleep-light",
    pillar: "sleep",
    sortOrder: 10,
    practices: ["sleep-morning-sunlight", "sleep-sunset-light"],
    es: {
      title: "Anclaje de luz solar",
      bodyImpact:
        "Ajusta el reloj interno, levanta el ánimo por la mañana y programa la melatonina de la noche siguiente.",
      localImpact:
        "Saca la vida a la calle a las horas en que el barrio está despierto, y ahorra luz artificial durante el día.",
    },
    en: {
      title: "Anchoring with sunlight",
      bodyImpact:
        "Sets the body clock, lifts your mood in the morning and schedules the following night’s melatonin.",
      localImpact:
        "Brings life onto the street at the hours the neighbourhood is awake, and saves artificial light during the day.",
    },
  },
  {
    key: "sleep-environment",
    pillar: "sleep",
    sortOrder: 20,
    practices: [
      "sleep-dim-the-house",
      "sleep-cool-room",
      "sleep-dark-room",
      "sleep-phone-out",
      "sleep-bed-for-sleep",
    ],
    es: {
      title: "Ambiente y control de estímulos",
      bodyImpact:
        "Sube la melatonina propia, corta la estimulación de última hora y acorta el tiempo que tardas en dormirte.",
      localImpact:
        "Baja el consumo eléctrico de la casa y aporta menos luz derramada a la noche de la comunidad.",
    },
    en: {
      title: "Environment and stimulus control",
      bodyImpact:
        "Raises your own melatonin, cuts late-hour stimulation and shortens the time it takes you to fall asleep.",
      localImpact:
        "Lowers the household’s electricity use and adds less spilled light to the community’s night.",
    },
  },
  {
    key: "sleep-calm",
    pillar: "sleep",
    sortOrder: 30,
    practices: [
      "sleep-mental-unload",
      "sleep-caffeine-free-infusion",
      "sleep-paper-book",
    ],
    es: {
      title: "Cierre mental y calma",
      bodyImpact:
        "Libera la cabeza de lo pendiente, frena la rumiación y baja el pulso para entrar a la cama en calma.",
      localImpact:
        "Se apoya en plantas que se consiguen a granel y de temporada, en vez de en una compra envasada más.",
    },
    en: {
      title: "Mental closure and calm",
      bodyImpact:
        "Frees your head of what is pending, stops rumination and slows the pulse so you get into bed calm.",
      localImpact:
        "Leans on plants you can buy in bulk and in season, rather than on one more packaged purchase.",
    },
  },
  {
    key: "nutrition-proteins",
    pillar: "nutrition",
    sortOrder: 10,
    practices: ["nutrition-regional-protein"],
    es: {
      title: "Proteínas de calidad",
      bodyImpact:
        "Aminoácidos completos para la reparación celular, saciedad prolongada y una digestión que no pesa por la noche.",
      localImpact:
        "Comprarlas a granel elimina empaques plásticos y la refrigeración industrial prolongada. El dinero llega directo a las familias agrícolas y ganaderas de la zona.",
    },
    en: {
      title: "Quality protein",
      bodyImpact:
        "Complete amino acids for cell repair, lasting satiety and digestion that does not sit heavy at night.",
      localImpact:
        "Buying in bulk removes plastic packaging and long industrial refrigeration. The money goes straight to farming families in your area.",
    },
  },
  {
    key: "nutrition-carbs",
    pillar: "nutrition",
    sortOrder: 20,
    practices: ["nutrition-territory-carbs"],
    es: {
      title: "Carbohidratos complejos",
      bodyImpact:
        "Energía de liberación gradual, fibra prebiótica que alimenta la microbiota y ningún pico brusco de glucosa e insulina.",
      localImpact:
        "Reduce drásticamente las millas alimentarias y los fletes, preserva la biodiversidad de semillas nativas y evita la degradación de suelo del monocultivo.",
    },
    en: {
      title: "Complex carbohydrates",
      bodyImpact:
        "Slow-release energy, prebiotic fibre that feeds the microbiota, and no sharp glucose or insulin spikes.",
      localImpact:
        "Cuts food miles and freight sharply, preserves the biodiversity of native seed and avoids the soil degradation of monoculture.",
    },
  },
  {
    key: "nutrition-fats",
    pillar: "nutrition",
    sortOrder: 30,
    practices: ["nutrition-healthy-fats"],
    es: {
      title: "Grasas saludables",
      bodyImpact:
        "Permiten absorber las vitaminas A, D, E y K, regulan el sistema hormonal y modulan la respuesta inflamatoria.",
      localImpact:
        "Sostienen a pequeños procesadores de la región y se pueden comprar en frascos de cristal reutilizables, sin plástico descartable.",
    },
    en: {
      title: "Healthy fats",
      bodyImpact:
        "They let you absorb vitamins A, D, E and K, regulate the hormonal system and modulate the inflammatory response.",
      localImpact:
        "They keep small regional processors going and can be bought in reusable glass jars, with no disposable plastic.",
    },
  },
  {
    key: "nutrition-oils",
    pillar: "nutrition",
    sortOrder: 40,
    practices: ["nutrition-clean-cooking", "nutrition-right-oil"],
    es: {
      title: "Aceites sanos y cocción limpia",
      bodyImpact:
        "Estabilidad térmica y grasas no oxidadas: menos estrés celular y protección cardiovascular.",
      localImpact:
        "Desplaza ultraprocesados enlatados o embotellados en plástico, y reduce la huella de transporte y los desechos grasos industriales.",
    },
    en: {
      title: "Good oils and clean cooking",
      bodyImpact:
        "Thermal stability and fats that are not oxidised: less cellular stress and cardiovascular protection.",
      localImpact:
        "Displaces ultra-processed food tinned or bottled in plastic, and cuts the transport footprint and industrial fat waste.",
    },
  },
  {
    key: "movement-proximity",
    pillar: "movement",
    sortOrder: 10,
    practices: [
      "movement-no-motor",
      "movement-break-the-chair",
      "movement-take-the-stairs",
    ],
    es: {
      title: "Proximidad y pausas activas",
      bodyImpact:
        "Mantiene activo el metabolismo de grasas y glucosa, alivia la tensión de la espalda baja y reactiva la circulación de las piernas.",
      localImpact:
        "Cero emisiones en los trayectos cortos, ahorro directo en gasolina y transporte, y calles con gente que vuelve a encontrarse.",
    },
    en: {
      title: "Proximity and active breaks",
      bodyImpact:
        "Keeps fat and glucose metabolism active, relieves tension in the lower back and gets the legs circulating again.",
      localImpact:
        "Zero emissions on short trips, direct savings on fuel and transport, and streets with people running into each other again.",
    },
  },
  {
    key: "movement-terrain",
    pillar: "movement",
    sortOrder: 20,
    practices: [
      "movement-natural-terrain",
      "movement-minimal-footwear",
      "movement-outdoors-daily",
    ],
    es: {
      title: "Biomecánica y terreno natural",
      bodyImpact:
        "Fortalece el arco plantar, mejora el equilibrio, alinea la columna y reparte los impactos de forma natural.",
      localImpact:
        "Da razones para cuidar y conservar senderos, parques y áreas verdes de la zona, y no depende de equipamiento plástico desechable.",
    },
    en: {
      title: "Biomechanics and natural ground",
      bodyImpact:
        "Strengthens the arch, improves balance, aligns the spine and spreads impact naturally.",
      localImpact:
        "Gives reasons to look after and preserve local trails, parks and green spaces, and does not depend on disposable plastic gear.",
    },
  },
  {
    key: "movement-strength",
    pillar: "movement",
    sortOrder: 30,
    practices: ["movement-functional-strength"],
    es: {
      title: "Fuerza funcional y trabajo de campo",
      bodyImpact:
        "Aumenta la densidad ósea, preserva masa muscular, mejora la fuerza de agarre y estabiliza el centro del cuerpo.",
      localImpact:
        "Aprovecha la infraestructura que ya existe, sostiene a los negocios de ejercicio del barrio y, con el huerto, empuja la soberanía alimentaria.",
    },
    en: {
      title: "Functional strength and field work",
      bodyImpact:
        "Increases bone density, preserves muscle mass, improves grip strength and stabilises the core.",
      localImpact:
        "Uses the infrastructure that already exists, sustains the neighbourhood’s exercise businesses and, with a garden, pushes food sovereignty along.",
    },
  },
  {
    key: "movement-endurance",
    pillar: "movement",
    sortOrder: 40,
    practices: ["movement-community-sport"],
    es: {
      title: "Resistencia y deporte de comunidad",
      bodyImpact:
        "Fortalece el sistema cardiorrespiratorio, baja los niveles de cortisol y libera endorfinas.",
      localImpact:
        "Teje comunidad, reduce el aislamiento, crea pertenencia y recupera los espacios públicos que dejan de usarse cuando nadie sale.",
    },
    en: {
      title: "Endurance and community sport",
      bodyImpact:
        "Strengthens the cardiorespiratory system, lowers cortisol levels and releases endorphins.",
      localImpact:
        "Weaves community, reduces isolation, creates belonging and reclaims the public spaces that fall out of use when nobody goes out.",
    },
  },
  {
    key: "mind-digital",
    pillar: "mindSpirit",
    sortOrder: 10,
    practices: ["mind-screenless-morning", "mind-digital-hygiene"],
    es: {
      title: "Higiene digital y ayuno de pantallas",
      bodyImpact:
        "Baja la ansiedad por comparación, devuelve la capacidad de concentrarse y protege el sueño profundo del Pilar 1.",
      localImpact:
        "Hace posible la presencia plena en la conversación: quien está enfrente deja de competir con una pantalla.",
    },
    en: {
      title: "Digital hygiene and screen fasting",
      bodyImpact:
        "Lowers comparison anxiety, gives back the ability to concentrate and protects the deep sleep of Pillar 1.",
      localImpact:
        "Makes full presence in conversation possible: whoever is in front of you stops competing with a screen.",
    },
  },
  {
    key: "mind-nature",
    pillar: "mindSpirit",
    sortOrder: 20,
    practices: [
      "mind-outdoor-grounding",
      "mind-slow-breathing",
      "mind-tend-plants",
    ],
    es: {
      title: "Arraigo y contemplación en la naturaleza",
      bodyImpact:
        "Calma el sistema nervioso, baja el cortisol y corta la rumiación de pensamientos que giran en círculo.",
      localImpact:
        "Despierta el aprecio por el ecosistema cercano y da razones para conservar los espacios verdes del barrio o del municipio.",
    },
    en: {
      title: "Grounding and contemplation in nature",
      bodyImpact:
        "Calms the nervous system, lowers cortisol and cuts through thoughts that keep going round in circles.",
      localImpact:
        "Wakes up appreciation for the nearby ecosystem and gives reasons to preserve the green spaces of the neighbourhood.",
    },
  },
  {
    key: "mind-dialogue",
    pillar: "mindSpirit",
    sortOrder: 30,
    practices: [
      "mind-real-presence",
      "mind-listen-without-preparing",
      "mind-neighbour-talk",
      "mind-gratitude",
    ],
    es: {
      title: "Diálogo presencial y gratitud",
      bodyImpact:
        "Cultiva un optimismo con los pies en la tierra, afina la inteligencia emocional y disuelve la sensación de aislamiento.",
      localImpact:
        "Humaniza la vida diaria y genera la confianza de barrio que hace que la gente se ayude sin que nadie lo organice.",
    },
    en: {
      title: "Face-to-face dialogue and gratitude",
      bodyImpact:
        "Grows an optimism with its feet on the ground, sharpens emotional intelligence and dissolves the feeling of isolation.",
      localImpact:
        "Humanises daily life and builds the neighbourhood trust that makes people help each other without anyone organising it.",
    },
  },
  {
    key: "mind-service",
    pillar: "mindSpirit",
    sortOrder: 40,
    practices: ["mind-community-service"],
    es: {
      title: "Servicio y cooperación comunitaria",
      bodyImpact:
        "Da sentido de propósito y pertenencia, corta la apatía y construye una autoestima que se apoya en hechos.",
      localImpact:
        "Crea redes de apoyo mutuo que sostienen cuando algo va mal, y convierten al entorno cercano en un lugar seguro.",
    },
    en: {
      title: "Service and community cooperation",
      bodyImpact:
        "Gives a sense of purpose and belonging, cuts apathy and builds self-esteem that rests on actual deeds.",
      localImpact:
        "Creates mutual support networks that hold when something goes wrong, and turn the nearby surroundings into a safe place.",
    },
  },
];
