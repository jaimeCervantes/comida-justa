import { describe, expect, it, vi } from "vitest";
import { EMBEDDING_DIMENSIONS } from "~/domain/entities/post/embedding";
import EmbeddingProviderError from "~/domain/errors/EmbeddingProviderError";
import GeminiEmbeddingService, {
  GEMINI_EMBEDDING_MODEL,
} from "./GeminiEmbeddingService";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function serviceWith(fetchImpl: typeof fetch, timeoutMs?: number) {
  return new GeminiEmbeddingService({
    apiKey: "test-key",
    fetchImpl,
    timeoutMs,
  });
}

describe("GeminiEmbeddingService", () => {
  it("asks for the very model and dimension the chatbot's catalog was indexed with", async () => {
    const values = new Array(EMBEDDING_DIMENSIONS).fill(0.01);
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ embedding: { values } }),
    );

    const embedding = await serviceWith(
      fetchImpl as unknown as typeof fetch,
    ).generateEmbedding("Nombre: Jugo Verde");

    expect(embedding).toHaveLength(EMBEDDING_DIMENSIONS);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain(`${GEMINI_EMBEDDING_MODEL}:embedContent`);
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(
      "test-key",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      model: `models/${GEMINI_EMBEDDING_MODEL}`,
      content: { parts: [{ text: "Nombre: Jugo Verde" }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });
  });

  it("fails loudly when the provider answers with an error status", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        { error: "quota" },
        { status: 429, statusText: "Too Many Requests" },
      ),
    );

    await expect(
      serviceWith(fetchImpl as unknown as typeof fetch).generateEmbedding("x"),
    ).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("rejects a vector that would not fit the vector(768) column", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ embedding: { values: new Array(512).fill(0.01) } }),
    );

    await expect(
      serviceWith(fetchImpl as unknown as typeof fetch).generateEmbedding("x"),
    ).rejects.toThrow(/512 dimensions/);
  });

  it("rejects a body without an embedding at all", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}));

    await expect(
      serviceWith(fetchImpl as unknown as typeof fetch).generateEmbedding("x"),
    ).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("turns a network failure into the expected provider error, never a raw throw", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      serviceWith(fetchImpl as unknown as typeof fetch).generateEmbedding("x"),
    ).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("gives up instead of holding the publish flow open forever", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    await expect(
      serviceWith(fetchImpl as unknown as typeof fetch, 10).generateEmbedding(
        "x",
      ),
    ).rejects.toBeInstanceOf(EmbeddingProviderError);
  });

  it("refuses to call the API without a key", async () => {
    const fetchImpl = vi.fn();

    await expect(
      new GeminiEmbeddingService({
        apiKey: "",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }).generateEmbedding("x"),
    ).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
