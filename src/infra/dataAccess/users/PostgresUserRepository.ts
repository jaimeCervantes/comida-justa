import { inArray } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import type { IUserRepository, PostUser } from "./IUserRepository";

export class PostgresUserRepository implements IUserRepository {
  async getUsersByIds(ids: string[]): Promise<Map<string, PostUser>> {
    if (ids.length === 0) return new Map();

    const uniqueIds = [...new Set(ids)];

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    const map = new Map<string, PostUser>();
    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        email: row.email ?? undefined,
        name: row.name ?? undefined,
        image: row.image ?? undefined,
      });
    }

    return map;
  }
}
