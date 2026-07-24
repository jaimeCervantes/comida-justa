import { Page, PlaywrightWorkerOptions } from "@playwright/test";
import { eq } from "drizzle-orm";
import type { Cookie } from "~/e2e/types/cookies";
import { db } from "~/infra/dataAccess/db/connection";
import { sessions, users } from "~/infra/dataAccess/db/schema/auth";

export async function simulateLogin(
  page: Page,
  browserName: PlaywrightWorkerOptions["browserName"],
  options: SimulateLoginOptions = {},
): Promise<DbSession> {
  const dbSession = await createDbSession(options.email);
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

async function createDbSession(email?: string) {
  // Without an email, use the first available user from the users table. Note that
  // user may have a null email, so any test that depends on the session's email
  // (e.g. the admin gate) must pass one explicitly.
  const userRows = email
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    : await db.select({ id: users.id }).from(users).limit(1);

  if (email && userRows.length === 0) {
    throw new Error(
      `simulateLogin: no user with email "${email}" exists in the users table.`,
    );
  }

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

export type SimulateLoginOptions = {
  /** Log in as this specific user instead of the first one found. */
  email?: string;
};

export type DbSession = {
  id: string;
  userId: string;
  sessionToken: string;
  expires: string;
};
