/**
 * Convierte un enlace corto de Google Maps en el largo, que sí lleva coordenadas.
 *
 * Es un puerto y no una llamada directa porque implica salir a la red: así el caso de uso se
 * prueba sin internet, y quien lo implementa decide el tiempo de espera y qué hacer si Google no
 * contesta.
 */
export default interface IMapUrlResolver {
  /** El enlace expandido, o el mismo que entró si no se pudo seguir. Nunca lanza. */
  expand(url: string): Promise<string>;
}
