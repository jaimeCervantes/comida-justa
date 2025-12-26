export const basicInput = {
  title: "Receta Saludable",
  description: "Una deliciosa receta para mantener una dieta equilibrada",
};

export const basicExpectedOutput = {
  title: "Receta Saludable | Hazlo sano",
  metas: [
    {
      content:
        "receta, saludable, una, deliciosa, para, mantener, dieta, equilibrada",
      name: "keywords",
    },
    {
      content: "",
      name: "image",
    },
    {
      content: "Una deliciosa receta para mantener una dieta equilibrada",
      name: "description",
    },
  ],
};

export const inputWithImage = {
  title: "Smoothie Verde",
  description: "Receta de smoothie nutritivo",
  mediaUrl: "https://example.com/smoothie.jpg",
};

export const longDescriptionInput = {
  title: "Título Test",
  description:
    "Esta es una descripción muy larga que definitivamente excede los 160 caracteres permitidos para una meta descripción SEO y debería ser truncada automáticamente por la función",
};

export const shortDescriptionInput = {
  title: "Título Test",
  description: "Descripción corta para SEO",
};

export const inputWithDuplicateKeywords = {
  title: "Receta Saludable Nutritiva",
  description: "Una receta muy saludable y deliciosa",
};

export const spacedInput = {
  title: "Título   con    espacios",
  description: "Descripción  con   espacios   múltiples",
};

export const uppercaseInput = {
  title: "TÍTULO EN MAYÚSCULAS",
  description: "DESCRIPCIÓN EN MAYÚSCULAS",
};

export const emptyInput = {
  title: "",
  description: "",
};

export const basicStructureInput = {
  title: "Test",
  description: "Test description",
};
