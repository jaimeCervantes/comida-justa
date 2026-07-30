import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProvenanceBadge from "./ProvenanceBadge";

describe("ProvenanceBadge", () => {
  it("shows the Hazlo Sano badge for hazlo_sano_* origins", () => {
    render(<ProvenanceBadge origin="hazlo_sano_propio" />);
    expect(screen.getByText(/🌿 Hazlo Sano/)).toBeInTheDocument();
  });

  it("shows the Local badge for local origins", () => {
    render(<ProvenanceBadge origin="productor_local" />);
    expect(screen.getByText(/📍 Local/)).toBeInTheDocument();
  });

  it("renders nothing for unset or community-foreign origins", () => {
    const { container: none } = render(<ProvenanceBadge origin={null} />);
    expect(none).toBeEmptyDOMElement();

    const { container: foraneo } = render(
      <ProvenanceBadge origin="productor_foraneo" />,
    );
    expect(foraneo).toBeEmptyDOMElement();
  });
});
