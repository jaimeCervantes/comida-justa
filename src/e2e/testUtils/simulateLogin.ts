import { Page, PlaywrightWorkerOptions } from "@playwright/test";
import { eq } from "drizzle-orm";
import type { Cookie } from "~/e2e/types/cookies";
import { db } from "~/infra/dataAccess/db/connection";
import { sessions, users } from "~/infra/dataAccess/db/schema/auth";

export async function simulateLogin(
  page: Page,
  browserName: PlaywrightWorkerOptions["browserName"],
): Promise<DbSession> {
  const dbSession = await createDbSession();
  const cookie: Cookie = {
    name: "authjs.session-token",
    value: dbSession.sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    expires: Math.floor(new Date(dbSession.expires).getTime() / 1000),
  };

  if (browserName !== "webkit") {
    cookie.secure = true;
  }

  await page.context().addCookies([cookie]);

  return dbSession;
}

export async function deleteSession(sessionToken: string) {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

function generateRandomToken() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function createDbSession() {
  // Use the first available user from the users table
  const userRows = await db.select({ id: users.id }).from(users).limit(1);

  const userId =
    userRows.length > 0
      ? userRows[0].id
      : "00000000-0000-0000-0000-000000000000";

  const sessionToken = generateRandomToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires,
  });

  return {
    id: sessionToken, // sessionToken is the PK
    userId,
    sessionToken,
    expires: expires.toISOString(),
  };
}

export type DbSession = {
  id: string;
  userId: string;
  sessionToken: string;
  expires: string;
};
