import { createRouteRepository } from "~/infra/dataAccess/routes/factory";

/**
 * Attaches a GPX route to a seeded event, through the same repository the app uses.
 *
 * `seedPost` does not take one: routes live in their own table and only an event ever has one, so
 * putting it in the general seeder would add a field that every other scenario ignores.
 *
 * It goes through `createRouteRepository().save` rather than a raw INSERT because the geometry is
 * built there — `LINESTRING(lon lat, …)`, longitude first, which is the opposite of how people say
 * it out loud. A hand-written INSERT in a spec would be a second place to get that backwards, and a
 * route silently drawn on another continent still passes a row count.
 */
export async function seedRoute(
  postId: string,
  options: { points?: number; lengthMeters?: number } = {},
): Promise<{ lengthMeters: number; sourcePoints: number }> {
  const count = options.points ?? 40;
  const lengthMeters = options.lengthMeters ?? 8200;

  /* A straight line near the community anchor. The shape does not matter to any assertion here —
     what matters is that a row exists and survives (or does not) an edit. */
  const points = Array.from({ length: count }, (_, index) => ({
    latitude: 19.0 + index / 10_000,
    longitude: -99.0,
  }));

  await createRouteRepository().save({
    postId,
    points,
    lengthMeters,
    sourcePoints: count,
  });

  return { lengthMeters, sourcePoints: count };
}

/** The stored route, or `null`. What the scenarios assert against after saving. */
export async function readRoute(
  postId: string,
): Promise<{ lengthMeters: number; sourcePoints: number } | null> {
  const stored = await createRouteRepository().findByPostId(postId);

  return stored
    ? { lengthMeters: stored.lengthMeters, sourcePoints: stored.sourcePoints }
    : null;
}
