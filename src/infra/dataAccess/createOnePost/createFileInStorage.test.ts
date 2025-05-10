import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStorage, getDownloadURL } from "firebase-admin/storage";
import { createMockFile } from "~/infra/dataAccess/testUtils";
import PostValidator from "~/domain/PostValidator";
import PostEntity from "~/entities/post/Post";
import { createFileInStorage } from ".";
const postEntity = new PostEntity(new PostValidator())

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
        const createFilePathSpy = vi.spyOn(postEntity, 'createFilePath');
        const filePath = postEntity.createFilePath(file.type, file.name);
        const urlPathInStorage = `https://mocked.url/${filePath}`;
        (getStorage as any).mockReturnValue({ bucket: () => bucketMock });
        (getDownloadURL as any).mockResolvedValue(urlPathInStorage);

        const url = await createFileInStorage(file);

        expect(saveMock).toHaveBeenCalled();
        expect(createFilePathSpy).toHaveBeenCalledWith(file.type, file.name);
        expect(createFilePathSpy).toHaveReturnedWith(filePath);
        expect(fileMock).toHaveBeenCalledWith(filePath);
        expect(fileMock).toHaveBeenLastCalledWith(filePath);
        expect(url).toBe(urlPathInStorage);
    });
});
