import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "~/domain/entities/user/types";
import ClaimUsernameUseCase from "./claimUsernameUseCase";
import type IUserProfileRepository from "./ports/IUserProfileRepository";

// La cuenta que más publica hoy: 18 publicaciones y dueña de la tienda "Hazlo Sano".
const JAIME: UserProfile = {
  id: "44pZIIJ5w1vSYkDQ6gfb",
  name: "Jaime Cervantes",
  image: "https://lh3.googleusercontent.com/foto",
  username: null,
};

const OTHER: UserProfile = {
  id: "ksivIlKXNlbjXPMZBb4a",
  name: "Daniels Rodroguez",
  image: null,
  username: "jaime-cervantes",
};

class FakeUserProfileRepository implements IUserProfileRepository {
  readonly claimed: Array<{ userId: string; username: string }> = [];

  constructor(private readonly profiles: UserProfile[] = []) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.profiles.find((profile) => profile.id === userId) ?? null;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return (
      this.profiles.find((profile) => profile.username === username) ?? null
    );
  }

  async saveUsername(userId: string, username: string): Promise<UserProfile> {
    this.claimed.push({ userId, username });

    return { ...JAIME, id: userId, username };
  }
}

describe("ClaimUsernameUseCase", () => {
  let repository: FakeUserProfileRepository;
  let useCase: ClaimUsernameUseCase;

  beforeEach(() => {
    repository = new FakeUserProfileRepository([JAIME]);
    useCase = new ClaimUsernameUseCase(repository);
  });

  it("reserva la dirección normalizando lo que se escribió", async () => {
    const result = await useCase.execute({
      userId: JAIME.id,
      requested: "  Jaime Cervantes  ",
    });

    expect(result.profile?.username).toBe("jaime-cervantes");
    expect(repository.claimed).toEqual([
      { userId: JAIME.id, username: "jaime-cervantes" },
    ]);
  });

  it("no cede una dirección que ya es de alguien más", async () => {
    repository = new FakeUserProfileRepository([JAIME, OTHER]);
    useCase = new ClaimUsernameUseCase(repository);

    const result = await useCase.execute({
      userId: JAIME.id,
      requested: "Jaime Cervantes",
    });

    expect(result.errorMessage).toBe(
      "Ese nombre de usuario ya está ocupado. Prueba con otro.",
    );
    expect(repository.claimed).toHaveLength(0);
  });

  it("no deja cambiarla, porque rompería los enlaces ya repartidos", async () => {
    repository = new FakeUserProfileRepository([
      { ...JAIME, username: "jaime" },
    ]);
    useCase = new ClaimUsernameUseCase(repository);

    const result = await useCase.execute({
      userId: JAIME.id,
      requested: "otro-nombre",
    });

    expect(result.errorMessage).toBe("Ya tienes una dirección personal.");
    expect(repository.claimed).toHaveLength(0);
  });

  it.each(["..", "##", "ab"])(
    "rechaza %j sin guardar nada",
    async (requested) => {
      const result = await useCase.execute({ userId: JAIME.id, requested });

      expect(result.errorMessage).toContain("no se puede usar como dirección");
      expect(repository.claimed).toHaveLength(0);
    },
  );

  it("propaga un fallo de infraestructura en vez de disfrazarlo de validación", async () => {
    const broken: IUserProfileRepository = {
      findByUserId: vi.fn().mockRejectedValue(new Error("connection refused")),
      findByUsername: vi.fn(),
      saveUsername: vi.fn(),
    };

    await expect(
      new ClaimUsernameUseCase(broken).execute({
        userId: JAIME.id,
        requested: "jaime",
      }),
    ).rejects.toThrow("connection refused");
  });
});
