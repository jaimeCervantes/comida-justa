export function createMockFile(name: string, type: string, size: number): File {
  const content = "a".repeat(size);
  return new File([content], name, { type });
}
