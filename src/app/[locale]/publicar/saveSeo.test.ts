import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveSeo } from './saveSeo'; // Ajusta la ruta según tu estructura

// Mock de firebase-admin/firestore
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}));

describe('saveSeo', () => {
  // Mocks para simular Firestore
  const mockUpdate = vi.fn();
  const mockDoc = vi.fn();
  const mockCollection = vi.fn();
  const mockGetFirestore = vi.fn();

  // Datos de prueba
  const mockSeoData = {
    title: 'Test Title | Post saludable',
    metas: [
      {
        content: 'test, keywords',
        name: 'keywords'
      },
      {
        content: 'https://example.com/image.jpg',
        name: 'image'
      },
      {
        content: 'Test description',
        name: 'description'
      }
    ]
  };

  const mockWriteResult = {
    writeTime: {
      toDate: vi.fn(() => new Date('2024-01-15T10:30:00.000Z'))
    }
  };

  beforeEach(async () => {
    // Reset todos los mocks antes de cada prueba
    vi.restoreAllMocks();

    // Configurar la cadena de mocks de Firestore
    mockUpdate.mockResolvedValue(mockWriteResult);
    mockDoc.mockReturnValue({ update: mockUpdate });
    mockCollection.mockReturnValue({ doc: mockDoc });
    mockGetFirestore.mockReturnValue({ collection: mockCollection });

    // Aplicar el mock
    const { getFirestore } = await import('firebase-admin/firestore');
    vi.mocked(getFirestore).mockImplementation(mockGetFirestore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('debería guardar SEO exitosamente', async () => {
    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result).toEqual({
      success: true,
      documentId: 'doc123',
      updateTime: '2024-01-15T10:30:00.000Z'
    });

    // Verificar que se llamaron las funciones correctas
    expect(mockGetFirestore).toHaveBeenCalledOnce();
    expect(mockCollection).toHaveBeenCalledWith('posts');
    expect(mockDoc).toHaveBeenCalledWith('doc123');
    expect(mockUpdate).toHaveBeenCalledWith({
      'translations.es.seo': mockSeoData,
      updatedAt: expect.any(Date)
    });
  });

  it('debería manejar errores de permisos', async () => {
    const permissionError = {
      code: 'permission-denied',
      message: 'Missing or insufficient permissions.'
    };

    mockUpdate.mockRejectedValue(permissionError);

    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result).toEqual({
      success: false,
      documentId: 'doc123',
      error: 'Missing or insufficient permissions.',
      errorCode: 'permission-denied',
      errorDetails: permissionError
    });
  });

  it('debería manejar errores de documento no encontrado', async () => {
    const notFoundError = {
      code: 'not-found',
      message: 'No document to update'
    };

    mockUpdate.mockRejectedValue(notFoundError);

    const result = await saveSeo('posts', 'nonexistent-doc', mockSeoData);

    expect(result).toEqual({
      success: false,
      documentId: 'nonexistent-doc',
      error: 'No document to update',
      errorCode: 'not-found',
      errorDetails: notFoundError
    });
  });

  it('debería manejar errores de conexión', async () => {
    const unavailableError = {
      code: 'unavailable',
      message: 'The service is currently unavailable'
    };

    mockUpdate.mockRejectedValue(unavailableError);

    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result).toEqual({
      success: false,
      documentId: 'doc123',
      error: 'The service is currently unavailable',
      errorCode: 'unavailable',
      errorDetails: unavailableError
    });
  });

  it('debería manejar errores sin código específico', async () => {
    const genericError = new Error('Something went wrong');

    mockUpdate.mockRejectedValue(genericError);

    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result).toEqual({
      success: false,
      documentId: 'doc123',
      error: 'Something went wrong',
      errorCode: 'unknown',
      errorDetails: genericError
    });
  });

  it('debería manejar errores sin mensaje', async () => {
    const errorWithoutMessage = { code: 'custom-error' };

    mockUpdate.mockRejectedValue(errorWithoutMessage);

    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result).toEqual({
      success: false,
      documentId: 'doc123',
      error: 'Error desconocido',
      errorCode: 'custom-error',
      errorDetails: errorWithoutMessage
    });
  });

  it('debería funcionar con diferentes nombres de colección', async () => {
    await saveSeo('articles', 'article456', mockSeoData);

    expect(mockCollection).toHaveBeenCalledWith('articles');
    expect(mockDoc).toHaveBeenCalledWith('article456');
  });

  it('debería incluir updatedAt en la actualización', async () => {
    const beforeCall = new Date();
    await saveSeo('posts', 'doc123', mockSeoData);
    const afterCall = new Date();

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).toHaveProperty('updatedAt');
    expect(updateCall.updatedAt).toBeInstanceOf(Date);
    expect(updateCall.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(updateCall.updatedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });

  it('debería convertir correctamente el writeTime a ISO string', async () => {
    // Mock con diferentes fechas para probar la conversión
    const customDate = new Date('2023-12-25T15:45:30.123Z');
    const customWriteResult = {
      writeTime: {
        toDate: vi.fn(() => customDate)
      }
    };

    mockUpdate.mockResolvedValue(customWriteResult);

    const result = await saveSeo('posts', 'doc123', mockSeoData);

    expect(result.updateTime).toBe('2023-12-25T15:45:30.123Z');
    expect(customWriteResult.writeTime.toDate).toHaveBeenCalledOnce();
  });

  it('debería manejar datos SEO con estructura compleja', async () => {
    const complexSeoData = {
      es: {
        title: 'Título con caracteres especiales áéíóú | Post saludable',
        metas: [
          {
            content: 'keywords, con, acentos, ñoño',
            name: 'keywords'
          },
          {
            content: 'https://example.com/path/to/image.jpg?param=value',
            name: 'image'
          },
          {
            content: 'Descripción con múltiples líneas\ny caracteres especiales @#$%',
            name: 'description'
          }
        ]
      }
    };

    const result = await saveSeo('posts', 'complex-doc', complexSeoData);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      'translations.es.seo': complexSeoData,
      updatedAt: expect.any(Date)
    });
  });
});