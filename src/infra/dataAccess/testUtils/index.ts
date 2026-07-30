export function createMockFile(
  name: string,
  type: string,
  content: string,
): File {
  return {
    name,
    type,
    // mockear porque vitest se ejecuta en node.js y no tiene arrayBuffer
    arrayBuffer: async () => Buffer.from(content),
  } as unknown as File;
}
