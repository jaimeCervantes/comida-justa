/**
 * Lo mínimo para enseñar una tienda y llegar a ella.
 *
 * Se escribía suelto en cada sitio que la pinta —la ficha por arriba, la ficha por abajo y la
 * tarjeta de listado— y las tres copias ya empezaban a discrepar en si el logo podía faltar. Puede:
 * `logo_url` es opcional en la base y una tienda recién dada de alta no lo tiene.
 *
 * `handle` es el `slug`, no el id: es lo que va en la dirección. Si falta, la tienda no se pinta —un
 * logo que no lleva a ninguna parte engaña más de lo que informa—, por eso aquí no es opcional.
 */
export type StoreIdentity = {
  handle: string;
  name: string;
  logoUrl?: string | null;
};
