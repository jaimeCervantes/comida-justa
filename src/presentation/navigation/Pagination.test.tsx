import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("conserva el filtro de pilar al avanzar", () => {
    renderWithIntl(
      <Pagination
        currentPage={1}
        totalPages={3}
        pathname="/productos/page/[page]"
        query={{ pillar: "movement" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/productos/page/2?pillar=movement",
    );
  });
});
