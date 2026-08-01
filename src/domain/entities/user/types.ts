/** La cara pública de una cuenta: lo que se muestra en `/u/<username>`. */
export interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  /** `users.username`. Nulo mientras no reclame su dirección personal. */
  username: string | null;
}
