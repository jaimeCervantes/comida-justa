"use client";

import { useSearchParams } from "next/navigation";
import { parsePublicationPillar } from "~/domain/entities/post/publicationPillars";
import SearchBar from "./SearchBar";

export default function HeaderSearchBar(): React.ReactNode {
  const searchParams = useSearchParams();

  return (
    <SearchBar
      activePillar={parsePublicationPillar(searchParams.get("pillar"))}
    />
  );
}
