import { Page, PlaywrightWorkerOptions } from '@playwright/test';
import type {  Cookie } from '~/e2e/types/cookies.d';
import { db } from '~/firebase/init';

export async function simulateLogin(page: Page, browserName: PlaywrightWorkerOptions['browserName']) {
  const dbSession = await createDbSession();
  const cookie: Cookie = {
    name: 'authjs.session-token',
    value: dbSession.sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Math.floor(new Date(dbSession.expires).getTime() / 1000),
  };

  if (browserName !== 'webkit') {
    cookie.secure = true;
  }

  await page.context().addCookies([cookie]);

  return dbSession;
}

export async function deleteSession(sessionId: string) {
    await db.collection('sessions').doc(sessionId).delete();
}

function generateRandomToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function createDbSession() {
  const sessionRef = db.collection('sessions').doc(); // Crea un nuevo documento en la colección 'sessions'
  const sessionData = {
    userId: '44pZIIJ5w1vSYkDQ6gfb',
    sessionToken: generateRandomToken(),
    expires: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
  };
  await sessionRef.set(sessionData);

  return { ...sessionData, id: sessionRef.id } // Retorna el ID de la sesión creada
}





