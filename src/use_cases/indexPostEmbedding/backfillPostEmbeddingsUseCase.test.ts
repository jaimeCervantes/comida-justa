import { describe, it, expect } from "vitest";
import EmbeddingProviderError from "~/domain/errors/EmbeddingProviderError";
import BackfillPostEmbeddingsUseCase from "./backfillPostEmbeddingsUseCase";
import IndexPostEmbeddingUseCase from "./indexPostEmbeddingUseCase";
import { FakeEmbeddingService, FakePostEmbeddingRepository } from "./testDoubles";

const pending = [
  { postId: "post-1", locale: "es" },
  { postId: "post-2", locale: "es" },
  { postId: "post-3", locale: "es" },
];

function backfillWith(repository: FakePostEmbeddingRepository, service: FakeEmbeddingService) {
  return new BackfillPostEmbeddingsUseCase(
    repository,
    new IndexPostEmbeddingUseCase(repository, service),
  );
}

describe("BackfillPostEmbeddingsUseCase", () => {
  // Escenario "the backfill stores its embedding on the next run" (@slice-4)
  it("indexes every translation the chatbot could not see", async () => {
    const repository = new FakePostEmbeddingRepository({ pending });

    const summary = await backfillWith(repository, new FakeEmbeddingService()).execute();

    expect(summary).toEqual({ attempted: 3, indexed: 3, failed: 0, reasons: {} });
    expect(repository.saved.map((entry) => entry.ref.postId)).toEqual([
      "post-1",
      "post-2",
      "post-3",
    ]);
  });

  it("keeps going and reports why when the provider is down", async () => {
    const repository = new FakePostEmbeddingRepository({ pending });
    const service = new FakeEmbeddingService({
      error: new EmbeddingProviderError("Gemini responded 429"),
    });

    const summary = await backfillWith(repository, service).execute();

    expect(summary).toEqual({
      attempted: 3,
      indexed: 0,
      failed: 3,
      reasons: { "provider-error": 3 },
    });
    // Se intentaron las 3: un fallo no aborta la corrida.
    expect(service.texts).toHaveLength(3);
  });

  it("reports an empty run instead of failing when nothing is pending", async () => {
    const repository = new FakePostEmbeddingRepository({ pending: [] });

    const summary = await backfillWith(repository, new FakeEmbeddingService()).execute();

    expect(summary).toEqual({ attempted: 0, indexed: 0, failed: 0, reasons: {} });
  });

  it("honours the limit so one run cannot exhaust the provider's quota", async () => {
    const repository = new FakePostEmbeddingRepository({ pending });

    const summary = await backfillWith(repository, new FakeEmbeddingService()).execute(2);

    expect(summary.attempted).toBe(2);
    expect(repository.saved).toHaveLength(2);
  });
});
