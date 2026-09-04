import type { Page, PlaywrightWorkerOptions } from "@playwright/test";
import { eq } from "drizzle-orm";
import type { Cookie } from "~/e2e/types/cookies";
import { db } from "~/infra/dataAccess/db/connection";
import { sessions } from "~/infra/dataAccess/db/schema/auth";
import { findSuiteUserId, findUserIdByEmail } from "./suiteAccount";

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
  // Sin email se entra con la cuenta de la suite, nombrada explícitamente.
  //
  // Antes esto era `SELECT id FROM users LIMIT 1`, sin `ORDER BY`, y eso resultó ser una fuente de
  // fallos intermitentes muy caros de diagnosticar: Postgres devuelve las filas en orden físico, y
  // **cualquier `UPDATE` sobre esa fila la mueve al final del heap**. En cuanto `profile.spec.ts`
  // reclamaba y liberaba una dirección personal sobre ella, todos los specs siguientes entraban
  // como otra persona — y los que afirman "un no-admin ve 404" empezaban a entrar como quien sí lo
  // es. Pasaban en aislamiento y fallaban en la suite completa.
  //
  // Fijarla por correo la vuelve estable frente a `UPDATE`s, a filas nuevas y al orden de los
  // specs. El respaldo por `id` existe para entornos donde esa cuenta no esté sembrada; también
  // ordenado, para no reintroducir el mismo azar.
  const userId = email
    ? await findUserIdByEmail(email)
    : await findSuiteUserId();

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
