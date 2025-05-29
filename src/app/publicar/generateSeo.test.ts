import { describe, it, expect } from 'vitest';
import { generateSeo } from './generateSeo'; // Ajusta la ruta según tu estructura

describe('generateSeo', () => {
  it('debería generar SEO básico con título y descripción', () => {
    const input = {
      title: 'Receta Saludable',
      description: 'Una deliciosa receta para mantener una dieta equilibrada'
    };

    const result = generateSeo(input);

    expect(result).toEqual({
      es: {
        title: 'Receta Saludable | Post saludable',
        metas: [
          {
            content: 'receta, saludable, una, deliciosa, para, mantener, dieta, equilibrada',
            name: 'keywords'
          },
          {
            content: '',
            name: 'image'
          },
          {
            content: 'Una deliciosa receta para mantener una dieta equilibrada',
            name: 'description'
          }
        ]
      }
    });
  });

  it('debería incluir mediaUrl cuando se proporciona', () => {
    const input = {
      title: 'Smoothie Verde',
      description: 'Receta de smoothie nutritivo',
      mediaUrl: 'https://example.com/smoothie.jpg'
    };

    const result = generateSeo(input);

    expect(result.es.metas).toContainEqual({
      content: 'https://example.com/smoothie.jpg',
      name: 'image'
    });
  });

  it('debería truncar la descripción si excede 160 caracteres y omitir espacios en blanco al inicio y final', () => {
    const longDescription = 'Esta es una descripción muy larga que definitivamente excede los 160 caracteres permitidos para una meta descripción SEO y debería ser truncada automáticamente por la función';
    
    const input = {
      title: 'Título Test',
      description: longDescription
    };

    const result = generateSeo(input);
    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');

    expect(descriptionMeta?.content.length).toBeLessThanOrEqual(160);
  });

  it('debería mantener la descripción original si es menor a 160 caracteres', () => {
    const shortDescription = 'Descripción corta para SEO';
    
    const input = {
      title: 'Título Test',
      description: shortDescription
    };

    const result = generateSeo(input);
    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');

    expect(descriptionMeta?.content).toBe(shortDescription);
    expect(descriptionMeta?.content).toHaveLength(shortDescription.length);
  });

  it('debería generar keywords únicas combinando título y descripción', () => {
    const input = {
      title: 'Receta Saludable Nutritiva',
      description: 'Una receta muy saludable y deliciosa'
    };

    const result = generateSeo(input);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    const keywords = keywordsMeta?.content.split(', ');

    // Verificar que no hay duplicados
    const uniqueKeywords = new Set(keywords);
    expect(keywords?.length).toBe(uniqueKeywords.size);

    // Verificar que contiene palabras de ambos campos
    expect(keywords).toContain('receta');
    expect(keywords).toContain('saludable');
    expect(keywords).toContain('nutritiva');
    expect(keywords).toContain('deliciosa');
  });

  it('debería manejar títulos y descripciones con espacios múltiples', () => {
    const input = {
      title: 'Título   con    espacios',
      description: 'Descripción  con   espacios   múltiples'
    };

    const result = generateSeo(input);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');

    // Las palabras vacías deberían ser filtradas
    expect(keywordsMeta?.content).not.toContain(',,');
    expect(keywordsMeta?.content).toContain('título');
    expect(keywordsMeta?.content).toContain('con');
    expect(keywordsMeta?.content).toContain('espacios');
  });

  it('debería convertir todo a minúsculas para keywords', () => {
    const input = {
      title: 'TÍTULO EN MAYÚSCULAS',
      description: 'DESCRIPCIÓN EN MAYÚSCULAS'
    };

    const result = generateSeo(input);
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');

    expect(keywordsMeta?.content).toBe('título, en, mayúsculas, descripción');
  });

  it('debería manejar strings vacíos', () => {
    const input = {
      title: '',
      description: ''
    };

    const result = generateSeo(input);

    expect(result.es.title).toBe(' | Post saludable');
    
    const keywordsMeta = result.es.metas.find(meta => meta.name === 'keywords');
    expect(keywordsMeta?.content).toBe('');
    
    const descriptionMeta = result.es.metas.find(meta => meta.name === 'description');
    expect(descriptionMeta?.content).toBe('');
  });

  it('debería tener la estructura correcta de salida', () => {
    const input = {
      title: 'Test',
      description: 'Test description'
    };

    const result = generateSeo(input);

    // Verificar estructura principal
    expect(result).toHaveProperty('es');
    expect(result.es).toHaveProperty('title');
    expect(result.es).toHaveProperty('metas');

    // Verificar que metas es un array
    expect(Array.isArray(result.es.metas)).toBe(true);

    // Verificar que cada meta tiene las propiedades correctas
    result.es.metas.forEach(meta => {
      expect(meta).toHaveProperty('content');
      expect(meta).toHaveProperty('name');
      expect(typeof meta.content).toBe('string');
      expect(typeof meta.name).toBe('string');
    });

    // Verificar que contiene exactamente 3 metas
    expect(result.es.metas).toHaveLength(3);

    // Verificar los nombres de las metas
    const metaNames = result.es.metas.map(meta => meta.name);
    expect(metaNames).toContain('keywords');
    expect(metaNames).toContain('image');
    expect(metaNames).toContain('description');
  });
});