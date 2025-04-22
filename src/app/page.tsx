import FoodListClient from '~/components/FoodListClient';

export default function Inicio() {
  return (
    <main className="px-4 sm:px-8">
      <h1 className="text-xl font-bold text-center sm:text-left">
        Comida Justa: ¿Cómo evitar enfermedades, ahorrar tiempo y dinero, al
        mismo tiempo que apoyas al medio ambiente y a tu comunidad?
      </h1>

      <FoodListClient />
    </main>
  );
}
