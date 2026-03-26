export default interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
}
