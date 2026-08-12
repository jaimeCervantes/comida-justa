/**
 * Las referencias científicas de cada pilar.
 *
 * Vivían repetidas dentro del JSX: cuarenta bloques `<li><a …>` idénticos por página, con la
 * URL escrita dos veces (en el `href` y como texto). Aquí son datos, y `PillarReferences` las
 * pinta. Un DOI no se traduce, así que no tienen por qué estar en el catálogo.
 */

export const SLEEP_REFERENCES: readonly string[] = [
  "https://doi.org/10.1038/tp.2016.262",
  "https://doi.org/10.1177/23727322231193967",
  "https://doi.org/10.1016/j.lfs.2017.02.008",
  "https://doi.org/10.1098/rstb.2014.0120",
  "https://doi.org/10.2174/0122106766390602251012162712",
  "https://doi.org/10.1073/pnas.1901824116",
  "https://doi.org/10.1093/sleep/zsz067.037",
  "https://doi.org/10.1007/s11818-019-00215-x",
  "https://doi.org/10.1038/s41598-020-75622-4",
  "https://doi.org/10.1080/09291016.2022.2151763",
  "https://doi.org/10.3390/ijms24043392",
  "https://doi.org/10.1016/j.ygcen.2025.114822",
  "https://doi.org/10.1021/acsomega.3c05620",
  "https://doi.org/10.1016/j.envpol.2023.121321",
  "https://doi.org/10.1016/j.scitotenv.2020.139334",
  "https://doi.org/10.3109/07420528.2015.1073158",
  "https://doi.org/10.3322/caac.21218",
  "https://doi.org/10.1002/jez.70023",
  "https://doi.org/10.3390/ijerph19031849",
  "https://doi.org/10.1007/s00281-021-00899-0",
  "https://doi.org/10.1016/j.arr.2024.102457",
  "https://doi.org/10.1098/rsfs.2019.0092",
  "https://doi.org/10.1111/jsr.12371",
  "https://doi.org/10.1016/j.pcad.2023.02.005",
  "https://doi.org/10.1177/15598276251346752",
  "https://doi.org/10.1038/s41583-023-00764-z",
  "https://doi.org/10.5664/jcsm.9476",
  "https://doi.org/10.1016/j.sleep.2016.08.006",
  "https://doi.org/10.1111/jsr.13598",
  "https://doi.org/10.3390/children8070542",
  "https://doi.org/10.1016/j.jsmc.2022.03.001",
  "https://doi.org/10.1016/j.biopsych.2025.06.002",
  "https://doi.org/10.1146/annurev-psych-010213-115205",
  "https://doi.org/10.1164/rccm.1996p11",
  "https://doi.org/10.3934/neuroscience.2016.1.67",
  "https://doi.org/10.1016/j.pcad.2008.10.003",
  "https://doi.org/10.22289/2446-922x.v10n1a30",
  "https://doi.org/10.1007/164_2018_140",
  "https://doi.org/10.1016/s2468-2667(23)00182-2",
  "https://doi.org/10.1016/j.sleep.2020.07.048",
];

export const NUTRITION_REFERENCES: readonly string[] = [
  "https://doi.org/10.1111/obr.13126",
  "https://doi.org/10.1017/s1368980017000234",
  "https://doi.org/10.1111/1541-4337.13204",
  "https://doi.org/10.3389/fnut.2021.748847",
  "https://doi.org/10.3389/fsufs.2021.644559",
  "https://doi.org/10.1016/s0140-6736(25)01565-x",
  "https://doi.org/10.1108/bfj-07-2016-0321",
  "https://doi.org/10.1146/annurev-food-111523-122028",
  "https://doi.org/10.1016/s2542-5196(20)30177-7",
  "https://doi.org/10.1136/bmjopen-2015-009892",
  "https://doi.org/10.1002/fft2.173",
  "https://doi.org/10.1093/cdn/nzy077",
  "https://doi.org/10.1098/rstb.2022.0214",
  "https://doi.org/10.1111/obr.12174",
  "https://doi.org/10.1016/j.jclepro.2022.133155",
  "https://doi.org/10.1093/advances/nmab049",
  "https://doi.org/10.34172/ijhpm.2022.6443",
  "https://doi.org/10.1111/1541-4337.13331",
  "https://doi.org/10.1155/2022/6627013",
  "https://doi.org/10.3390/su12156280",
  /*
   * Las tres afirmaciones que el ritual de la cena añadió y que la lista anterior no sostenía.
   *
   * Crononutrición: la tolerancia a la glucosa cae por la tarde-noche por el sistema circadiano
   * endógeno, no solo por el desorden de horarios (PNAS 2015), y el efecto se explica sobre todo
   * por la respuesta de la célula beta (Diabetes Obes Metab 2018).
   */
  "https://doi.org/10.1073/pnas.1418955112",
  "https://doi.org/10.1111/dom.13391",
  /*
   * Aldehídos: los aceites ricos en poliinsaturados generan órdenes de magnitud más productos
   * aldehídicos de oxidación al calentarse que los ricos en monoinsaturados, y esos productos
   * pasan al alimento (Sci Rep 2019; Front Nutr 2022).
   */
  "https://doi.org/10.1038/s41598-019-39767-1",
  "https://doi.org/10.3389/fnut.2021.711640",
  /*
   * Punto de humo del aceite de aguacate: 250 °C sin refinar y 271 °C refinado. Es la fuente de
   * la que salen esas dos cifras; conviene no confundirlas, que es justo lo que hace la mitad de
   * internet al atribuirle al prensado en frío el punto de humo del refinado.
   */
  "https://doi.org/10.1016/b978-1-893997-97-4.50008-5",
];

export const MOVEMENT_REFERENCES: readonly string[] = [
  "https://doi.org/10.4082/kjfm.24.0099",
  "https://doi.org/10.1002/dmrr.2759",
  "https://doi.org/10.54289/jcrmh2300131",
  "https://doi.org/10.3389/fpubh.2022.1042413",
  "https://doi.org/10.1007/s00125-015-3624-6",
  "https://doi.org/10.1002/hpm.3070",
  "https://doi.org/10.1016/j.smhs.2019.08.006",
  "https://doi.org/10.70102/aej.2025.17.3.34",
  "https://doi.org/10.1123/jpah.2019-0377",
  "https://doi.org/10.1136/bjsports-2013-093107",
  "https://doi.org/10.1016/j.eclinm.2022.101424",
  "https://doi.org/10.3389/fpubh.2024.1358423",
  "https://doi.org/10.7326/m14-1651",
  "https://doi.org/10.1016/j.pcad.2019.02.004",
  "https://doi.org/10.1016/j.artere.2019.04.001",
  "https://doi.org/10.7326/m14-2552",
  "https://doi.org/10.1123/jpah.2012-0423",
  "https://doi.org/10.1007/s12603-019-1298-3",
  "https://doi.org/10.37268/mjphm/vol.23/no.1/art.1816",
  /*
   * Lo que el ritual de la cadencia añadió y la lista anterior no sostenía.
   *
   * Interrumpir la silla: un par de minutos de sentadillas o de caminata cada media hora bajan la
   * glucosa y la insulina posprandiales tanto como caminar seguido (Diabetes Care 2012; J Appl
   * Physiol 2021). Es la evidencia del bloque «cada 50 minutos».
   */
  "https://doi.org/10.2337/dc11-1931",
  "https://doi.org/10.1152/japplphysiol.00796.2020",
  /*
   * El gasto espontáneo de energía —el que no es ejercicio ni deporte— explica por qué motorizar
   * los trayectos cortos pesa mucho más de lo que parece.
   */
  "https://doi.org/10.1053/beem.2002.0227",
  /*
   * Luz exterior: la exposición diaria a luz natural adelanta el sueño y reduce la somnolencia
   * diurna. Es el puente medido entre este pilar y el del descanso.
   */
  "https://doi.org/10.1073/pnas.2301608120",
  /*
   * Calzado minimalista: seis meses de actividad cotidiana con calzado sin soporte aumentan la
   * fuerza del pie. Sostiene la sección del pie y el terreno, incluida su nota de transición.
   */
  "https://doi.org/10.1038/s41598-021-98070-0",
];

export const MIND_SPIRIT_REFERENCES: readonly string[] = [
  "https://doi.org/10.61194/psychology.v2i3.523",
  "https://doi.org/10.2196/41304",
  "https://doi.org/10.1016/j.cities.2025.105745",
  "https://doi.org/10.1016/j.invent.2025.100856",
  "https://doi.org/10.36283//ziun-pjmd14-3/001",
  "https://doi.org/10.1590/1518-8345.5641.3526",
  "https://doi.org/10.1007/s11469-016-9684-0",
  "https://doi.org/10.30935/ojcmt/14171",
  "https://doi.org/10.1002/wps.21188",
  "https://doi.org/10.1371/journal.pone.0333493",
  "https://doi.org/10.1016/j.chb.2021.106988",
  "https://doi.org/10.1016/j.colegn.2021.01.005",
  "https://doi.org/10.3389/fpubh.2024.1470965",
  "https://doi.org/10.1080/00049530.2021.1898914",
  "https://doi.org/10.58721/jsic.v4i2.1145",
  "https://doi.org/10.1186/s12877-024-04837-1",
  "https://doi.org/10.2196/48195",
  "https://doi.org/10.1002/cl2.1369",
  "https://doi.org/10.1016/j.bbi.2022.01.009",
  "https://doi.org/10.1177/0265407519836170",
];
