// postUtils.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as postUtils from ".";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { createMockFile } from "~/infra/dataAccess/testUtils";

vi.mock("firebase-admin");
vi.mock("firebase-admin/storage")

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
    });

    it("debe guardar el archivo en la ruta correcta y devolver la URL", async () => {
        const file = createMockFile("post.jpg", "image/jpeg", "contenido");
        const createFilePathSpy = vi.spyOn(postUtils, 'createFilePath');
        const filePath = postUtils.createFilePath(file.type, file.name);
        const urlPathInStorage = `https://mocked.url/${filePath}`;
        (getStorage as any).mockReturnValue({ bucket: () => bucketMock });
        (getDownloadURL as any).mockResolvedValue(urlPathInStorage);

        const url = await postUtils.createFileInStorage(file);

        expect(saveMock).toHaveBeenCalled();
        expect(createFilePathSpy).toHaveBeenCalledWith(file.type, file.name);
        expect(createFilePathSpy).toHaveReturnedWith(filePath);
        expect(fileMock).toHaveBeenCalledWith(filePath);
        expect(fileMock).toHaveBeenLastCalledWith(filePath);
        expect(url).toBe(urlPathInStorage);
    });
});
