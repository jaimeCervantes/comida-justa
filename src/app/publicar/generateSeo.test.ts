import { describe, it, expect } from 'vitest';
import { generateSeo } from './generateSeo';
import {
  basicInput,
  basicExpectedOutput,
  inputWithImage,
  longDescriptionInput,
  shortDescriptionInput,
  inputWithDuplicateKeywords,
  spacedInput,
  uppercaseInput,
  emptyInput,
  basicStructureInput
} from '../../business/createOnePost/seoDummies';

describe('generateSeo', () => {
  it('debería generar SEO básico con título y descripción', () => {
    const result = generateSeo(basicInput);
    expect(result).toEqual(basicExpectedOutput);
  });

  it('debería incluir mediaUrl cuando se proporciona', () => {
    const result = generateSeo(inputWithImage);
    expect(result.es.metas).toContainEqual({
      content: 'https://example.com/smoothie.jpg',
      name: 'image'
    });
  });

  it('debería truncar la descripción si excede 160 caracteres y omitir espacios en blanco al inicio y final', () => {
    const result = generateSeo(longDescriptionInput);
    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');
    expect(descriptionMeta?.content.length).toBeLessThanOrEqual(160);
  });

  it('debería mantener la descripción original si es menor a 160 caracteres', () => {
    const result = generateSeo(shortDescriptionInput);
    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');
    expect(descriptionMeta?.content).toBe(shortDescriptionInput.description);
    expect(descriptionMeta?.content).toHaveLength(shortDescriptionInput.description.length);
  });

  it('debería generar keywords únicas combinando título y descripción', () => {
    const result = generateSeo(inputWithDuplicateKeywords);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    const keywords = keywordsMeta?.content.split(', ');

    const uniqueKeywords = new Set(keywords);
    expect(keywords?.length).toBe(uniqueKeywords.size);
    expect(keywords).toContain('receta');
    expect(keywords).toContain('saludable');
    expect(keywords).toContain('nutritiva');
    expect(keywords).toContain('deliciosa');
  });

  it('debería manejar títulos y descripciones con espacios múltiples', () => {
    const result = generateSeo(spacedInput);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    expect(keywordsMeta?.content).not.toContain(',,');
    expect(keywordsMeta?.content).toContain('título');
    expect(keywordsMeta?.content).toContain('con');
    expect(keywordsMeta?.content).toContain('espacios');
  });

  it('debería convertir todo a minúsculas para keywords', () => {
    const result = generateSeo(uppercaseInput);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    expect(keywordsMeta?.content).toBe('título, en, mayúsculas, descripción');
  });

  it('debería manejar strings vacíos', () => {
    const result = generateSeo(emptyInput);
    expect(result.es.title).toBe(' | Post saludable');

    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    expect(keywordsMeta?.content).toBe('');

    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');
    expect(descriptionMeta?.content).toBe('');
  });

  it('debería tener la estructura correcta de salida', () => {
    const result = generateSeo(basicStructureInput);

    expect(result).toHaveProperty('es');
    expect(result.es).toHaveProperty('title');
    expect(result.es).toHaveProperty('metas');
    expect(Array.isArray(result.es.metas)).toBe(true);

    result.es.metas.forEach(meta => {
      expect(meta).toHaveProperty('content');
      expect(meta).toHaveProperty('name');
      expect(typeof meta.content).toBe('string');
      expect(typeof meta.name).toBe('string');
    });

    expect(result.es.metas).toHaveLength(3);
    const metaNames = result.es.metas.map(meta => meta.name);
    expect(metaNames).toContain('keywords');
    expect(metaNames).toContain('image');
    expect(metaNames).toContain('description');
  });
});