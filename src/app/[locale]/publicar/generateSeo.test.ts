import { describe, it, expect } from 'vitest';
import { generateSeo } from './generateSeo'; // Ajusta la ruta según tu estructura

describe('generateSeo', () => {
  const basicInput = {
    title: 'Test',
    description: 'Test description'
  };

  const inputWithImage = {
    title: 'Smoothie Recipe',
    description: 'Delicious green smoothie',
    mediaUrl: 'https://example.com/smoothie.jpg',
    url: 'https://example.com/smoothie'
  };

  const longDescriptionInput = {
    title: 'Long Description Test',
    description: 'Esta es una descripción muy larga que definitivamente excede los 160 caracteres permitidos para meta description según las mejores prácticas de SEO y debería ser truncada automáticamente por la función.'
  };

  const shortDescriptionInput = {
    title: 'Short Description Test',
    description: 'Short description'
  };

  const inputWithDuplicateKeywords = {
    title: 'Test Recipe Food',
    description: 'Recipe for test food with ingredients'
  };

  const spacedInput = {
    title: '  Título   con   espacios  ',
    description: '  Descripción   con   espacios múltiples  '
  };

  const uppercaseInput = {
    title: 'TÍTULO EN MAYÚSCULAS',
    description: 'DESCRIPCIÓN EN MAYÚSCULAS'
  };

  const emptyInput = {
    title: '',
    description: ''
  };

  it('debería generar SEO básico con título y descripción', () => {
    const result = generateSeo(basicInput);
    
    expect(result.title).toBe('Test | Salud Justa');
    expect(result.description).toBe('Test description');
    expect(result.keywords).toBe('test, description');
    expect(result.openGraph?.title).toBe('Test');
    expect(result.openGraph?.description).toBe('Test description');
    expect(result.twitter?.title).toBe('Test');
    expect(result.twitter?.description).toBe('Test description');
  });

  it('debería incluir mediaUrl cuando se proporciona', () => {
    const result = generateSeo(inputWithImage);
    
    expect(result.openGraph?.images).toHaveLength(1);
    expect(result.openGraph?.images?.[0]?.url).toBe('https://example.com/smoothie.jpg');
    expect(result.twitter?.images).toContain('https://example.com/smoothie.jpg');
    expect(result.openGraph?.url).toBe('https://example.com/smoothie');
    expect(result.alternates?.canonical).toBe('https://example.com/smoothie');
  });

  it('debería truncar la descripción si excede 160 caracteres', () => {
    const result = generateSeo(longDescriptionInput);
    
    expect(result.description?.length).toBeLessThanOrEqual(160);
    expect(result.description).not.toBe(longDescriptionInput.description);
  });

  it('debería mantener la descripción original si es menor a 160 caracteres', () => {
    const result = generateSeo(shortDescriptionInput);
    
    expect(result.description).toBe(shortDescriptionInput.description);
  });

  it('debería generar keywords únicas combinando título y descripción', () => {
    const result = generateSeo(inputWithDuplicateKeywords);
    
    const keywords = result.keywords?.split(', ') || [];
    const uniqueKeywords = [...new Set(keywords)];
    
    expect(keywords).toEqual(uniqueKeywords); // No debe haber duplicados
    expect(keywords).toContain('test');
    expect(keywords).toContain('recipe');
    expect(keywords).toContain('food');
  });

  it('debería manejar títulos y descripciones con espacios múltiples', () => {
    const result = generateSeo(spacedInput);
    
    expect(result.keywords).not.toContain(',,');
    expect(result.keywords).toContain('título');
    expect(result.keywords).toContain('descripción');
    expect(result.description?.trim()).toBe(spacedInput.description.trim());
  });

  it('debería convertir todo a minúsculas para keywords', () => {
    const result = generateSeo(uppercaseInput);
    
    expect(result.keywords).toBe('título, en, mayúsculas, descripción');
  });

  it('debería manejar strings vacíos', () => {
    const result = generateSeo(emptyInput);
    
    expect(result.title).toBe(' | Salud Justa');
    expect(result.keywords).toBe('');
    expect(result.description).toBe('');
  });

  it('debería tener la estructura correcta de salida (Metadata de Next.js)', () => {
    const result = generateSeo(basicInput);
    
    // Verificar propiedades principales de Metadata
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('openGraph');
    expect(result).toHaveProperty('twitter');
    expect(result).toHaveProperty('robots');
    expect(result).toHaveProperty('alternates');
    
    // Verificar estructura de openGraph
    expect(result.openGraph).toHaveProperty('title');
    expect(result.openGraph).toHaveProperty('description');
    expect(result.openGraph).toHaveProperty('type');
    expect(result.openGraph?.type).toBe('website');
    
    // Verificar estructura de twitter
    expect(result.twitter).toHaveProperty('card');
    expect(result.twitter?.card).toBe('summary_large_image');
    
    // Verificar robots
    expect(result.robots).toHaveProperty('index');
    expect(result.robots?.index).toBe(true);
  });
});