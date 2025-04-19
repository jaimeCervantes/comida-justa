// postUtils.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFileInStorage } from "./postUtils";
import { getStorage } from "firebase-admin/storage";
import { getDownloadURL } from "firebase-admin/storage";

vi.mock("firebase-admin/storage", () => {
    return {
        getStorage: vi.fn(),
        getDownloadURL: vi.fn(),
    };
});

describe("createFileInStorage", () => {
    const saveMock = vi.fn().mockResolvedValue(undefined);
    const fileMock = vi.fn().mockReturnValue({
        save: saveMock,
    });

    const bucketMock = {
        file: fileMock,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getStorage as any).mockReturnValue({ bucket: () => bucketMock });
    });

    it("debe guardar el archivo en la ruta correcta y devolver la URL", async () => {
        const file = createMockFile("post.jpg", "image/jpeg", "contenido");
        const urlPathInStorage = `https://mocked.url/${file.type}/${file.name}`;
        (getDownloadURL as any).mockResolvedValue(urlPathInStorage);

        const url = await createFileInStorage(file);

        expect(saveMock).toHaveBeenCalled();
        expect(fileMock).toHaveBeenCalledWith("posts/image/jpeg/post.jpg");
        expect(url).toBe(urlPathInStorage);
    });
});


function createMockFile(name: string, type: string, content: string): any {
  return {
      name,
      type,
      // mockear porque vitest se ejecuta en node.js y no tiene arrayBuud
      arrayBuffer: async () => Buffer.from(content),
  };
}
