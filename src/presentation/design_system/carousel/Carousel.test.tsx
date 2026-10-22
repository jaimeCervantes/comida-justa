import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Carousel, {
  CAROUSEL_INTERVAL_MS,
  type CarouselLabels,
} from "./Carousel";

const labels: CarouselLabels = {
  region: "Destacados",
  previous: "Anterior",
  next: "Siguiente",
  slide: "{position} de {count}",
  goTo: "Ir al {position} de {count}",
};

const slides = [
  <p key="a">Ofertas</p>,
  <p key="b">Lo último</p>,
  <p key="c">Miel</p>,
];

function visibleSlide(): string | null {
  return (
    screen.getAllByTestId("carousel-slide").find((slide) => !slide.hidden)
      ?.textContent ?? null
  );
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: reduce }));
}

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Carousel", () => {
  it("empieza en el primero y deja los demás fuera de la página", () => {
    render(<Carousel slides={slides} labels={labels} />);

    expect(visibleSlide()).toBe("Ofertas");
    expect(screen.getAllByTestId("carousel-slide")[1]).not.toBeVisible();
  });

  it("avanza solo y vuelve al principio después del último", () => {
    render(<Carousel slides={slides} labels={labels} />);

    act(() => vi.advanceTimersByTime(CAROUSEL_INTERVAL_MS));
    expect(visibleSlide()).toBe("Lo último");

    act(() => vi.advanceTimersByTime(CAROUSEL_INTERVAL_MS * 2));
    expect(visibleSlide()).toBe("Ofertas");
  });

  it("se detiene mientras el cursor está encima", () => {
    render(<Carousel slides={slides} labels={labels} />);

    fireEvent.mouseEnter(screen.getByTestId("carousel"));
    act(() => vi.advanceTimersByTime(CAROUSEL_INTERVAL_MS * 3));

    expect(visibleSlide()).toBe("Ofertas");
  });

  it("no avanza solo con movimiento reducido, pero los controles sí", () => {
    mockReducedMotion(true);
    render(<Carousel slides={slides} labels={labels} />);

    act(() => vi.advanceTimersByTime(CAROUSEL_INTERVAL_MS * 3));
    expect(visibleSlide()).toBe("Ofertas");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(visibleSlide()).toBe("Lo último");
  });

  it("las flechas dan la vuelta en los dos sentidos y los puntos van directo", () => {
    render(<Carousel slides={slides} labels={labels} />);

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(visibleSlide()).toBe("Miel");

    fireEvent.click(screen.getByRole("button", { name: "Ir al 2 de 3" }));
    expect(visibleSlide()).toBe("Lo último");
    expect(
      screen.getByRole("button", { name: "Ir al 2 de 3" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("pasa con el dedo, y un toque no cuenta como pasar", () => {
    render(<Carousel slides={slides} labels={labels} />);
    const carousel = screen.getByTestId("carousel");

    fireEvent.pointerDown(carousel, { clientX: 300 });
    fireEvent.pointerUp(carousel, { clientX: 290 });
    expect(visibleSlide()).toBe("Ofertas");

    fireEvent.pointerDown(carousel, { clientX: 300 });
    fireEvent.pointerUp(carousel, { clientX: 200 });
    expect(visibleSlide()).toBe("Lo último");
  });

  it("con un solo slide no hay controles", () => {
    render(<Carousel slides={[slides[0]]} labels={labels} />);

    expect(screen.getByText("Ofertas")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
