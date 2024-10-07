import { collections } from "~/firebase/models/postUtils"; // Asegúrate de tener bien importado el acceso a las colecciones.

export async function getCategories() {
  const categoriesSnapshot = await collections.categories().get(); // Suponiendo que tu colección se llama "categories".
  const categories = categoriesSnapshot.docs.map((doc) => {
    // Aquí renombramos la propiedad 'id' a 'categoryId' o algo similar para evitar el conflicto
    return { categoryId: doc.id, ...doc.data() };
  });
  return categories;
}

/*
export const categories = [
    { id: "1", name: "Ensaladas" },
    { id: "2", name: "Vegeratariano" },
    { id: "3", name: "A la parrilla" },
    { id: "4", name: "Pescados y mariscos" },
    { id: "5", name: "Bajos en calorias" },
    { id: "6", name: "Smoothies y Jugos Verdes" },
    { id: "7", name: "Wraps integraless" },
    { id: "8", name: "Sin gluten" },
    { id: "9", name: "Balanceada" }
  ];
*/