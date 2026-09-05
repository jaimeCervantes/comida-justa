/**
 * La bibliografía de cada pilar: qué estudios forman su cuerpo de evidencia.
 *
 * Vivía en `src/app/[locale]/pilares/components/references.ts`, donde era lo que la página pintaba.
 * Desde que la tabla `pillar_studies` la guarda, la página lee de la base y esta lista es lo que la
 * **siembra**: la fuente de la que salen las 116 filas de `studies` y sus vínculos con cada pilar.
 *
 * Los DOIs van **sin** el prefijo `https://doi.org/`: el DOI es el identificador y la URL es una
 * forma de resolverlo, que ya escribe `doiUrl()` una sola vez.
 *
 * Los comentarios se conservan tal cual. Explican qué afirmación sostiene cada estudio que se fue
 * añadiendo, y son justo lo que se convirtió en filas de `practice_studies`: el vínculo que antes
 * sólo veía quien leía el repositorio.
 */
export const SLEEP_BIBLIOGRAPHY: readonly string[] = [
  "10.1038/tp.2016.262",
  "10.1177/23727322231193967",
  "10.1016/j.lfs.2017.02.008",
  "10.1098/rstb.2014.0120",
  "10.2174/0122106766390602251012162712",
  "10.1073/pnas.1901824116",
  "10.1093/sleep/zsz067.037",
  "10.1007/s11818-019-00215-x",
  "10.1038/s41598-020-75622-4",
  "10.1080/09291016.2022.2151763",
  "10.3390/ijms24043392",
  "10.1016/j.ygcen.2025.114822",
  "10.1021/acsomega.3c05620",
  "10.1016/j.envpol.2023.121321",
  "10.1016/j.scitotenv.2020.139334",
  "10.3109/07420528.2015.1073158",
  "10.3322/caac.21218",
  "10.1002/jez.70023",
  "10.3390/ijerph19031849",
  "10.1007/s00281-021-00899-0",
  "10.1016/j.arr.2024.102457",
  "10.1098/rsfs.2019.0092",
  "10.1111/jsr.12371",
  "10.1016/j.pcad.2023.02.005",
  "10.1177/15598276251346752",
  "10.1038/s41583-023-00764-z",
  "10.5664/jcsm.9476",
  "10.1016/j.sleep.2016.08.006",
  "10.1111/jsr.13598",
  "10.3390/children8070542",
  "10.1016/j.jsmc.2022.03.001",
  "10.1016/j.biopsych.2025.06.002",
  "10.1146/annurev-psych-010213-115205",
  "10.1164/rccm.1996p11",
  "10.3934/neuroscience.2016.1.67",
  "10.1016/j.pcad.2008.10.003",
  "10.22289/2446-922x.v10n1a30",
  "10.1007/164_2018_140",
  "10.1016/s2468-2667(23)00182-2",
  "10.1016/j.sleep.2020.07.048",
  /*
   * Lo que el ritual circadiano añadió y la lista anterior no sostenía.
   *
   * Luz de casa por la noche: la luz de una habitación normal antes de dormir retrasó el inicio de
   * la melatonina en el 99 % de las personas y acortó su duración unos 90 minutos. Es la evidencia
   * del paso de atenuar la casa una hora antes.
   */
  "10.1210/jc.2010-2098",
  /*
   * Cuarto fresco: el ambiente térmico cambia la arquitectura del sueño; el calor recorta sueño
   * profundo y REM. Sostiene la condición «fresco y ventilado» del santuario.
   */
  "10.1186/1880-6805-31-14",
  /*
   * Descarga mental: escribir la lista de pendientes cinco minutos antes de acostarse hizo dormirse
   * antes que escribir lo ya hecho, medido con polisomnografía. De ahí salen los cinco minutos y el
   * «pendientes, no lo ya hecho» de esa sección.
   */
  "10.1037/xge0000374",
];

export const NUTRITION_BIBLIOGRAPHY: readonly string[] = [
  "10.1111/obr.13126",
  "10.1017/s1368980017000234",
  "10.1111/1541-4337.13204",
  "10.3389/fnut.2021.748847",
  "10.3389/fsufs.2021.644559",
  "10.1016/s0140-6736(25)01565-x",
  "10.1108/bfj-07-2016-0321",
  "10.1146/annurev-food-111523-122028",
  "10.1016/s2542-5196(20)30177-7",
  "10.1136/bmjopen-2015-009892",
  "10.1002/fft2.173",
  "10.1093/cdn/nzy077",
  "10.1098/rstb.2022.0214",
  "10.1111/obr.12174",
  "10.1016/j.jclepro.2022.133155",
  "10.1093/advances/nmab049",
  "10.34172/ijhpm.2022.6443",
  "10.1111/1541-4337.13331",
  "10.1155/2022/6627013",
  "10.3390/su12156280",
  /*
   * Las tres afirmaciones que el ritual de la cena añadió y que la lista anterior no sostenía.
   *
   * Crononutrición: la tolerancia a la glucosa cae por la tarde-noche por el sistema circadiano
   * endógeno, no solo por el desorden de horarios (PNAS 2015), y el efecto se explica sobre todo
   * por la respuesta de la célula beta (Diabetes Obes Metab 2018).
   */
  "10.1073/pnas.1418955112",
  "10.1111/dom.13391",
  /*
   * Aldehídos: los aceites ricos en poliinsaturados generan órdenes de magnitud más productos
   * aldehídicos de oxidación al calentarse que los ricos en monoinsaturados, y esos productos
   * pasan al alimento (Sci Rep 2019; Front Nutr 2022).
   */
  "10.1038/s41598-019-39767-1",
  "10.3389/fnut.2021.711640",
  /*
   * Punto de humo del aceite de aguacate: 250 °C sin refinar y 271 °C refinado. Es la fuente de
   * la que salen esas dos cifras; conviene no confundirlas, que es justo lo que hace la mitad de
   * internet al atribuirle al prensado en frío el punto de humo del refinado.
   */
  "10.1016/b978-1-893997-97-4.50008-5",
];

export const MOVEMENT_BIBLIOGRAPHY: readonly string[] = [
  "10.4082/kjfm.24.0099",
  "10.1002/dmrr.2759",
  "10.54289/jcrmh2300131",
  "10.3389/fpubh.2022.1042413",
  "10.1007/s00125-015-3624-6",
  "10.1002/hpm.3070",
  "10.1016/j.smhs.2019.08.006",
  "10.70102/aej.2025.17.3.34",
  "10.1123/jpah.2019-0377",
  "10.1136/bjsports-2013-093107",
  "10.1016/j.eclinm.2022.101424",
  "10.3389/fpubh.2024.1358423",
  "10.7326/m14-1651",
  "10.1016/j.pcad.2019.02.004",
  "10.1016/j.artere.2019.04.001",
  "10.7326/m14-2552",
  "10.1123/jpah.2012-0423",
  "10.1007/s12603-019-1298-3",
  "10.37268/mjphm/vol.23/no.1/art.1816",
  /*
   * Lo que el ritual de la cadencia añadió y la lista anterior no sostenía.
   *
   * Interrumpir la silla: un par de minutos de sentadillas o de caminata cada media hora bajan la
   * glucosa y la insulina posprandiales tanto como caminar seguido (Diabetes Care 2012; J Appl
   * Physiol 2021). Es la evidencia del bloque «cada 50 minutos».
   */
  "10.2337/dc11-1931",
  "10.1152/japplphysiol.00796.2020",
  /*
   * El gasto espontáneo de energía —el que no es ejercicio ni deporte— explica por qué motorizar
   * los trayectos cortos pesa mucho más de lo que parece.
   */
  "10.1053/beem.2002.0227",
  /*
   * Luz exterior: la exposición diaria a luz natural adelanta el sueño y reduce la somnolencia
   * diurna. Es el puente medido entre este pilar y el del descanso.
   */
  "10.1073/pnas.2301608120",
  /*
   * Calzado minimalista: seis meses de actividad cotidiana con calzado sin soporte aumentan la
   * fuerza del pie. Sostiene la sección del pie y el terreno, incluida su nota de transición.
   */
  "10.1038/s41598-021-98070-0",
];

export const MIND_SPIRIT_BIBLIOGRAPHY: readonly string[] = [
  "10.61194/psychology.v2i3.523",
  "10.2196/41304",
  "10.1016/j.cities.2025.105745",
  "10.1016/j.invent.2025.100856",
  "10.36283//ziun-pjmd14-3/001",
  "10.1590/1518-8345.5641.3526",
  "10.1007/s11469-016-9684-0",
  "10.30935/ojcmt/14171",
  "10.1002/wps.21188",
  "10.1371/journal.pone.0333493",
  "10.1016/j.chb.2021.106988",
  "10.1016/j.colegn.2021.01.005",
  "10.3389/fpubh.2024.1470965",
  "10.1080/00049530.2021.1898914",
  "10.58721/jsic.v4i2.1145",
  "10.1186/s12877-024-04837-1",
  "10.2196/48195",
  "10.1002/cl2.1369",
  "10.1016/j.bbi.2022.01.009",
  "10.1177/0265407519836170",
  /*
   * Lo que el ritual de la presencia añadió y la lista anterior no sostenía.
   *
   * Soledad y aislamiento: el metaanálisis de setenta estudios que los pone a la altura de los
   * factores de riesgo de mortalidad ya establecidos. Es la base de todo el bloque del costo.
   */
  "10.1177/1745691614568352",
  /*
   * Respiración: una sola sesión de respiración lenta y profunda sube el tono vagal y baja la
   * ansiedad. Sostiene la sección tal y como está escrita —«respirar despacio»—, y NO la versión
   * anterior de esa nota, que atribuía el efecto a alargar la exhalación: el ensayo de 2024 y su
   * réplica no hallaron diferencia de HRV entre 1:1 y 1:2. Se citan los dos: el que sostiene la
   * afirmación y el que acotó su alcance.
   */
  "10.1038/s41598-021-98736-9",
  "10.1007/s10484-024-09637-2",
  /*
   * Naturaleza cercana: metaanálisis de exposición a espacios verdes sobre depresión y ansiedad.
   * Es la evidencia del arraigo al aire libre.
   */
  "10.1016/j.envres.2023.116303",
];
