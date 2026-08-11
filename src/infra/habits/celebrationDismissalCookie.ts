export const CELEBRATION_DISMISSAL_COOKIE = "hs_celebration_closed";
export const CELEBRATION_DISMISSAL_MAX_AGE = 60 * 60 * 24 * 30;

export function isCelebrationDismissed(
  dismissedId: string | null | undefined,
  activeId: string,
): boolean {
  return dismissedId === activeId;
}
