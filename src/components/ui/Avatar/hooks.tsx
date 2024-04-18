import { useMemo } from "react";

export function useInitials(userName: string | null | undefined): string {
  const initials = useMemo(() => {
    if (userName) {
      const names = userName.split(" ");

      if (names.length === 1) {
        return (
          names[0].charAt(0).toUpperCase() + names[0].charAt(1).toUpperCase()
        );
      }

      const initialsArray = names.map((name) => name.charAt(0).toUpperCase());

      return initialsArray.slice(0, 2).join("");
    }
    return "";
  }, [userName]);

  return initials;
}
