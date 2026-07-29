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

const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  get: vi.fn().mockResolvedValue({
    exists: true,
    data: vi.fn().mockReturnValue({}),
  }),
  set: vi.fn().mockResolvedValue(true),
  // Agregar mas métodos conforme se vayan usando
};

// `collection()` y `doc()` devuelven el propio mock para poder encadenar. Se conectan después de
// crear el objeto porque hacerlo en el literal exige anotar el tipo circular a mano.
mockFirestore.collection.mockReturnValue(mockFirestore);
mockFirestore.doc.mockReturnValue(mockFirestore);
