/**
 * Una caché en memoria con tope de entradas: cuando se llena, sale la que lleva más tiempo sin
 * usarse.
 *
 * Vive en el proceso del servidor y se pierde al reiniciarlo, y está bien así: solo guarda lo que se
 * puede volver a calcular (una imagen ya dibujada, una foto ya recortada). Lo que importa es que no
 * crezca sin límite en un proceso que dura días.
 *
 * Guarda la **promesa**, no el valor: dos peticiones que llegan juntas por lo mismo comparten el
 * trabajo en vez de hacerlo dos veces. Si la promesa falla, se borra, para que la siguiente lo
 * reintente en vez de heredar el error.
 */
export class LruCache<V> {
  private readonly entries = new Map<string, Promise<V>>();

  constructor(private readonly maxEntries: number) {}

  get size(): number {
    return this.entries.size;
  }

  /** Lo guardado para esa llave, si lo hay, sin calcular nada. Cuenta como uso. */
  get(key: string): Promise<V> | undefined {
    const cached = this.entries.get(key);

    if (cached) {
      /* Volver a insertarla la manda al final: un `Map` recuerda el orden de inserción, así que la
         primera es siempre la que lleva más tiempo sin usarse. */
      this.entries.delete(key);
      this.entries.set(key, cached);
    }

    return cached;
  }

  getOrCreate(key: string, create: () => Promise<V>): Promise<V> {
    const cached = this.get(key);

    if (cached) return cached;

    const created = create().catch((error: unknown) => {
      if (this.entries.get(key) === created) this.entries.delete(key);
      throw error;
    });

    this.entries.set(key, created);
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;

      if (oldest !== undefined) this.entries.delete(oldest);
    }

    return created;
  }
}
