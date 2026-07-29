export function createMockFile(
  name: string,
  type: string,
  content: string,
): any {
  return {
    name,
    type,
    // mockear porque vitest se ejecuta en node.js y no tiene arrayBuffer
    arrayBuffer: async () => Buffer.from(content),
  };
}
