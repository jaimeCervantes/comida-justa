import { helpers, PredictionServiceClient } from "@google-cloud/aiplatform";
import type IEmbeddingService from "~/use_cases/common/ports/IEmbeddingService";

type VertexClientOptions = NonNullable<
  ConstructorParameters<typeof PredictionServiceClient>[0]
>;

const clientOptions: VertexClientOptions = {
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
};

// Check for explicit service account credentials (common in this project's setup)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    clientOptions.credentials = {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    };
  } catch (_error) {
    console.warn(
      "VertexEmbeddingService: Failed to parse FIREBASE_SERVICE_ACCOUNT. Falling back to default credentials.",
    );
  }
}

// Singleton instance to reuse connection
const client = new PredictionServiceClient(clientOptions);

export default class VertexEmbeddingService implements IEmbeddingService {
  private project: string;
  private location: string;
  private publisher: string;
  private model: string;
  private endpoint: string;

  constructor() {
    // Falls back to a specific project if env var not set, for development
    this.project = process.env.FIREBASE_PROJECT_ID || "healthy-food-habits";
    this.location = "us-central1";
    this.publisher = "google";
    this.model = "text-multilingual-embedding-002";
    this.endpoint = `projects/${this.project}/locations/${this.location}/publishers/${this.publisher}/models/${this.model}`;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const instance = helpers.toValue({
      content: text,
      task_type: "SEMANTIC_SIMILARITY",
    });

    if (!instance) {
      throw new Error("Failed to convert text to Vertex AI instance value.");
    }

    const [response] = await client.predict({
      endpoint: this.endpoint,
      instances: [instance],
    });

    const predictions = response.predictions;
    if (!predictions || predictions.length === 0) {
      throw new Error("No predictions returned from Vertex AI.");
    }

    const createEmbeddingResponse = helpers.fromValue(
      predictions[0] as Parameters<typeof helpers.fromValue>[0],
    );

    const embeddings =
      typeof createEmbeddingResponse === "object" &&
      createEmbeddingResponse !== null &&
      "embeddings" in createEmbeddingResponse
        ? (createEmbeddingResponse.embeddings as { values?: unknown })
        : null;

    if (!embeddings || !Array.isArray(embeddings.values)) {
      throw new Error("Invalid embedding response format.");
    }

    return embeddings.values as number[];
  }
}
