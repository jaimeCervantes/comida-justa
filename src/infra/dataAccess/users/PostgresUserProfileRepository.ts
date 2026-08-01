import { eq, type SQL } from "drizzle-orm";
import type { UserProfile } from "~/domain/entities/user/types";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import type IUserProfileRepository from "~/use_cases/claimUsername/ports/IUserProfileRepository";

const PROFILE_COLUMNS = {
  id: users.id,
  name: users.name,
  image: users.image,
  username: users.username,
};

export class PostgresUserProfileRepository implements IUserProfileRepository {
  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.findOneBy(eq(users.id, userId));
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return this.findOneBy(eq(users.username, username));
  }

  async saveUsername(userId: string, username: string): Promise<UserProfile> {
    const [row] = await db
      .update(users)
      .set({ username })
      .where(eq(users.id, userId))
      .returning(PROFILE_COLUMNS);

    return row;
  }

  private async findOneBy(where: SQL): Promise<UserProfile | null> {
    const rows = await db
      .select(PROFILE_COLUMNS)
      .from(users)
      .where(where)
      .limit(1);

    return rows[0] ?? null;
  }
}
