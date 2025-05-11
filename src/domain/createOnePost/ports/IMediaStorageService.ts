export default interface IMediaStorageService {
  uploadFile(file: File): Promise<string>;
  createFilePath(type: string, fileName: string, sourceDir: string): string;
  validateFileAndGetType(file: File): Promise<string | null>;
}
