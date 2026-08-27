import { cookies } from "next/headers";
import {
  parseThemePreference,
  THEME_COOKIE,
  type ThemePreference,
} from "./themeCookie";

/** La preferencia guardada, o `null` si quien visita sigue al sistema. Solo la pide `RootLayout`. */
export async function readThemePreference(): Promise<ThemePreference | null> {
  return parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
}
