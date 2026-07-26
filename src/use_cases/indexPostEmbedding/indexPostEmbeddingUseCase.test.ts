import { describe, it, expect } from "vitest";
import EmbeddingProviderError from "~/domain/errors/EmbeddingProviderError";
import { EMBEDDING_DIMENSIONS } from "~/domain/entities/post/embedding";
import IndexPostEmbeddingUseCase from "./indexPostEmbeddingUseCase";
import {
  FakeEmbeddingService,
  FakePostEmbeddingRepository,
  aVector,
} from "./testDoubles";

const ref = { postId: "post-1", locale: "es" };

describe("IndexPostEmbeddingUseCase", () => {
  // Escenario "Publishing a product stores its embedding" (@slice-4)
  it("stores a 768-dimension vector built from the publication's own text", async () => {
    const repository = new FakePostEmbeddingRepository();
    const service = new FakeEmbeddingService();

    const result = await new IndexPostEmbeddingUseCase(repository, service).execute(ref);

    expect(result).toEqual({ indexed: true });
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0].ref).toEqual(ref);
    expect(repository.saved[0].embedding).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(service.texts[0]).toContain("Nombre: Jugo Verde");
    expect(service.texts[0]).toContain("Sub-categoría: Jugos");
  });

  // Escenario "Publishing survives the embedding provider being down" (@slice-4)
  it("leaves the translation pending when the provider is down, without throwing", async () => {
    const repository = new FakePostEmbeddingRepository();
    const service = new FakeEmbeddingService({
      error: new EmbeddingProviderError("Gemini responded 503"),
    });

    const result = await new IndexPostEmbeddingUseCase(repository, service).execute(ref);

    expect(result.indexed).toBe(false);
    expect(result).toMatchObject({ reason: "provider-error" });
    expect(repository.saved).toHaveLength(0);
  });

  it("refuses to store a vector the column would reject", async () => {
    const repository = new FakePostEmbeddingRepository();
    const service = new FakeEmbeddingService({ vector: aVector(0.1, 512) });

    const result = await new IndexPostEmbeddingUseCase(repository, service).execute(ref);

    expect(result).toEqual({ indexed: false, reason: "unexpected-dimensions" });
    expect(repository.saved).toHaveLength(0);
  });

  it("does nothing for a translation that no longer exists", async () => {
    const repository = new FakePostEmbeddingRepository({ source: null });
    const service = new FakeEmbeddingService();

    const result = await new IndexPostEmbeddingUseCase(repository, service).execute(ref);

    expect(result).toEqual({ indexed: false, reason: "not-found" });
    expect(service.texts).toHaveLength(0);
  });

  it("does not spend a request on a translation with no text", async () => {
    const repository = new FakePostEmbeddingRepository({
      source: { title: "  ", content: "" },
    });
    const service = new FakeEmbeddingService();

    const result = await new IndexPostEmbeddingUseCase(repository, service).execute(ref);

    expect(result).toEqual({ indexed: false, reason: "empty-text" });
    expect(service.texts).toHaveLength(0);
  });

  it("reports a failed write instead of propagating it to the publish flow", async () => {
    const repository = new FakePostEmbeddingRepository({
      failOnSave: new Error("connection terminated"),
    });

    const result = await new IndexPostEmbeddingUseCase(
      repository,
      new FakeEmbeddingService(),
    ).execute(ref);

    expect(result).toMatchObject({ indexed: false, reason: "provider-error" });
  });
});
