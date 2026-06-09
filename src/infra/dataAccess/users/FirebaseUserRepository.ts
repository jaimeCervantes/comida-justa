import { auth } from "~/infra/dataAccess/init";
import type { IUserRepository, PostUser } from "./IUserRepository";

export class FirebaseUserRepository implements IUserRepository {
  async getUsersByIds(ids: string[]): Promise<Map<string, PostUser>> {
    if (ids.length === 0) return new Map();

    const uniqueIds = [...new Set(ids)];
    console.log(uniqueIds, "Unique user IDs to fetch from Firebase");
    const result = await auth.getUsers(uniqueIds.map((uid) => ({ uid })));
    console.log(result, "Result from Firebase getUsers call");
    const map = new Map<string, PostUser>();
    for (const user of result.users) {
      map.set(user.uid, {
        id: user.uid,
        email: user.email ?? undefined,
        name: user.displayName ?? undefined,
        image: user.photoURL ?? undefined,
      });
    }

    return map;
  }
}
