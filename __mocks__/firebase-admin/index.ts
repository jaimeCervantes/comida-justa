import { vi } from "vitest";

const firebaseAdmin = {
  apps: [],
  initializeApp: vi.fn(() => mockApp),
  credential: {
    cert: vi.fn().mockReturnThis(),
  },
  firestore: vi.fn(() => mockFirestore),
  default: {
    apps: [],
    initializeApp: vi.fn(() => mockApp),
    credential: {
      cert: vi.fn().mockReturnThis(),
    },
    firestore: vi.fn(() => mockFirestore),
  },
};

export default firebaseAdmin;

const mockApp = {
  firestore: vi.fn(() => mockFirestore),
};

const mockFirestore: any = {
  collection: vi.fn(() => mockFirestore),
  doc: vi.fn(() => mockFirestore),
  get: vi.fn().mockResolvedValue({
    exists: true,
    data: vi.fn().mockReturnValue({}),
  }),
  set: vi.fn().mockResolvedValue(true),
  // Agregar mas métodos conforme se vayan usando
};
